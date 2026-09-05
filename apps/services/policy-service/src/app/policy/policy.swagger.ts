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
import { CreatePolicyConfigurationDto } from "./dto/create-policy-configuration.dto";
import { CreateEditVersionDto } from "./dto/create-edit-version.dto";
import { UpdatePolicyConfigurationDto } from "./dto/update-policy-configuration.dto";
import { UpdatePolicyConfigurationApprovalDto } from "./dto/update-policy-configuration-approval.dto";
import { ActivatePolicyDto } from "./dto/activate-policy.dto";
import { UpdateEndorsementHeadersDto } from "./dto/update-endorsement-headers.dto";
import { CreateEndorsementFieldMappingDto } from "./dto/create-endorsement-field-mapping.dto";
import {
  PolicySectionApprovalDto,
  PolicySectionSubmissionDto,
} from "./dto/policy-section-approval.dto";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { OWNER_TYPES } from "../../../../../../libs/service-lib/src/lib/constants";
import { TatBucketListItemDto } from "./dto/tat-bucket-list-item.dto";
import { GetPolicyQueryDto } from "./dto/get-all-policy.dto";
import { CreatePolicyDto } from "./dto/policy.dto";
import { UpdatePolicyCoverDto } from "./dto/update-policy-cover.dto";
import { UpdateCautionDepositAccountNumberDto } from "./dto/update-caution-deposit-account-number.dto";
import { MergeCautionDepositDto } from "./dto/merge-caution-deposit.dto";
import { GetEndorsementBatchesDto } from "./dto/get-endorsement-batches.dto";
import { GetPolicyKpiDto } from "./dto/get-policy-kpi.dto";
import { GeneratePerformanceDto } from "./dto/get-policy.dto";
import { GetInsurersBrokerageDto } from "./dto/get-policy.dto";
import { GetPolicyReportDto } from "./dto/get-policy.dto";
import { GetPolicyListDto } from "./dto/get-policy.dto";
import { GetEndorsementStepsDto } from "./dto/get-endorsement-steps.dto";
import { UpdatePolicyDTO } from "./dto/update-policy.dto";
import { UpdateCautionDepositDto } from "./dto/update-caution-deposit.dto";
import { EndorsementNotificationEmail } from "./dto/send-policy-email.dto";
import { PolicyComponentUploadDto } from "./dto/policy-component-upload.dto";
import {
  PolicyCompanyContactDto,
  PolicyInsurerDetailsDto,
  UpdatePolicyContactsDto,
  CreatePolicyContactsDto,
} from "./dto/policy-insurer-details.dto";
import { CONTACT_STATUS } from "../../../../service-lib/src/lib/constants";
import { PolicyTypesResponseDto } from "./dto/policy-types-response.dto";

export const POLICY_SECTION_OPTIONS = [
  "basicDetails",
  "contactDetails",
  "cdDetails",
  "installmentDetails",
  "coversMeta",
  "coversData",
  "linkedPolicies",
  "endorsement",
  "supportTickets",
  "policyDefinitions",
  "documents",
] as const;

export const inceptionCreatePolicySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreatePolicyDto),
    ApiOperation({ summary: "Create inception policy" }),
    ApiBody({
      description: "Inception policy data",
      schema: { $ref: getSchemaPath(CreatePolicyDto) },
    }),
    ApiResponse({
      status: 201,
      description: "Inception policy created successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to create inception policy.",
    }),
  );

export const generateExcelFromJsonSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download asset template Excel",
      description:
        "Generates the fixed asset template and returns it as an Excel file download. No request body required.",
    }),
    ApiResponse({
      status: 200,
      description: "Excel file stream",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: { type: "string", format: "binary" },
          examples: {
            file: {
              summary: "Binary Excel response",
              description:
                "Direct file download (Content-Disposition: attachment).",
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.excelGenerationError,
    }),
  );

export const getAllPoliciesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get all policies" }),
    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policies retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    policyId: { type: "number", example: 1 },
                    policyNumber: { type: "string", example: "POL-2024-001" },
                    companyId: { type: "number", example: 10 },
                    companyName: { type: "string", example: "ABC Corporation" },
                    insurerId: { type: "number", example: 5 },
                    insurerName: { type: "string", example: "XYZ Insurance" },
                    policyType: { type: "string", example: "Group Health" },
                    startDate: { type: "string", format: "date", example: "2024-01-01" },
                    endDate: { type: "string", format: "date", example: "2024-12-31" },
                    premium: { type: "number", example: 50000.00 },
                    sumInsured: { type: "number", example: 1000000.00 },
                    numberOfEmployees: { type: "number", example: 100 },
                    status: { type: "string", example: "Active" },
                    ownerId: { type: "number", example: 25 },
                    ownerName: { type: "string", example: "John Doe" },
                  },
                },
              },
              count: { type: "number", example: 150 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Failed to fetch policies." }),
  );

export const getPolicyByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy by ID" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({
      name: "section",
      required: false,
      enum: POLICY_SECTION_OPTIONS,
      example: "basicDetails",
      description: "Policy detail section to retrieve",
    }),
    ApiResponse({ 
      status: 200, 
      description: "Policy retrieved successfully", 
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policy retrieved successfully" },
          data: {
            type: "object",
            properties: {
              policyId: { type: "number", example: 1 },
              policyNumber: { type: "string", example: "POL-2024-001" },
              companyId: { type: "number", example: 10 },
              companyName: { type: "string", example: "ABC Corporation" },
              insurerId: { type: "number", example: 5 },
              insurerName: { type: "string", example: "XYZ Insurance" },
              policyType: { type: "string", example: "Group Health" },
              startDate: { type: "string", format: "date", example: "2024-01-01" },
              endDate: { type: "string", format: "date", example: "2024-12-31" },
              premium: { type: "number", example: 50000.00 },
              sumInsured: { type: "number", example: 1000000.00 },
              numberOfEmployees: { type: "number", example: 100 },
              numberOfDependents: { type: "number", example: 150 },
              totalLives: { type: "number", example: 250 },
              status: { type: "string", example: "Active" },
              ownerId: { type: "number", example: 25 },
              ownerName: { type: "string", example: "John Doe" },
              basicDetails: { type: "object", nullable: true },
              contactDetails: { type: "object", nullable: true },
              cdDetails: { type: "object", nullable: true },
              installmentDetails: { type: "object", nullable: true },
              coversMeta: { type: "object", nullable: true },
              coversData: { type: "object", nullable: true },
              linkedPolicies: { type: "array", items: { type: "object" }, nullable: true },
              endorsement: { type: "object", nullable: true },
              supportTickets: { type: "array", items: { type: "object" }, nullable: true },
              policyDefinitions: { type: "object", nullable: true },
              documents: { type: "array", items: { type: "object" }, nullable: true },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Policy not found" }),
    ApiResponse({ status: 400, description: "Failed to fetch policy." }),
  );

export const updatePolicyCoverSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdatePolicyCoverDto),
    ApiOperation({ summary: "Update policy covers" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      description: "Policy cover update payload",
      schema: {
        allOf: [
          { $ref: getSchemaPath(UpdatePolicyCoverDto) },
          {
            properties: {
              covers: {
                type: "object",
                additionalProperties: true,
                example: {
                  "5774595": "7",
                  "5774596": "8",
                },
              },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policyCoverUpdated,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyCoverUpdateFailed,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyCoverNotFound,
    }),
  );

export const submitPolicySectionSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(PolicySectionSubmissionDto),
    ApiOperation({ summary: "Submit a policy section for approval" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      description: "Section submission payload",
      schema: { $ref: getSchemaPath(PolicySectionSubmissionDto) },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policySectionSubmitted,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyApprovalStatusUpdateFailed,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyNotFound,
    }),
  );

export const approvePolicySectionSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(PolicySectionApprovalDto),
    ApiOperation({ summary: "Approve or reject a policy section" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      description: "Section approval payload",
      schema: { $ref: getSchemaPath(PolicySectionApprovalDto) },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policySectionApprovalUpdated,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyApprovalStatusUpdateFailed,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyNotFound,
    }),
  );

export const getPolicySectionStatusesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy section approval statuses" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.policySectionStatusesRetrieved,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyApprovalStatusFetchFailed,
    }),
  );

export const getPoliciesByCompanySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policies by company ID" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 10 }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "sort", required: false, type: String }),
    ApiQuery({ name: "searchBy", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policies retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    policyId: { type: "number", example: 1 },
                    policyNumber: { type: "string", example: "POL-2024-001" },
                    policyType: { type: "string", example: "Group Health" },
                    insurerName: { type: "string", example: "XYZ Insurance" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    premium: { type: "number", example: 50000 },
                    sumInsured: { type: "number", example: 1000000 },
                    numberOfEmployees: { type: "number", example: 100 },
                    status: { type: "string", example: "Active" },
                  },
                },
              },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Failed to fetch policies." }),
  );

export const getCompanyPoliciesSummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get company policies summary" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.policiesRetrieved,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.companyNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyNotFound,
    }),
  );

export const getCompanyCautionDepositsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get company caution deposit accounts" }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search by company name, CD account number or policy number",
    }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 20 }),
    ApiQuery({ name: "ownerId", required: false, type: Number }),
    ApiQuery({
      name: "viewBy",
      required: false,
      enum: ["manager", "team"],
    }),
    ApiQuery({ name: "organisationId", required: false, type: Number }),
    ApiQuery({ name: "sbuId", required: false, type: Number }),
    ApiQuery({ name: "verticalId", required: false, type: Number }),
    ApiQuery({ name: "branchId", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.cautionDepositsRetrieved,
      schema: {
        example: {
          data: [
            {
              cautionDepositId: 1,
              policyId: 1,
              companyId: 1,
              companyName: "Acme",
              cdAccount: "CD123",
              policyNumber: "P1",
              amount: 500,
              minimumBalance: 100,
              status: "active",
            },
          ],
          count: 1,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.cautionDepositsFetchFailed,
    }),
  );

export const createCompanyCautionDepositSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Create company caution deposit account" }),
    ApiResponse({
      status: 201,
      description: "Caution deposit account created successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to create caution deposit account",
    }),
  );

export const getCautionDepositByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get caution deposit details by ID" }),
    ApiParam({ name: "id", description: "Caution deposit ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Caution deposit fetched successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Caution deposit fetched successfully" },
          data: {
            type: "object",
            properties: {
              cautionDepositId: { type: "number", example: 1 },
              policyId: { type: "number", example: 10 },
              companyId: { type: "number", example: 5 },
              companyName: { type: "string", example: "ABC Corporation" },
              accountName: { type: "string", example: "ABC Corp CD Account" },
              accountNumber: { type: "string", example: "CD-ACC-0001" },
              bankName: { type: "string", example: "HDFC Bank" },
              branchName: { type: "string", example: "Mumbai Branch" },
              ifscCode: { type: "string", example: "HDFC0001234" },
              openingBalance: { type: "number", example: 100000 },
              currentBalance: { type: "number", example: 95000 },
              minimumBalance: { type: "number", example: 50000 },
              status: { type: "string", example: "Active" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Caution deposit not found",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch caution deposit",
    }),
  );

export const getCautionDepositsByCompanySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get caution deposit accounts for a company" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search by policy number or CD account number",
    }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: "Caution deposits retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Caution deposits retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cautionDepositId: { type: "number", example: 1 },
                    accountName: { type: "string", example: "CD Account 1" },
                    accountNumber: { type: "string", example: "CD-ACC-0001" },
                    policyNumber: { type: "string", example: "POL-2024-001" },
                    openingBalance: { type: "number", example: 100000 },
                    currentBalance: { type: "number", example: 95000 },
                    minimumBalance: { type: "number", example: 50000 },
                    status: { type: "string", example: "Active" },
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
      description: "Failed to fetch caution deposits",
    }),
  );

export const getCautionDepositTransactionsByCautionDepositIdSwaggerMetadata =
  () =>
    applyDecorators(
      ApiBearerAuth("access-token"),
      ApiOperation({
        summary: "Get transactions for a caution deposit",
      }),
      ApiParam({
        name: "cautionDepositId",
        description: "Caution deposit ID",
        type: Number,
      }),
      ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
      ApiQuery({ name: "limit", required: false, type: Number, example: 10 }),
      ApiQuery({
        name: "export",
        required: false,
        type: Boolean,
        example: false,
        description: "Export transactions as an Excel file when true",
      }),
      ApiResponse({
        status: 200,
        description:
          "Caution deposit transactions retrieved successfully. Returns an Excel file when export=true",
      }),
      ApiResponse({
        status: 400,
        description: "Failed to fetch caution deposit transactions",
      }),
    );

export const getPoliciesByOpportunitySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policies by opportunity ID" }),
    ApiParam({
      name: "opportunityId",
      description: "Opportunity ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policies retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                policyId: { type: "number", example: 1 },
                policyNumber: { type: "string", example: "POL-2024-001" },
                companyName: { type: "string", example: "ABC Corporation" },
                insurerName: { type: "string", example: "XYZ Insurance" },
                policyType: { type: "string", example: "Group Health" },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
                premium: { type: "number", example: 50000 },
                status: { type: "string", example: "Active" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Failed to fetch policies." }),
  );

export const createPolicyConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreatePolicyConfigurationDto),
    ApiOperation({ summary: "Create policy configuration" }),
    ApiBody({
      description: "Policy configuration data",
      schema: { $ref: getSchemaPath(CreatePolicyConfigurationDto) },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.policyConfigurationCreated,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyConfigurationCreationFailed,
    }),
  );

export const createEditVersionSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateEditVersionDto),
    ApiOperation({
      summary: "Create edit version of live policy configuration",
      description:
        "Creates an editable version of a live policy configuration. Only one edit version can exist at a time per policy.",
    }),
    ApiBody({
      description: "Policy configuration edit version data",
      schema: { $ref: getSchemaPath(CreateEditVersionDto) },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.policyConfigurationEditVersionCreated,
    }),
    ApiResponse({
      status: 400,
      description:
        "Bad request - Policy not in live status, edit version already exists, or validation failed",
    }),
    ApiResponse({
      status: 404,
      description:
        "Policy configuration not found or required status not found",
    }),
  );

export const updatePolicyConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdatePolicyConfigurationDto),
    ApiOperation({ summary: "Update policy configuration" }),
    ApiParam({ name: "id", description: "Configuration ID", type: Number }),
    ApiBody({
      description: "Updated policy configuration data",
      schema: { $ref: getSchemaPath(UpdatePolicyConfigurationDto) },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policyConfigurationUpdated,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyConfigurationNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyConfigurationUpdateFailed,
    }),
  );

export const getPolicyConfigurationByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy configuration by Policy ID" }),
    ApiParam({ name: "id", description: "Policy ID", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.policyConfigurationRetrieved,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyConfigurationNotFound,
    }),
  );

export const listPolicyConfigurationsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "List policy configurations" }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 10 }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: successMessage.policyConfigurationListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.policyConfigurationListRetrieved },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    configurationId: { type: "number", example: 1 },
                    policyId: { type: "number", example: 10 },
                    policyNumber: { type: "string", example: "POL-2024-001" },
                    companyName: { type: "string", example: "ABC Corporation" },
                    configurationType: { type: "string", example: "Template" },
                    configurationName: { type: "string", example: "Standard Configuration" },
                    status: { type: "string", example: "Active" },
                    approvalStatus: { type: "string", example: "Approved" },
                    createdBy: { type: "string", example: "John Doe" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              count: { type: "number", example: 15 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyConfigurationListRetrievalFailed,
    }),
  );

export const deletePolicyConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Delete policy configuration" }),
    ApiParam({ name: "id", description: "Configuration ID", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.policyConfigurationDeleted,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyConfigurationNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyConfigurationDeletionFailed,
    }),
  );

export const approvalPolicyConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdatePolicyConfigurationApprovalDto),
    ApiOperation({ summary: "Approve or reject policy configuration" }),
    ApiParam({ name: "id", description: "Configuration ID", type: Number }),
    ApiBody({
      description: "Approval data",
      schema: { $ref: getSchemaPath(UpdatePolicyConfigurationApprovalDto) },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policyConfigurationUpdated,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyConfigurationNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyConfigurationUpdateFailed,
    }),
  );

export const activatePolicySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(ActivatePolicyDto),
    ApiOperation({ summary: "Activate policy" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      required: false,
      description:
        "Optional payload. Provide { isActivate: true } to explicitly confirm activation.",
      schema: { $ref: getSchemaPath(ActivatePolicyDto) },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.policyActivated,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.policyNotFound,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.policyActivationFailed,
    }),
  );

export const queueEnrollmentUploadSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Queue enrollment upload" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          documentId: { type: "number" },
          documentType: {
            type: "string",
            description:
              'When set to "policy_employee_bypass_enrollment", all policy-configuration-driven ' +
              "validations and premium calculation are bypassed. The uploaded file must use the " +
              "bypass-mode template (12 columns, including Total Sum Insured and Premium).",
            enum: [
              "policy_employee_enrollment_data",
              "policy_employee_data",
              "policy_employee_bypass_enrollment",
            ],
          },
          enrollmentStartDate: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Optional enrollment window start date",
          },
          enrollmentEndDate: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Optional enrollment window end date",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Upload queued",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: "Upload queued" },
          data: {
            type: "object",
            properties: {
              uploadId: { type: "number", example: 456 },
              policyId: { type: "number", example: 1 },
              documentId: { type: "number", example: 123 },
              status: { type: "string", example: "Queued" },
              queuedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const uploadPolicyComponentConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(PolicyComponentUploadDto),
    ApiOperation({
      summary: "Process policy component configuration Excel upload",
      description:
        "Reads a policy component Excel file from file uploads, processes it, and updates policy configuration data.",
    }),
    ApiBody({
      schema: { $ref: getSchemaPath(PolicyComponentUploadDto) },
    }),
    ApiResponse({ status: 200, description: "Policy components processed" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "File not found" }),
  );

export const listEnrollmentUploadSummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get enrollment upload summary" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({
      name: "tpaData",
      required: false,
      type: String,
      description:
        "Set to any truthy value to fetch only TPA ID upload summaries. Omit to exclude them.",
    }),
    ApiResponse({
      status: 200,
      description: "Summary retrieved",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Summary retrieved" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    uploadId: { type: "number", example: 1 },
                    documentId: { type: "number", example: 123 },
                    fileName: { type: "string", example: "enrollment_data.xlsx" },
                    uploadDate: { type: "string", format: "date-time" },
                    status: { type: "string", example: "Completed" },
                    totalRecords: { type: "number", example: 100 },
                    successCount: { type: "number", example: 95 },
                    failureCount: { type: "number", example: 5 },
                    uploadedBy: { type: "string", example: "John Doe" },
                  },
                },
              },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getPolicyConstraintsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy constraints" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Policy constraints retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policy constraints retrieved successfully" },
          data: {
            type: "object",
            properties: {
              canEditPolicy: { type: "boolean", example: true },
              canDeletePolicy: { type: "boolean", example: false },
              canAddEndorsement: { type: "boolean", example: true },
              canModifyCovers: { type: "boolean", example: true },
              canUploadEnrollment: { type: "boolean", example: true },
              policyStatus: { type: "string", example: "Active" },
              hasActiveEndorsements: { type: "boolean", example: false },
              hasPendingClaims: { type: "boolean", example: true },
              constraints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    constraintType: { type: "string", example: "EditRestriction" },
                    reason: { type: "string", example: "Policy is under approval" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const generateTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Generate policy data template" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({
      name: "mode",
      required: false,
      description:
        'When set to "bypass", returns a simplified 12-column template (Employee ID, Full Name, ' +
        "DOB, Gender, Email, Mobile, Relation, Intake Type, Effective Date, Marital Status, " +
        "Total Sum Insured, Premium). No approved policy configuration is required.",
      example: "bypass",
    }),
    ApiQuery({
      name: "endorsementType",
      required: false,
      description:
        "Only relevant for the bypass template. For a non-financial endorsement " +
        '("NON_FINANCIAL_ENDORSEMENT") the template is the demographic-only UPDATION set ' +
        "(Intake Type, Employee ID, Relation, Full Name, Date of Birth, Gender, IIRM ID, TPA ID) " +
        "with no premium/sum-insured columns, since non-financial endorsements have no premium " +
        "impact. Financial endorsements (or when omitted) return the full 12-column premium template.",
      example: "NON_FINANCIAL_ENDORSEMENT",
    }),
    ApiResponse({
      status: 200,
      description: "Template generated",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Template generated" },
          data: {
            type: "object",
            properties: {
              documentId: { type: "number", example: 123 },
              fileName: { type: "string", example: "policy_template_POL-2024-001.xlsx" },
              downloadUrl: { type: "string", example: "https://example.com/download/123" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Failed to generate template." }),
  );

export const downloadTemplateByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Download data template" }),
    ApiParam({ name: "documentId", description: "Document ID", type: Number }),
    ApiResponse({ status: 200, description: "Template file" }),
    ApiResponse({ status: 404, description: "Template document not found" }),
  );

export const downloadTPAUploadTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download TPA Upload Template",
      description: "Download TPA upload template for policy with custom or default columns",
    }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({
      name: "endorsementId",
      required: false,
      type: Number,
      description: "Endorsement ID (optional)",
    }),
    ApiResponse({ status: 200, description: "TPA upload template downloaded successfully" }),
    ApiResponse({ status: 404, description: "Policy or Endorsement not found" }),
  );

export const uploadEndorsementTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Upload endorsement template" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          insurerId: { type: "number" },
          documentId: { type: "number" },
        },
      },
    }),
    ApiResponse({ status: 201, description: "Template uploaded" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const downloadEndorsementExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Generate endorsement Excel download link" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "insurerId", required: true, type: Number }),
    ApiResponse({ status: 200, description: "Download URL" }),
    ApiResponse({ status: 404, description: "Template not found" }),
  );

export const createEndorsementFieldMappingSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateEndorsementFieldMappingDto),
    ApiOperation({ summary: "Create endorsement field mapping" }),
    ApiBody({
      schema: { $ref: getSchemaPath(CreateEndorsementFieldMappingDto) },
    }),
    ApiResponse({ status: 201, description: "Mapping created" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getAllOpportunitiesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve all policies",
      description:
        "Fetches all policies with optional search, sorting, and pagination.",
    }),
    ...Object.keys(GetPolicyQueryDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetPolicyQueryDto.prototype,
          key,
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetPolicyQueryDto.prototype,
          key,
        )?.example,
      }),
    ),
    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      type: "", // Reference the DTO here
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
    }),
  );
};

export const updateCautionDepositAccountNumberSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateCautionDepositAccountNumberDto),
    ApiOperation({ summary: "Update caution deposit account number" }),
    ApiParam({ name: "id", description: "Caution deposit ID", type: Number }),
    ApiBody({
      description: "Caution deposit account number update payload",
      schema: {
        allOf: [
          { $ref: getSchemaPath(UpdateCautionDepositAccountNumberDto) },
          {
            properties: {
              cdAccountNumber: {
                type: "string",
                example: "CD-ACC-0001",
                description: "Unique account number for the company",
              },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.cautionDepositAccountNumberUpdated,
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.cautionDepositAccountNumberUpdateFailed,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.cautionDepositNotFound,
    }),
    ApiResponse({
      status: 409,
      description: errorMessages.cautionDepositAccountNumberDuplicate,
    }),
  );

export const mergeCautionDepositsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(MergeCautionDepositDto),
    ApiOperation({ 
      summary: "Merge multiple caution deposit accounts into a target account",
      description: "Merges all transactions from source caution deposits into target caution deposit, recalculating balances chronologically. Source accounts will be marked as 'Merged' status."
    }),
    ApiBody({
      description: "Merge caution deposits payload",
      schema: {
        allOf: [
          { $ref: getSchemaPath(MergeCautionDepositDto) },
          {
            properties: {
              sourceCdIds: {
                type: "array",
                items: { type: "number" },
                example: [289, 290, 291],
                description: "Array of source caution deposit IDs to merge",
              },
              targetCDId: {
                type: "number",
                example: 292,
                description: "Target caution deposit ID to merge into",
              },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Caution deposits merged successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Caution deposits merged successfully" },
          data: {
            type: "object",
            properties: {
              targetCDId: { type: "number", example: 292 },
              sourceCdIds: { type: "array", items: { type: "number" }, example: [289, 290, 291] },
              totalTransactionsMerged: { type: "number", example: 15 },
              finalBalance: { type: "number", example: 150000 },
              targetCdAccountNumber: { type: "string", example: "CD-ACC-0292" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to merge caution deposits - validation error or business rule violation",
    }),
    ApiResponse({
      status: 404,
      description: "Source or target caution deposit not found",
    }),
  );

export const getPolicyDashboardDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get dashboard details for a policy" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({
      name: "isNonGroupPolicy",
      required: false,
      type: Boolean,
      description:
        "Set to true to fetch dashboard metrics for non-group policies",
    }),
    ApiResponse({
      status: 200,
      description: "Dashboard data fetched successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch dashboard data.",
    }),
  );

export const listEndorsementBatchesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get endorsement batches" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiResponse({ status: 200, description: "Batches retrieved" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const listEndorsementBatchesTrackerSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get endorsement batch tracker" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description:
        "Sort as <column>:<ASC|DESC> using the grid column keys (e.g. endorsementDate:DESC)",
    }),
    ApiResponse({ status: 200, description: "Batches retrieved" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getPolicyTatSummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get endorsement and claims TAT summary" }),
    ApiQuery({ name: "ownerId", required: false, type: Number }),
    ApiQuery({
      name: "viewBy",
      required: false,
      enum: Object.values(OWNER_TYPES),
    }),
    ApiResponse({
      status: 200,
      description: successMessage.tatSummaryRetrieved,
      schema: {
        example: {
          endorsements: {
            title: "endorsements",
            totalCount: 4,
            buckets: [
              {
                label: "< 7 Days",
                range: { from: 0, to: 7 },
                count: 2,
              },
              {
                label: "< 10 Days",
                range: { from: 8, to: 10 },
                count: 1,
              },
              {
                label: "< 21 Days",
                range: { from: 11, to: 21 },
                count: 1,
              },
              {
                label: "< 30 Days",
                range: { from: 22, to: 30 },
                count: 0,
              },
              {
                label: "< 45 Days",
                range: { from: 31, to: 45 },
                count: 0,
              },
              {
                label: "> 45 Days",
                range: { from: 46, to: null },
                count: 0,
              },
            ],
          },
          claims: {
            title: "claims",
            totalCount: 3,
            buckets: [
              {
                label: "< 7 Days",
                range: { from: 0, to: 7 },
                count: 1,
              },
              {
                label: "< 21 Days",
                range: { from: 11, to: 21 },
                count: 1,
              },
              {
                label: "< 45 Days",
                range: { from: 31, to: 45 },
                count: 1,
              },
              {
                label: "> 45 Days",
                range: { from: 46, to: null },
                count: 0,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.tatSummaryFetchFailed,
    }),
  );

export const getPolicyTatSummaryBySbuSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get endorsement and claims TAT summary broken down by SBU" }),
    ApiQuery({ name: "ownerId", required: false, type: Number }),
    ApiQuery({ name: "orgId", required: false, type: Number }),
    ApiQuery({
      name: "viewBy",
      required: false,
      enum: Object.values(OWNER_TYPES),
    }),
    ApiResponse({
      status: 200,
      description: "TAT summary by SBU retrieved successfully",
      schema: {
        example: {
          endorsements: {
            title: "endorsements",
            bucketLabels: ["< 3 Days", "< 7 Days", "< 14 Days", "> 14 Days"],
            rows: [
              { sbuId: 1, sbuName: "Central Operations", totalCount: 45, buckets: [7, 10, 8, 20] },
              { sbuId: 2, sbuName: "Commercial Lines", totalCount: 12, buckets: [2, 3, 1, 6] },
            ],
          },
          claims: {
            title: "claims",
            bucketLabels: ["< 3 Days", "< 7 Days", "< 14 Days", "> 14 Days"],
            rows: [
              { sbuId: 1, sbuName: "Central Operations", totalCount: 5, buckets: [1, 2, 1, 1] },
              { sbuId: 2, sbuName: "Commercial Lines", totalCount: 3, buckets: [0, 1, 1, 1] },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.tatSummaryFetchFailed,
    }),
  );

export const getPolicyTatBucketsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get active TAT bucket definitions" }),
    ApiQuery({ name: "orgId", required: false, type: Number }),
    ApiQuery({ name: "name", required: false, type: String }),
    ApiExtraModels(TatBucketListItemDto),
    ApiResponse({
      status: 200,
      description: successMessage.tatBucketListRetrieved,
      schema: {
        type: "array",
        items: { $ref: getSchemaPath(TatBucketListItemDto) },
      },
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.tatBucketListFetchFailed,
    }),
  );

export const acknowledgeEndorsementSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Acknowledge endorsement batch" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
    }),
    ApiResponse({ status: 200, description: "Acknowledgement saved" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const listAssetEndorsementBatchesTrackerSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get asset endorsement batch tracker" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description:
        "Sort as <column>:<ASC|DESC> using the grid column keys (e.g. endorsementDate:DESC)",
    }),
    ApiResponse({ status: 200, description: "Batches retrieved" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getPolicyAssetsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy assets" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 20 }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search by Cover Code or Risk Location Details",
    }),
    ApiResponse({
      status: 200,
      description: "Policy assets retrieved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policy assets.",
    }),
  );

export const getPolicySubAssetsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy sub-assets" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 20 }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search by Cover Code or Sub Limit Description",
    }),
    ApiResponse({
      status: 200,
      description: "Policy sub-assets retrieved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policy sub-assets.",
    }),
  );

export const uploadTpaIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Queue employee/dependent TPA ID upload",
      description:
        "Queues background processing of an Excel sheet that must include 'employee_id', 'tpa_id' and 'relation' columns.",
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
    }),
    ApiBody({
      schema: {
        type: "object",
        required: ["documentId", "policyId"],
        properties: {
          documentId: { type: "number" },
          policyId: { type: "number" },
          tpaAcknowledgedDate: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
        },
      },
    }),
    ApiResponse({ status: 202, description: "TPA upload queued" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getTpaIdUploadsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "List queued and processed TPA ID uploads" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 20 }),
    ApiResponse({ status: 200, description: "TPA uploads fetched" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const searchEndorsementBatchesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Search endorsement batches" }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "sort", required: false, type: String }),
    ApiQuery({ name: "searchBy", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: "Batches retrieved",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Batches retrieved" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    endorsementId: { type: "number", example: 1 },
                    policyId: { type: "number", example: 10 },
                    policyNumber: { type: "string", example: "POL-2024-001" },
                    companyName: { type: "string", example: "ABC Corporation" },
                    batchType: { type: "string", example: "Addition" },
                    employeeCount: { type: "number", example: 50 },
                    dependentCount: { type: "number", example: 75 },
                    totalLives: { type: "number", example: 125 },
                    endorsementDate: { type: "string", format: "date" },
                    status: { type: "string", example: "Pending" },
                    createdBy: { type: "string", example: "John Doe" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              count: { type: "number", example: 25 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const bulkUpdatePoliciesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Bulk update policies",
      description:
        "Update multiple policy records with specified field changes",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          recordIds: {
            type: "array",
            items: { type: "number" },
            minItems: 1,
            description: "Array of policy IDs to update",
            example: [1, 2, 3],
          },
          fieldUpdates: {
            type: "object",
            properties: {
              ownerId: { type: "number", nullable: true },
              isgId: { type: "number", nullable: true },
              amId: { type: "number", nullable: true },
              policyStatusLid: { type: "number", nullable: true },
            },
            description: "Fields to update with their new values",
            example: {
              ownerId: 123,
              policyStatusLid: 456,
            },
          },
          userId: {
            type: "number",
            description: "ID of user performing the bulk update",
            example: 789,
          },
        },
        required: ["recordIds", "fieldUpdates", "userId"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Bulk update completed successfully",
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Bulk update completed successfully",
          },
          data: {
            type: "object",
            properties: {
              totalRecords: { type: "number", example: 3 },
              successCount: { type: "number", example: 2 },
              failureCount: { type: "number", example: 1 },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    recordId: { type: "number" },
                    fieldName: { type: "string" },
                    errorCode: { type: "string" },
                    errorMessage: { type: "string" },
                  },
                },
              },
              affectedRecords: {
                type: "array",
                items: { type: "number" },
                example: [1, 2],
              },
              processingDuration: { type: "number", example: 1500 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid input or validation failed",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
  );

// Swagger metadata for endorsement-management-batches endpoint
export const listEndorsementManagementBatchesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "List Endorsement Management Batches",
      description:
        "Retrieves a paginated list of endorsement management batches with filtering and search capabilities.",
    }),

    ApiResponse({
      status: 200,
      description: "Endorsement management batches retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Batches retrieved" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    companyName: { type: "string", example: "SRT10DYP club" },
                    endorsementId: { type: "number", example: 1454 },
                    companyPriority: { type: "string", example: "Low" },
                    policyNumber: { type: "string", example: "312312" },
                    policyType: {
                      type: "string",
                      example: "Group Personal Accident Policy",
                    },
                    policyId: { type: "number", example: 555319 },
                    endorsementDate: {
                      type: "string",
                      example: "2025-12-17T18:30:00.000Z",
                    },
                    TATDate: { type: "number", example: 33 },
                    status: {
                      type: "string",
                      example: "Send Endorsement to Insurer",
                    },
                    statusKey: {
                      type: "string",
                      example: "SEND_ENDORSEMENT_TO_INSURER",
                    },
                    statusLabel: {
                      type: "string",
                      example: "Send Endorsement to Insurer",
                    },
                    currentStepOrder: { type: "number", example: 3 },
                  },
                },
              },
              count: { type: "number", example: 7 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
  );

// Swagger metadata for dashboard-business-performance endpoint
export const getDashboardBusinessPerformanceSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetPolicyKpiDto),
    ApiOperation({
      summary: "Get Dashboard Business Performance",
      description:
        "Retrieves business performance KPI data for the dashboard with organizational hierarchy filtering.",
    }),
    ApiQuery({
      name: "query",
      required: false,
      type: GetPolicyKpiDto,
    }),
    ApiResponse({
      status: 200,
      description: "KPI data fetched successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "KPI data fetched successfully" },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch KPI data",
    }),
  );

// Swagger metadata for new-dashboard-business-performance endpoint
export const getNewDashboardBusinessPerformanceSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetPolicyKpiDto),
    ApiOperation({
      summary: "Get New Dashboard Business Performance",
      description:
        "Retrieves enhanced business performance KPI data with quarterly/monthly breakdowns.",
    }),
    ApiQuery({
      name: "query",
      required: false,
      type: GetPolicyKpiDto,
    }),
    ApiResponse({
      status: 200,
      description: "KPI data fetched successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "KPI data fetched successfully" },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch KPI data",
    }),
  );

// Swagger metadata for dashboard-policy-summary endpoint
export const getDashboardPolicySummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Dashboard Policy Summary",
      description:
        "Retrieves policy summary data for dashboard with time-based filtering.",
    }),

    ApiResponse({
      status: 200,
      description: "Policy summary data fetched successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy summary data fetched successfully",
          },
          data: {
            type: "object",
            properties: {
              policyTypesDistribution: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    iirmPolicyTypeLid: { type: "number", example: 19037 },
                    iirmPolicyType: {
                      type: "string",
                      example: "General Insurance",
                    },
                    premiumAmount: { type: "number", example: 377150 },
                    basicBrokerageAmount: {
                      type: "number",
                      example: 136940.22,
                    },
                    policyCount: { type: "number", example: 17 },
                  },
                },
              },
              policyExpiryTimeline: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", example: "Next 30 Days" },
                    count: { type: "number", example: 0 },
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
      description: "Failed to fetch policy summary data",
    }),
  );

// Swagger metadata for quarterly-dashboard-business-performance endpoint
export const getQuarterlyDashboardBusinessPerformanceSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Quarterly Dashboard Business Performance",
      description:
        "Retrieves quarterly business performance data with hierarchical filtering. " +
        "Pass useLiveData=true to aggregate achieved values live from " +
        "policy/endorsement/reward (same source as the Biz Done report) instead " +
        "of the hourly performance_output ETL table; targets are unaffected.",
    }),

    ApiResponse({
      status: 200,
      description: "Quarterly business performance data fetched successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Quarterly business performance data fetched successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quarter: { type: "string", example: "Q1" },
                achieved: { type: "number", example: 0 },
                target: { type: "number", example: 0 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch quarterly business performance data",
    }),
  );

// Swagger metadata for quarterly-dashboard-business-performance-by-sbu-basis endpoint
export const getQuarterlyDashboardBusinessPerformanceBySbuSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Quarterly Dashboard Business Performance By SBU",
      description:
        "Retrieves quarterly business performance data aggregated by SBU with " +
        "hierarchical filtering. Pass useLiveData=true to aggregate achieved " +
        "values live instead of from the hourly performance_output ETL table. " +
        "Rewards fold into roAchieved and are bucketed by the creating " +
        "employee's SBU, so this breakdown sums back to the quarterly chart.",
    }),

    ApiResponse({
      status: 200,
      description: "Quarterly business performance data by SBU fetched successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Quarterly business performance data by SBU fetched successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sbuId: { type: "number", example: 1 },
                sbuName: { type: "string", example: "SBU A" },
                achieved: { type: "number", example: 200000 },
                target: { type: "number", example: 250000 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch quarterly business performance data by SBU",
    }),
  );

// Swagger metadata for generate-performance-output endpoint
export const generatePerformanceOutputSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GeneratePerformanceDto),
    ApiOperation({
      summary: "Generate Performance Output",
      description:
        "Generates performance output reports for all users for a specified month and year.",
    }),
    ApiQuery({
      name: "query",
      required: false,
      type: GeneratePerformanceDto,
    }),
    ApiResponse({
      status: 200,
      description: "Performance output generated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Performance output generated successfully",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to generate performance output",
    }),
  );

// Swagger metadata for brokerage-to-collect endpoint
export const getBrokerageToCollectSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Brokerage to Collect",
      description:
        "Retrieves list of insurers with brokerage amounts pending collection.",
    }),

    ApiResponse({
      status: 200,
      description: "Brokerage data retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Insurers brokerage to collect" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    insurerId: { type: "number", example: 4934 },
                    insurerName: {
                      type: "string",
                      example: "Bajaj Allianz Life Insurance Company Limited .",
                    },
                    lastWeek: { type: "number", example: 0 },
                    oneWeek: { type: "number", example: 0 },
                    twoWeek: { type: "number", example: 0 },
                    thirtyDays: { type: "number", example: 0 },
                    fortyFiveDays: { type: "number", example: 95263.12 },
                    total: { type: "number", example: 95263.12 },
                  },
                },
              },
              count: { type: "number", example: 5 },
              summary: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    insurerId: {
                      type: "number",
                      nullable: true,
                      example: null,
                    },
                    insurerName: { type: "string", example: "Total" },
                    lastWeek: { type: "number", example: 0 },
                    oneWeek: { type: "number", example: 0 },
                    twoWeek: { type: "number", example: 0 },
                    thirtyDays: { type: "number", example: 380.1 },
                    fortyFiveDays: { type: "number", example: 1149582.22 },
                    total: { type: "number", example: 1149962.32 },
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
      description: "Failed to fetch brokerage data",
    }),
  );

// Swagger metadata for policy-report endpoint
export const getPolicyReportSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Report",
      description:
        "Retrieves policy report data with time and entity filtering.",
    }),

    ApiResponse({
      status: 200,
      description: "Policy report retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy report retrieved successfully",
          },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policy report",
    }),
  );

// Swagger metadata for policy-report-list endpoint
export const getPolicyReportListSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Report List",
      description:
        "Retrieves paginated policy report list with advanced filtering and search.",
    }),

    ApiResponse({
      status: 200,
      description: "Policy report list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy report retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              count: { type: "number", example: 0 },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    serialNumber: { type: "number", example: 1 },
                    customerName: {
                      type: "string",
                      example: "VENUS SAFETY & HEALTH PVT.",
                    },
                    netPremium: { type: "number", example: 789 },
                    grossPremium: { type: "number", example: 1404.42 },
                    premiumCollected: { type: "number", example: 0 },
                    brokerageAmount: {
                      type: "number",
                      nullable: true,
                      example: null,
                    },
                    brokerageCollected: { type: "number", example: 0 },
                    terrorismCommissionAmount: { type: "number", example: 0 },
                    iirmOrganisation: { type: "string", example: "IIRM India" },
                    SBU: { type: "string", example: "Corporate Services" },
                    vertical: { type: "string", example: "Collaboration" },
                  },
                },
              },
              kpiDetails: {
                type: "object",
                properties: {
                  grosspremium: { type: "number", example: 8816546.71 },
                  terrorismcommissionamount: { type: "number", example: 92 },
                  commissionamount: { type: "number", example: 1147484.32 },
                  brokeragecollected: { type: "number", example: 22 },
                  brokeragetobecollected: {
                    type: "number",
                    example: 1147462.32,
                  },
                  netpremium: { type: "number", example: 8579459 },
                  terrorism: { type: "number", example: 245 },
                  other: { type: "number", example: 1121454 },
                  gstamount: { type: "number", example: 137945.71 },
                  commissionamountasenteredbyisg: {
                    type: "number",
                    example: 22,
                  },
                  commissionamountasperiwork: { type: "number", example: 22 },
                  fees: { type: "number", example: 34332798 },
                  commissionterrorism: { type: "number", example: 92 },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policy report list",
    }),
  );

// Swagger metadata for policy-report-excel endpoint
export const getPolicyReportExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Report Excel",
      description: "Generates and downloads policy report as an Excel file.",
    }),

    ApiResponse({
      status: 200,
      description: "Excel report generated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy report excel generated successfully",
          },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to generate Excel report",
    }),
  );

// Swagger metadata for endorsement-steps endpoint
export const listEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "List Endorsement Steps",
      description:
        "Retrieves a paginated list of endorsement steps with search capability.",
    }),

    ApiResponse({
      status: 200,
      description: "Endorsement steps retrieved",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Endorsement steps retrieved" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 6 },
                    label: { type: "string", example: "Client confirmation" },
                    description: {
                      type: "string",
                      example: "Step for processing the client confirmation",
                    },
                    endorsementStepKey: {
                      type: "string",
                      example: "CLIENT_CONFIRMATION",
                    },
                    endorsementStepValue: {
                      type: "string",
                      example: "clientConfirmation",
                    },
                  },
                },
              },
              count: { type: "number", example: 7 },
              page: { type: "number", example: 1 },
              limit: { type: "number", example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch endorsement steps",
    }),
  );

// Swagger metadata for PUT :policyId endpoint
export const updatePolicySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdatePolicyDTO),
    ApiOperation({
      summary: "Update Policy",
      description: "Updates policy information by policy ID.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: "Policy update payload",
      type: UpdatePolicyDTO,
    }),
    ApiResponse({
      status: 200,
      description: "Policy updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Policy updated successfully" },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 404,
      description: "Policy not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
  );

// Swagger metadata for PUT caution-deposit/:id endpoint
export const updateCautionDepositSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateCautionDepositDto),
    ApiOperation({
      summary: "Update Caution Deposit",
      description: "Updates caution deposit balance and details.",
    }),
    ApiParam({
      name: "id",
      description: "Caution Deposit ID",
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: "Caution deposit update payload",
      type: UpdateCautionDepositDto,
    }),
    ApiResponse({
      status: 200,
      description: "Caution deposit account number updated successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Caution deposit account number updated successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 3 },
              companyId: { type: "number", example: 327865 },
              insurerId: { type: "number", example: 4910 },
              cdAccountNumber: { type: "string", example: "CD-ACC-0001" },
              cdAccountName: { type: "string", nullable: true, example: null },
              cdBankName: { type: "string", example: "AXIS BANK" },
              balanceAmount: { type: "number", example: 3964603 },
              remarks: { type: "string", example: "" },
              status: { type: "string", example: "ACTIVE" },
              previousCdAccountName: { type: "string", example: "ABC" },
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
      status: 404,
      description: "Caution deposit not found",
    }),
  );

// Swagger metadata for GET :policyId/caution-deposit endpoint
export const getCautionDepositsByPolicySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Caution Deposits by Policy",
      description:
        "Retrieves all caution deposits associated with a specific policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Caution deposits retrieved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch caution deposits",
    }),
  );

// Swagger metadata for GET contact/:contactId endpoint
export const getPoliciesByContactSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policies by Contact",
      description:
        "Retrieves paginated list of policies associated with a specific contact.",
    }),
    ApiParam({
      name: "contactId",
      description: "Contact ID",
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
    }),
    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policies retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 555404 },
                    policyName: {
                      type: "string",
                      example: "Group Mediclaim Policy",
                    },
                    companyName: {
                      type: "string",
                      nullable: true,
                      example: null,
                    },
                    contact: { type: "string", nullable: true, example: null },
                    opportunityId: { type: "number", example: 821896 },
                    policyType: {
                      type: "string",
                      example: "Group Mediclaim Policy",
                    },
                    status: { type: "string", example: "Generated" },
                    sumInsured: { type: "string", example: "2000" },
                    premium: { type: "string", example: "1000" },
                    brokerage: { type: "string", example: "100.00" },
                    policyFrom: { type: "string", example: "2025-12-04" },
                    policyTo: { type: "string", example: "2898-01-01" },
                    accountManager: {
                      type: "string",
                      nullable: true,
                      example: null,
                    },
                    policyNumber: {
                      type: "string",
                      nullable: true,
                      example: null,
                    },
                  },
                },
              },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policies",
    }),
  );

// Swagger metadata for GET :policyId/insurers endpoint
export const getPolicyInsurersSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Insurers",
      description:
        "Retrieves list of insurers associated with a specific policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Policy Insurers retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy Insurers retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 36440 },
                    insurerName: {
                      type: "string",
                      example: "Go Digit General Insurance Ltd",
                    },
                    displayName: { type: "string", example: "Go Digit" },
                  },
                },
              },
              count: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch insurers",
    }),
  );

// Swagger metadata for GET :policyId/documents endpoint
export const getPolicyDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Documents",
      description:
        "Retrieves paginated list of documents associated with a policy with date filtering.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
    }),
    ApiQuery({
      name: "from",
      required: false,
      type: String,
      description: "Start date filter (ISO format)",
    }),
    ApiQuery({
      name: "to",
      required: false,
      type: String,
      description: "End date filter (ISO format)",
    }),
    ApiResponse({
      status: 200,
      description: "Policy documents retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy documents retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    documentId: { type: "number", example: 123 },
                    documentName: {
                      type: "string",
                      example: "Policy Document.pdf",
                    },
                    documentType: {
                      type: "string",
                      example: "Policy Schedule",
                    },
                    uploadDate: { type: "string", format: "date-time" },
                    uploadedBy: { type: "string", example: "John Doe" },
                    fileSize: { type: "number", example: 1024000 },
                    mimeType: { type: "string", example: "application/pdf" },
                  },
                },
              },
              count: { type: "number", example: 15 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch documents",
    }),
  );

// Swagger metadata for POST :policyId/asset-enrollment-upload endpoint
export const queueAssetEnrollmentUploadSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Queue Asset Enrollment Upload",
      description: "Queues an asset enrollment upload for processing.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: "Asset enrollment upload payload",
      schema: {
        type: "object",
        required: ["documentId", "documentType"],
        properties: {
          documentId: { type: "number", example: 123 },
          documentType: { type: "string", example: "enrollment" },
          assetCount: { type: "number", example: 50 },
          subAssetCount: { type: "number", example: 100 },
          endorsementId: { type: "number", example: 10 },
          osTicketNumber: { type: "string", example: "TICK-12345" },
          endorsementType: { type: "string", example: "addition" },
          endorsementEntryDate: {
            type: "string",
            format: "date",
            example: "2024-01-01",
          },
          isInception: { type: "boolean", example: false },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Upload queued successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
  );

// Swagger metadata for GET :policyId/overview endpoint (from user's list)
export const getPolicyOverviewSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Overview",
      description:
        "Retrieves comprehensive overview of a policy including all related details.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Policy overview retrieved successfully",
    }),
    ApiResponse({
      status: 404,
      description: "Policy not found",
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch policy overview",
    }),
  );

// Swagger metadata for GET :policyId/endorsement-steps endpoint
export const getPolicyEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Policy Endorsement Steps",
      description: "Retrieves all endorsement steps configured for a policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Endorsement steps data received",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Endorsement steps data received",
          },
          data: {
            type: "object",
            properties: {
              endorsementRequestReceived: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 1 },
                  stepLabel: {
                    type: "string",
                    example: "Endorsement Request Received",
                  },
                  isCurrentStep: { type: "boolean", example: true },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      endorsementRequestReceived: {
                        type: "object",
                        properties: {
                          osTicketNumber: { type: "string", example: "" },
                          endorsementRequestReceivedDate: {
                            type: "string",
                            example: "",
                          },
                          endorsementType: { type: "string", example: "" },
                        },
                      },
                    },
                  },
                },
              },
              createEndorsement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 2 },
                  stepLabel: { type: "string", example: "Create Endorsement" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      createEndorsement: {
                        type: "object",
                        properties: {
                          endorsementCreatedDate: {
                            type: "string",
                            example: "",
                          },
                          provisionalEndorsementNumber: {
                            type: "string",
                            example: "",
                          },
                        },
                      },
                      premiumPaymentTerm: {
                        type: "object",
                        properties: {
                          paymentMethod: { type: "string", example: "" },
                          transactionOrChequeNumber: {
                            type: "string",
                            example: "",
                          },
                          paymentDate: { type: "string", example: "" },
                          paymentAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      createEndorsementRemarks: {
                        type: "object",
                        properties: {
                          endorsementDetails: { type: "string", example: "" },
                        },
                      },
                      endorsementSummary: {
                        type: "object",
                        properties: {
                          totalEmployees: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          totalDependents: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          totalLives: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          cdBalance: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                    },
                  },
                },
              },
              sendEndorsementToInsurer: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 3 },
                  stepLabel: {
                    type: "string",
                    example: "Send Endorsement to Insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      sendEndorsementToInsurer: {
                        type: "object",
                        properties: {
                          insurerCommunicationDate: {
                            type: "string",
                            example: "",
                          },
                        },
                      },
                      endorsementDocumentContainer: {
                        type: "object",
                        properties: {
                          fileId: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          fileName: { type: "string", example: "" },
                          generatedDate: { type: "string", example: "" },
                        },
                      },
                      communicationDetails: {
                        type: "object",
                        properties: {
                          communicationDetails: { type: "string", example: "" },
                        },
                      },
                    },
                  },
                },
              },
              receiveInsurerAcknowledgement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 4 },
                  stepLabel: {
                    type: "string",
                    example: "Receive Acknowledgement from insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      acknowledgementFromInsurer: {
                        type: "object",
                        properties: {
                          acknowdgementDate: { type: "string", example: "" },
                          insurerEndorsementNumber: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfEmployees: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfDependents: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          endorsementEffectiveDate: {
                            type: "string",
                            example: "",
                          },
                          incomeEffectiveDate: { type: "string", example: "" },
                        },
                      },
                      premiumDetails: {
                        type: "object",
                        properties: {
                          endorsementPremiumAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          terrorismPremiumAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          gstAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          totalPremiumAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      endorsementPolicyDocumentId: {
                        type: "number",
                        nullable: true,
                        example: null,
                      },
                    },
                  },
                },
              },
              clientConfirmation: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 5 },
                  stepLabel: { type: "string", example: "Client confirmation" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      clientConfirmation: {
                        type: "object",
                        properties: {
                          clientConfirmationDate: {
                            type: "string",
                            example: "",
                          },
                        },
                      },
                      messageDetails: {
                        type: "object",
                        properties: {
                          messageDetails: { type: "string", example: "" },
                        },
                      },
                      clientDocuments: {
                        type: "object",
                        properties: {
                          endorsementData: {
                            type: "object",
                            properties: {
                              endorsementFileId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              endorsementCreatedDate: {
                                type: "string",
                                example: "",
                              },
                              endorsementFileName: {
                                type: "string",
                                example: "",
                              },
                            },
                          },
                          insurerPolicyDocument: {
                            type: "object",
                            properties: {
                              insurerPolicyDocumentId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              insurerPolicyCreatedDate: {
                                type: "string",
                                example: "",
                              },
                              insurerPolicyFileName: {
                                type: "string",
                                example: "",
                              },
                            },
                          },
                        },
                      },
                    },
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
      description: "Failed to fetch endorsement steps",
    }),
  );

// Swagger metadata for GET :policyId/endorsement/:endorsementId/endorsement-steps endpoint
export const getEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Endorsement Steps",
      description:
        "Retrieves endorsement steps for a specific endorsement within a policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Endorsement steps data received",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Endorsement steps data received",
          },
          data: {
            type: "object",
            properties: {
              endorsementRequestReceived: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 1 },
                  stepLabel: {
                    type: "string",
                    example: "Endorsement Request Received",
                  },
                  isCurrentStep: { type: "boolean", example: true },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      endorsementRequestReceived: {
                        type: "object",
                        properties: {
                          osTicketNumber: { type: "string", example: "erty" },
                          endorsementRequestReceivedDate: {
                            type: "string",
                            example: "2026-01-06T07:17:22.937Z",
                          },
                          endorsementType: {
                            type: "string",
                            example: "FINANCIAL_ENDORSEMENT",
                          },
                        },
                      },
                    },
                  },
                },
              },
              createEndorsement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 2 },
                  stepLabel: { type: "string", example: "Create Endorsement" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      createEndorsement: {
                        type: "object",
                        properties: {
                          endorsementCreatedDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          provisionalEndorsementNumber: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      premiumPaymentTerm: {
                        type: "object",
                        properties: {
                          paymentMethod: { type: "string", example: "" },
                          transactionOrChequeNumber: {
                            type: "string",
                            example: "",
                          },
                          paymentDate: { type: "string", example: "" },
                          paymentAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      createEndorsementRemarks: {
                        type: "object",
                        properties: {
                          endorsementDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      endorsementSummary: {
                        type: "object",
                        properties: {
                          totalAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          totalSubAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          total: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          cdBalance: { type: "number", example: 98287 },
                          totalEmployees: { type: "number", example: 0 },
                          totalDependents: { type: "number", example: 0 },
                          totalLives: { type: "number", example: 0 },
                          grossPremium: { type: "number", example: 0 },
                          netPremium: { type: "number", example: 0 },
                          additionCount: { type: "number", example: 0 },
                          deletionCount: { type: "number", example: 0 },
                          notStartedCount: { type: "number", example: 0 },
                          inProgressCount: { type: "number", example: 0 },
                          completedCount: { type: "number", example: 0 },
                        },
                      },
                    },
                  },
                },
              },
              sendEndorsementToInsurer: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 3 },
                  stepLabel: {
                    type: "string",
                    example: "Send Endorsement to Insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      sendEndorsementToInsurer: {
                        type: "object",
                        properties: {
                          insurerCommunicationDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      endorsementDocumentContainer: {
                        type: "object",
                        properties: {
                          fileId: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          fileName: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          generatedDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      communicationDetails: {
                        type: "object",
                        properties: {
                          communicationDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                    },
                  },
                },
              },
              receiveInsurerAcknowledgement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 4 },
                  stepLabel: {
                    type: "string",
                    example: "Receive Acknowledgement from insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      acknowledgementFromInsurer: {
                        type: "object",
                        properties: {
                          acknowdgementDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          insurerEndorsementNumber: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfSubAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          endorsementEffectiveDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          incomeEffectiveDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          noOfEmployees: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfDependents: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      premiumDetails: {
                        type: "object",
                        properties: {
                          endorsementPremiumAmount: {
                            type: "number",
                            example: 0,
                          },
                          terrorismPremiumAmount: {
                            type: "number",
                            example: 0,
                          },
                          gstAmount: { type: "number", example: 0 },
                          totalPremiumAmount: { type: "number", example: 0 },
                        },
                      },
                      endorsementPolicyDocumentId: {
                        type: "number",
                        nullable: true,
                        example: null,
                      },
                    },
                  },
                },
              },
              clientConfirmation: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 5 },
                  stepLabel: { type: "string", example: "Client confirmation" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      clientConfirmation: {
                        type: "object",
                        properties: {
                          clientConfirmationDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      messageDetails: {
                        type: "object",
                        properties: {
                          messageDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      clientDocuments: {
                        type: "object",
                        properties: {
                          endorsementData: {
                            type: "object",
                            properties: {
                              endorsementFileId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              endorsementFileName: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                              endorsementCreatedDate: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                            },
                          },
                          insurerPolicyDocument: {
                            type: "object",
                            properties: {
                              insurerPolicyDocumentId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              insurerPolicyCreatedDate: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                              insurerPolicyFileName: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              tpaIdUpload: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 6 },
                  stepLabel: { type: "string", example: "TPA ID upload" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  isTpaMandatory: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      tpaIdUpload: {
                        type: "object",
                        properties: {
                          tpaFileId: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          tpaIdUploadDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          tpaUploadRemarks: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          tpaFileName: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          isTpaMandatory: { type: "boolean", example: true },
                        },
                      },
                    },
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
      description: "Failed to fetch endorsement steps",
    }),
  );

// Swagger metadata for GET :policyId/asset-endorsement/:endorsementId/endorsement-steps endpoint
export const getAssetEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Asset Endorsement Steps",
      description:
        "Retrieves asset endorsement steps for a specific asset endorsement within a policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Asset Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Asset endorsement steps data received",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Asset endorsement steps data received",
          },
          data: {
            type: "object",
            properties: {
              endorsementRequestReceived: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 1 },
                  stepLabel: {
                    type: "string",
                    example: "Endorsement Request Received",
                  },
                  isCurrentStep: { type: "boolean", example: true },
                  isCompleted: { type: "boolean", example: false },
                  data: {
                    type: "object",
                    properties: {
                      endorsementRequestReceived: {
                        type: "object",
                        properties: {
                          osTicketNumber: {
                            type: "string",
                            example: "ASDFG12345",
                          },
                          endorsementRequestReceivedDate: {
                            type: "string",
                            example: "2025-10-13T14:09:52.519Z",
                          },
                          endorsementType: {
                            type: "string",
                            example: "FINANCIAL_ENDORSEMENT",
                          },
                        },
                      },
                    },
                  },
                },
              },
              createEndorsement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 2 },
                  stepLabel: { type: "string", example: "Create Endorsement" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  data: {
                    type: "object",
                    properties: {
                      createEndorsement: {
                        type: "object",
                        properties: {
                          endorsementCreatedDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          provisionalEndorsementNumber: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      premiumPaymentTerm: {
                        type: "object",
                        properties: {
                          paymentMethod: { type: "string", example: "" },
                          transactionOrChequeNumber: {
                            type: "string",
                            example: "",
                          },
                          paymentDate: { type: "string", example: "" },
                          paymentAmount: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      createEndorsementRemarks: {
                        type: "object",
                        properties: {
                          endorsementDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      endorsementSummary: {
                        type: "object",
                        properties: {
                          totalAssets: { type: "number", example: 0 },
                          totalSubAssets: { type: "number", example: 0 },
                          total: { type: "number", example: 0 },
                          cdBalance: { type: "number", example: 0 },
                          grossPremium: { type: "number", example: 0 },
                          netPremium: { type: "number", example: 0 },
                          additionCount: { type: "number", example: 0 },
                          deletionCount: { type: "number", example: 0 },
                          assetAdditionCount: { type: "number", example: 0 },
                          assetDeletionCount: { type: "number", example: 0 },
                          subAssetAdditionCount: { type: "number", example: 0 },
                          subAssetDeletionCount: { type: "number", example: 0 },
                        },
                      },
                    },
                  },
                },
              },
              sendEndorsementToInsurer: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 3 },
                  stepLabel: {
                    type: "string",
                    example: "Send Endorsement to Insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  data: {
                    type: "object",
                    properties: {
                      sendEndorsementToInsurer: {
                        type: "object",
                        properties: {
                          insurerCommunicationDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      endorsementDocumentContainer: {
                        type: "object",
                        properties: {
                          fileId: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          fileName: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          generatedDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      communicationDetails: {
                        type: "object",
                        properties: {
                          communicationDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                    },
                  },
                },
              },
              receiveInsurerAcknowledgement: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 4 },
                  stepLabel: {
                    type: "string",
                    example: "Receive Acknowledgement from insurer",
                  },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  data: {
                    type: "object",
                    properties: {
                      acknowledgementFromInsurer: {
                        type: "object",
                        properties: {
                          acknowdgementDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          insurerEndorsementNumber: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          noOfSubAssets: {
                            type: "number",
                            nullable: true,
                            example: null,
                          },
                          endorsementEffectiveDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          incomeEffectiveDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      premiumDetails: {
                        type: "object",
                        properties: {
                          endorsementPremiumAmount: {
                            type: "number",
                            example: 0,
                          },
                          terrorismPremiumAmount: {
                            type: "number",
                            example: 0,
                          },
                          gstAmount: { type: "number", example: 0 },
                          totalPremiumAmount: { type: "number", example: 0 },
                        },
                      },
                      endorsementPolicyDocumentId: {
                        type: "number",
                        nullable: true,
                        example: null,
                      },
                    },
                  },
                },
              },
              clientConfirmation: {
                type: "object",
                properties: {
                  stepOrder: { type: "number", example: 5 },
                  stepLabel: { type: "string", example: "Client confirmation" },
                  isCurrentStep: { type: "boolean", example: false },
                  isCompleted: { type: "boolean", example: false },
                  data: {
                    type: "object",
                    properties: {
                      clientConfirmation: {
                        type: "object",
                        properties: {
                          clientConfirmationDate: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      messageDetails: {
                        type: "object",
                        properties: {
                          messageDetails: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      clientDocuments: {
                        type: "object",
                        properties: {
                          endorsementData: {
                            type: "object",
                            properties: {
                              endorsementFileId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              endorsementFileName: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                              endorsementCreatedDate: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                            },
                          },
                          insurerPolicyDocument: {
                            type: "object",
                            properties: {
                              insurerPolicyDocumentId: {
                                type: "number",
                                nullable: true,
                                example: null,
                              },
                              insurerPolicyCreatedDate: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                              insurerPolicyFileName: {
                                type: "string",
                                nullable: true,
                                example: null,
                              },
                            },
                          },
                        },
                      },
                    },
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
      description: "Failed to fetch asset endorsement steps",
    }),
  );

// Swagger metadata for PUT :policyId/endorsement/:endorsementId/endorsement-steps endpoint
export const updateEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update Endorsement Steps",
      description: "Updates the endorsement steps for a specific endorsement.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiBody({
      description: "Endorsement steps update payload",
      schema: {
        type: "object",
        properties: {
          steps: { type: "array", items: { type: "object" } },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Endorsement steps updated",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Endorsement steps updated" },
          data: {
            type: "object",
            description:
              "Returns the complete updated endorsement steps structure including all 6 steps (endorsementRequestReceived, createEndorsement, sendEndorsementToInsurer, receiveInsurerAcknowledgement, clientConfirmation, tpaIdUpload) with their respective data, step orders, and completion states",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to update endorsement steps",
    }),
  );

// Swagger metadata for PUT :policyId/endorsement/:endorsementId/endorsement-headers endpoint
export const updateEndorsementHeadersSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update Endorsement Headers",
      description:
        "Updates the net premium for a specific endorsement, and recomputes/persists the gross premium (using the policy's GST%) and the basic brokerage amount (net premium x the resolved basic brokerage percentage — taken from the endorsement's existing value, falling back to the policy's default).",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiBody({
      description: "Endorsement headers update payload",
      type: UpdateEndorsementHeadersDto,
    }),
    ApiResponse({
      status: 200,
      description: "Endorsement headers updated",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Endorsement headers updated" },
          data: {
            type: "object",
            description: "Returns the complete updated Endorsement entity",
            properties: {
              id: { type: "number", example: 10 },
              policyId: { type: "number", example: 1 },
              netPremium: { type: "number", example: 100000 },
              grossPremium: { type: "number", example: 118000 },
              basicBrokeragePercentage: { type: "number", nullable: true, example: 15 },
              basicBrokerageAmount: { type: "number", nullable: true, example: 15000 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to update endorsement headers",
    }),
  );

// Swagger metadata for PUT :policyId/asset-endorsement/:endorsementId/endorsement-steps endpoint
export const updateAssetEndorsementStepsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update Asset Endorsement Steps",
      description:
        "Updates the asset endorsement steps for a specific asset endorsement.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Asset Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiBody({
      description: "Asset endorsement steps update payload",
      schema: {
        type: "object",
        properties: {
          steps: { type: "array", items: { type: "object" } },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Asset endorsement steps updated",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Asset endorsement steps updated",
          },
          data: {
            type: "object",
            description:
              "Returns the updated asset endorsement steps structure with all step details for assets and sub-assets",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to update asset endorsement steps",
    }),
  );

// Swagger metadata for GET :policyId/caution-deposit/transactions endpoint
export const getCautionDepositTransactionsByPolicySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Caution Deposit Transactions by Policy",
      description:
        "Retrieves paginated list of caution deposit transactions for a specific policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
    }),
    ApiResponse({
      status: 200,
      description: "Caution deposit transactions retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Caution deposit transactions retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 332 },
                    cautionDepositId: { type: "number", example: 212 },
                    transactionType: { type: "string", example: "DEBIT" },
                    transactionTypeValue: { type: "string", example: "DEBIT" },
                    endorsementId: { type: "number", example: 1448 },
                    transactionAmount: { type: "string", example: "300.00" },
                    transactionDate: {
                      type: "string",
                      example: "2025-12-18T05:51:19.292Z",
                    },
                    transactionReferenceId: { type: "string", example: "1448" },
                    referenceType: {
                      type: "string",
                      example: "TRANSACTION_TYPE_NEFT",
                    },
                    referenceTypeValue: { type: "string", example: "NEFT" },
                    bankName: {
                      type: "string",
                      example: "test, Account Number: 7879987",
                    },
                    chequeNumber: {
                      type: "string",
                      nullable: true,
                      example: null,
                    },
                    balanceAmount: { type: "string", example: "98287.00" },
                    policyId: { type: "number", nullable: true, example: null },
                    chequeDate: {
                      type: "string",
                      nullable: true,
                      example: null,
                    },
                    ifscCode: { type: "string", example: "" },
                    remarks: {
                      type: "string",
                      example:
                        "This is a debit transaction recorded for the endorsement with ID: 1448",
                    },
                    cdAccountNumber: { type: "string", example: "7879987" },
                    cdAccountName: { type: "string", example: "786987987" },
                    createdAt: {
                      type: "string",
                      example: "2025-12-18T05:51:19.292Z",
                    },
                    updatedAt: {
                      type: "string",
                      example: "2025-12-18T05:51:19.292Z",
                    },
                    recentlyUpdated: { type: "boolean", example: false },
                    createdBy: {
                      type: "string",
                      example: "Ramakrishna Vurakaranam",
                    },
                  },
                },
              },
              count: { type: "number", example: 2 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch caution deposit transactions",
    }),
  );

// Swagger metadata for POST :policyId/endorsement-notification-email endpoint
export const sendEndorsementNotificationEmailSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(EndorsementNotificationEmail),
    ApiOperation({
      summary: "Send Endorsement Notification Email",
      description:
        "Sends notification email related to policy endorsement activities.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: "Email notification payload",
      type: EndorsementNotificationEmail,
    }),
    ApiResponse({
      status: 200,
      description: "Email sent successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Email sent successfully" },
          data: { type: "null", example: null },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to send email",
    }),
  );

// Swagger metadata for GET :policyId/endorsement/:endorsementId/insurer-document-status endpoint
export const getInsurerDocumentStatusSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Insurer Document Status",
      description:
        "Retrieves the document submission status for a specific endorsement from the insurer.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer document status retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 200,
          },
          message: {
            type: "string",
            example: "Send to insurer document status fetched",
          },
          data: {
            type: "object",
            properties: {
              fileId: {
                type: "number",
                example: 345841,
              },
              fileName: {
                type: "string",
                example: "policy-555319-endorsement.xlsx",
              },
              generatedDate: {
                type: "string",
                format: "date-time",
                example: "2025-12-17T09:12:01.531Z",
              },
              fileStatus: {
                type: "string",
                example: "Completed",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch send to insurer document status",
    }),
  );

// Swagger metadata for POST :policyId/endorsement/:endorsementId/insurer-document-status endpoint
export const updateInsurerDocumentStatusSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Reset Insurer Document Status",
      description:
        "Resets the document submission status for a specific endorsement from the insurer.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: "endorsementId",
      description: "Endorsement ID",
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer document status reset successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Send to insurer document status reset",
          },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to reset send to insurer document status",
    }),
  );

// Swagger metadata for POST faq/bulk-upload endpoint
export const bulkUploadFaqSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Bulk Upload FAQs",
      description:
        "Bulk upload FAQ entries from an Excel file for a specific policy.",
    }),
    ApiBody({
      description: "Bulk FAQ upload payload",
      schema: {
        type: "object",
        required: ["documentId", "policyId"],
        properties: {
          documentId: {
            type: "number",
            example: 123,
            description: "Document ID containing FAQ data",
          },
          policyId: {
            type: "number",
            example: 456,
            description: "Policy ID to associate FAQs with",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "FAQs uploaded and processed successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "FAQs uploaded successfully" },
          data: {
            type: "object",
            properties: {
              totalProcessed: { type: "number", example: 10 },
              successCount: { type: "number", example: 8 },
              failureCount: { type: "number", example: 2 },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    row: { type: "number" },
                    error: { type: "string" },
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
      description: "Failed to upload FAQs",
    }),
  );

export const getPolicyContactsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(PolicyInsurerDetailsDto, PolicyCompanyContactDto),
    ApiOperation({
      summary: "Get policy contact details",
      description:
        "Retrieve insurer or company contact details for a specific policy",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 555433,
    }),
    ApiQuery({
      name: "contactDetails",
      description: "Type of contacts to retrieve",
      enum: [CONTACT_STATUS.INSURERS, CONTACT_STATUS.COMPANY],
      required: true,
      example: "insurers",
    }),
    ApiResponse({
      status: 200,
      description: "Contact details retrieved successfully",
      schema: {
        oneOf: [
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Insurer contacts retrieved successfully",
              },
              data: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: getSchemaPath(PolicyInsurerDetailsDto) },
                  },
                  count: { type: "number", example: 1 },
                },
              },
            },
          },
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Company contacts retrieved successfully",
              },
              data: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: getSchemaPath(PolicyCompanyContactDto) },
                  },
                  count: { type: "number", example: 1 },
                },
              },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters",
      schema: {
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example:
              "Invalid contactDetails parameter. Must be 'insurers' or 'company'",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy not found",
      schema: {
        properties: {
          status: { type: "number", example: 404 },
          message: { type: "string", example: "Policy not found" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        properties: {
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to fetch contact details",
          },
        },
      },
    }),
  );

export const createPolicyContactsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreatePolicyContactsDto),
    ApiOperation({
      summary: "Create policy contact details",
      description:
        "Create new insurer or company contact details for a specific policy",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 555433,
    }),
    ApiBody({
      type: CreatePolicyContactsDto,
      description: "Contact details to create",
      examples: {
        insurerContacts: {
          summary: "Create insurer contacts",
          description: "Example request body for creating insurer contacts",
          value: {
            contactDetails: CONTACT_STATUS.INSURERS,
            contacts: [
              {
                firstName: "Test",
                lastName: "Test",
                displayName: "Test Test",
                companyId: 253509,
                companyLocationId: 437,
                companyBranchId: 285175,
                contactTypeLid: 401,
                department: "HR",
                designation: "BE",
                communicationDetails: [
                  {
                    communicationType: "email",
                    communicationDetails: "email@gmail.com",
                    isPrimary: true,
                  },
                ],
                contactRecordTypeLid: 1203,
              },
            ],
          },
        },
        companyContacts: {
          summary: "Create company contacts",
          description: "Example request body for creating company contacts",
          value: {
            contactDetails: CONTACT_STATUS.COMPANY,
            contacts: [
              {
                firstName: "Fname",
                lastName: "Lname",
                displayName: "Fname Lname",
                companyId: 329192,
                companyLocationId: 441,
                companyBranchId: null,
                contactTypeLid: 1501,
                department: "BE",
                designation: "HR",
                communicationDetails: [
                  {
                    communicationType: "email",
                    communicationDetails: "email@gmail.com",
                    isPrimary: true,
                  },
                ],
                contactRecordTypeLid: 1202,
                statusLid: null,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Contact details created successfully",
      schema: {
        oneOf: [
          {
            properties: {
              status: { type: "number", example: 201 },
              message: {
                type: "string",
                example: "Insurer contacts created successfully",
              },
            },
          },
          {
            properties: {
              status: { type: "number", example: 201 },
              message: {
                type: "string",
                example: "Company contacts created successfully",
              },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "Bad Request - Invalid parameters or missing required fields",
      schema: {
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "companyId is required for company contacts",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy not found",
      schema: {
        properties: {
          status: { type: "number", example: 404 },
          message: { type: "string", example: "Policy not found" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        properties: {
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to create contact details",
          },
        },
      },
    }),
  );

export const updatePolicyContactsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdatePolicyContactsDto),
    ApiOperation({
      summary: "Update policy contact details",
      description:
        "Create, update, or manage insurer or company contact details for a specific policy",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number,
      example: 555433,
    }),
    ApiBody({
      type: UpdatePolicyContactsDto,
      description: "Contact details to update",
      examples: {
        insurerContacts: {
          summary: "Update insurer contacts",
          description: "Example request body for updating insurer contacts",
          value: {
            contactDetails: CONTACT_STATUS.INSURERS,
            contacts: [
              {
                contactId: 1,
                policyId: 555433,
                insurerId: 123,
                address1: "123 Insurance St",
                city: "Colombo",
                contactType: 1501,
                firstName: "John",
                lastName: "Doe",
                displayName: "John Doe",
                department: "Claims",
                designation: "Claims Manager",
                communicationType: 32285,
                communicationValue: "john.doe@insurance.com",
              },
            ],
          },
        },
        companyContacts: {
          summary: "Update company contacts",
          description: "Example request body for updating company contacts",
          value: {
            contactDetails: CONTACT_STATUS.COMPANY,
            contacts: [
              {
                policyId: 555433,
                companyId: 456,
                address1: "456 Company Ave",
                city: "Kandy",
                contactType: 1501,
                firstName: "Jane",
                lastName: "Smith",
                displayName: "Jane Smith",
                department: "HR",
                designation: "HR Manager",
                communicationType: 32285,
                communicationValue: "jane.smith@company.com",
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Contact details updated successfully",
      schema: {
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Insurer contacts updated successfully",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "Bad Request - Invalid parameters or missing required fields",
      schema: {
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "insurerId is required for insurer contacts",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy not found",
      schema: {
        properties: {
          status: { type: "number", example: 404 },
          message: { type: "string", example: "Policy not found" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        properties: {
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to update contact details",
          },
        },
      },
    }),
  );

export const getPolicyTypesSwaggerMetadata = () =>
    applyDecorators(
      ApiBearerAuth("access-token"),
      ApiOperation({ summary: "Retrieve existing policies and unique policy types" }),
      ApiQuery({ name: "ownerId", required: false, type: Number }),
      ApiQuery({ name: "companyId", required: false, type: Number }),
      ApiQuery({ name: "insurerId", required: false, type: Number }),
      ApiQuery({ name: "viewBy", required: false, enum: ["manager", "team"] }),
      ApiResponse({
        status: 200,
        description: successMessage.claimListRetrieved,
        type: PolicyTypesResponseDto,
      }),
      ApiResponse({
        status: 500,
        description: errorMessages.policyClaimFetchFailed,
      })
    )

export const migratePoliciesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "batchSize",
      required: false,
      type: Number,
      description: "Rows to process per batch (default 100 / POLICY_MIGRATION_BATCH_SIZE).",
    }),
    ApiOperation({
      summary: "Migrate policies from source views",
      description:
        "Also triggered automatically once a day by scheduler-service (see the POLICY_MIGRATION_DAILY entry in application_scheduler_configuration), which calls this endpoint with a system-issued token — this endpoint itself has no scheduling logic. Reads four source views directly from the configured source database (POLICY_MIGRATION_SOURCE_VIEW for new policies, POLICY_MIGRATION_UPDATE_SOURCE_VIEW for existing policies whose fields changed at the source, POLICY_MIGRATION_MISSED_COMPANY_SOURCE_VIEW for policies whose company couldn't be resolved at source time, POLICY_MIGRATION_DISABLE_SOURCE_VIEW for policies to disable-for-performance — each may be a comma-separated list of same-shaped views, merged in application code). Create phase: reads the create view, uploads it as-is to S3 under migrate_policy_log/migrate_policy_log_<runId>.csv, validates every row in batches (default 100 rows) against the policy table schema and FK constraints, loads all batches into a single zz_load_policy_<runId> staging table, and inserts valid rows (with generated IDs) via a _ref table into policy and policy_insurer_map — all within a per-batch transaction. Update phase: reads the update view, uploads it to S3 under migrate_policy_log/migrate_policy_log_update_<runId>.csv, matches each row to an existing policy by BOTH id and mig_ref_no (rejecting id-only or mig_ref_no-only matches), requires policy_from/policy_to to be present, snapshots the pre-update row into zz_load_policy_upd_<runId>_bkup for audit purposes, then updates every column the source supplies except mig_ref_no/unique_ref_key (immutable) and ingested_at/ingested_mode (preserved) — stamping updated_via_sql_lid=9401 and updated_via_sql_at=now(). Missed-company phase: reads the missed-company view, uploads it to S3 under migrate_policy_log/migrate_policy_log_missed_company_<runId>.csv, resolves each row's company_unique_id against company.mig_ref_no to obtain company_id (rows that don't resolve are logged as errors and skipped), requires insurer_id and vertical_id (stricter than the create phase, where both are optional), then follows the same staging/_ref/insert pipeline as the create phase into zz_load_policy_missed_company_<runId> and zz_load_policy_missed_company_<runId>_ref. Disable phase: reads the disable view, uploads it to S3 under migrate_policy_log/migrate_policy_log_disable_<runId>.csv, matches each row to an existing policy by BOTH id and mig_ref_no (same dual-key rule as the update phase), validates enabled_for_performance_lid against lookup_data(TOGGLE_TYPE), then updates just that one column via an inline VALUES join (no staging table, since only one column is written). All four phases log every failure to policy_migration_error_log (tagged phase='create'|'update'|'missed_company'|'disable', keyed by migrationRunId). Each phase's success and error records are exported to their OWN pair of S3 CSVs (migrate_policy_error_log/migrate_policy_error_log_<phase>_<runId>.csv and migrate_policy_success_log/migrate_policy_success_log_<phase>_<runId>.csv, phase being create/update/missed_company/disable) — not one combined file — so each phase's Migration Log entry links only to its own data.",
    }),
    ApiResponse({
      status: 200,
      description: "Migration completed — see response for aggregate counts, per-batch status, and the S3 locations of the raw/error CSVs",
      schema: {
        properties: {
          migrationRunId: { type: "string" },
          stagingTable: { type: "string" },
          refTable: { type: "string" },
          totalRows: { type: "number" },
          totalBatches: { type: "number" },
          validRows: { type: "number" },
          errorRows: { type: "number" },
          insertedIntoPolicy: { type: "number" },
          insertedIntoPolicyInsurerMap: { type: "number" },
          errorLogTable: { type: "string" },
          batches: {
            type: "array",
            items: {
              properties: {
                batchNumber: { type: "number" },
                rowsRead: { type: "number" },
                validRows: { type: "number" },
                errorRows: { type: "number" },
                status: { type: "string", enum: ["completed", "failed"] },
                error: { type: "string", nullable: true },
                durationMs: { type: "number", nullable: true },
              },
            },
          },
          rawDataCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the create-phase raw source dump (migrate_policy_log/migrate_policy_log_<runId>.csv), null if the upload failed or S3 isn't configured",
          },
          createErrorCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the create-phase's error CSV (migrate_policy_error_log/migrate_policy_error_log_create_<runId>.csv), null if there were no errors, the upload failed, or S3 isn't configured",
          },
          createSuccessCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the create-phase's success CSV (migrate_policy_success_log/migrate_policy_success_log_create_<runId>.csv), null if there were no successes, the upload failed, or S3 isn't configured",
          },
          updateStagingTable: { type: "string", nullable: true, description: "zz_load_policy_upd_<runId> — null if the update view had no rows" },
          updateBackupTable: { type: "string", nullable: true, description: "zz_load_policy_upd_<runId>_bkup — pre-update snapshot of every row this run touched, null if the update view had no rows" },
          updateTotalRows: { type: "number" },
          updateTotalBatches: { type: "number" },
          updatedRows: { type: "number", description: "Policies actually updated across all batches" },
          updateErrorRows: { type: "number" },
          updateBatches: {
            type: "array",
            items: {
              properties: {
                batchNumber: { type: "number" },
                rowsRead: { type: "number" },
                validRows: { type: "number" },
                errorRows: { type: "number" },
                status: { type: "string", enum: ["completed", "failed"] },
                error: { type: "string", nullable: true },
                durationMs: { type: "number", nullable: true },
              },
            },
          },
          updateRawDataCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the update-phase raw source dump (migrate_policy_log/migrate_policy_log_update_<runId>.csv), null if the upload failed or S3 isn't configured",
          },
          updateErrorCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the update-phase's error CSV (migrate_policy_error_log/migrate_policy_error_log_update_<runId>.csv), null if there were no errors, the upload failed, or S3 isn't configured",
          },
          updateSuccessCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the update-phase's success CSV (migrate_policy_success_log/migrate_policy_success_log_update_<runId>.csv), null if there were no successes, the upload failed, or S3 isn't configured",
          },
          missedCompanyStagingTable: { type: "string", nullable: true, description: "zz_load_policy_missed_company_<runId> — null if the missed-company view had no rows" },
          missedCompanyRefTable: { type: "string", nullable: true, description: "zz_load_policy_missed_company_<runId>_ref — null if the missed-company view had no rows" },
          missedCompanyTotalRows: { type: "number" },
          missedCompanyTotalBatches: { type: "number" },
          missedCompanyValidRows: { type: "number" },
          missedCompanyErrorRows: { type: "number" },
          missedCompanyInsertedIntoPolicy: { type: "number" },
          missedCompanyInsertedIntoPolicyInsurerMap: { type: "number" },
          missedCompanyBatches: {
            type: "array",
            items: {
              properties: {
                batchNumber: { type: "number" },
                rowsRead: { type: "number" },
                validRows: { type: "number" },
                errorRows: { type: "number" },
                status: { type: "string", enum: ["completed", "failed"] },
                error: { type: "string", nullable: true },
                durationMs: { type: "number", nullable: true },
              },
            },
          },
          missedCompanyRawDataCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the missed-company-phase raw source dump (migrate_policy_log/migrate_policy_log_missed_company_<runId>.csv), null if the upload failed or S3 isn't configured",
          },
          missedCompanyErrorCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the missed-company-phase's error CSV (migrate_policy_error_log/migrate_policy_error_log_missed_company_<runId>.csv), null if there were no errors, the upload failed, or S3 isn't configured",
          },
          missedCompanySuccessCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the missed-company-phase's success CSV (migrate_policy_success_log/migrate_policy_success_log_missed_company_<runId>.csv), null if there were no successes, the upload failed, or S3 isn't configured",
          },
          disableTotalRows: { type: "number" },
          disableTotalBatches: { type: "number" },
          disabledRows: { type: "number", description: "Policies whose enabled_for_performance_lid was actually updated across all batches" },
          disableErrorRows: { type: "number" },
          disableBatches: {
            type: "array",
            items: {
              properties: {
                batchNumber: { type: "number" },
                rowsRead: { type: "number" },
                validRows: { type: "number" },
                errorRows: { type: "number" },
                status: { type: "string", enum: ["completed", "failed"] },
                error: { type: "string", nullable: true },
                durationMs: { type: "number", nullable: true },
              },
            },
          },
          disableRawDataCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the disable-phase raw source dump (migrate_policy_log/migrate_policy_log_disable_<runId>.csv), null if the upload failed or S3 isn't configured",
          },
          disableErrorCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the disable-phase's error CSV (migrate_policy_error_log/migrate_policy_error_log_disable_<runId>.csv), null if there were no errors, the upload failed, or S3 isn't configured",
          },
          disableSuccessCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of the disable-phase's success CSV (migrate_policy_success_log/migrate_policy_success_log_disable_<runId>.csv), null if there were no successes, the upload failed, or S3 isn't configured",
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  )

export const getMigrationLogsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "List migration run log entries",
      description:
        "Admin-only. Lists rows from the generic migration_log table — one row per event type (policy_create, policy_update, policy_missed, company_create today; any future system can log its own event types here too, tagged by its own `system` value) per migration run, newest first by default. success_log/error_log are resolved to short-lived (1 hour) presigned S3 URLs at request time, not the raw stored keys.",
    }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 10 }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description: "field:ASC|DESC — sortable fields: id, executedAt, eventType, successCount, errorCount. Defaults to id:DESC.",
      example: "executedAt:DESC",
    }),
    ApiQuery({
      name: "system",
      required: false,
      type: String,
      description: "Filter to a single source system (e.g. finops). Omit to return rows from all systems.",
      example: "finops",
    }),
    ApiResponse({
      status: 200,
      description: "Migration logs retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Migration logs retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 42 },
                    system: { type: "string", example: "finops" },
                    migrationRunId: { type: "string", example: "20260808-020000" },
                    eventType: {
                      type: "string",
                      enum: ["policy_create", "policy_update", "policy_missed", "policy_disable", "company_create"],
                    },
                    executedAt: { type: "string", format: "date-time" },
                    successCount: { type: "number", example: 120 },
                    errorCount: { type: "number", example: 3 },
                    successLogUrl: { type: "string", nullable: true },
                    errorLogUrl: { type: "string", nullable: true },
                  },
                },
              },
              count: { type: "number", example: 48 },
              page: { type: "number", example: 1 },
              limit: { type: "number", example: 10 },
              systems: {
                type: "array",
                items: { type: "string" },
                description: "Every distinct `system` value present in migration_log, for populating a filter dropdown.",
                example: ["finops"],
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  )