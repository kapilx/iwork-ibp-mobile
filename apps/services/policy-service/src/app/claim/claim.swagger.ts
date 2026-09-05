import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { ENDORSEMENT_TAT_FILTER_LABELS } from "../../../../../../libs/service-lib/src/lib/utils/tat.utils";
import {
  UploadClaimResponseDto,
  ClaimDto,
  ClaimListResponseDto,
  ClaimBatchListResponseDto,
  ClaimTemplateResponseDto,
} from "./dto";
import { PolicyTypesResponseDto } from "../policy/dto/policy-types-response.dto";

export const uploadClaimSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Upload claim data from an existing file" }),
    ApiParam({ name: "fileId", type: Number }),
    ApiResponse({
      status: 201,
      description: successMessage.claimUploaded,
      type: UploadClaimResponseDto,
    }),
    ApiResponse({ status: 404, description: errorMessages.claimFileNotFound }),
    ApiResponse({ status: 500, description: errorMessages.claimUploadFailed })
  );

export const getClaimTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Download claim upload template" }),
    ApiQuery({
      name: "claimType",
      required: false,
      type: String,
      description: "Claim type used to select template fields.",
    }),
    ApiResponse({
      status: 200,
      description: "Claims template generated",
      type: ClaimTemplateResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: "No active claim template fields found.",
    })
  );

export const getEmployeeClaimSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Retrieve claim records for an employee" }),
    ApiParam({ name: "employeeId", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeClaimRetrieved,
      type: ClaimDto,
      isArray: true,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.employeeClaimFetchFailed,
    })
  );

export const getPolicyClaimSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Retrieve claim records for a policy" }),
    ApiParam({ name: "policyId", type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({
      name: "tpaId",
      required: false,
      type: Number,
      description:
        "Optional TPA filter. When provided, the policyId path parameter is ignored.",
    }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: successMessage.policyClaimRetrieved,
      type: ClaimListResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.policyClaimFetchFailed,
    })
  );

export const getClaimListSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Retrieve claim records for all policies" }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "sort", required: false, type: String }),
    ApiQuery({ name: "searchBy", required: false, type: String }),
    ApiQuery({ name: "field", required: false, type: String }),
    ApiQuery({ name: "from", required: false, type: String }),
    ApiQuery({ name: "to", required: false, type: String }),
    ApiQuery({ name: "period", required: false, type: String }),
    ApiQuery({ name: "month", required: false, type: String }),
    ApiQuery({ name: "financialYear", required: false, type: Number }),
    ApiQuery({ name: "ownerId", required: false, type: Number }),
    ApiQuery({ name: "viewBy", required: false, enum: ["manager", "team"] }),
    ApiQuery({ name: "organisationId", required: false, type: Number }),
    ApiQuery({ name: "sbuId", required: false, type: Number }),
    ApiQuery({ name: "verticalId", required: false, type: Number }),
    ApiQuery({ name: "branchId", required: false, type: Number }),
    ApiQuery({ name: "companyName", required: false, type: String }),
    ApiQuery({ name: "companyPriority", required: false, type: Number }),
    ApiQuery({ name: "policyType", required: false, type: String }),
    ApiQuery({ name: "claimStatus", required: false, type: [String], isArray: true }),
    ApiQuery({ name: "tatFrom", required: false, type: Number }),
    ApiQuery({ name: "tatTo", required: false, type: Number }),
    ApiQuery({ name: "openTatOnly", required: false, type: Boolean }),
    ApiQuery({
      name: "tatRange",
      required: false,
      enum: ENDORSEMENT_TAT_FILTER_LABELS,
      isArray: true,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.claimListRetrieved,
      type: ClaimListResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.policyClaimFetchFailed,
    })
  );

export const getClaimPolicyTypesSwaggerMetadata = () =>
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
  );

  export const getPolicyClaimBatchesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve claim upload batches for a policy or TPA",
    }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({
      name: "tpaId",
      required: false,
      type: Number,
      description: "Optional TPA filter. When provided, policyId is ignored.",
    }),
    ApiQuery({
      name: "policyId",
      required: false,
      type: Number,
      description: "Optional policy filter used when tpaId is not provided.",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.claimBatchListRetrieved,
      type: ClaimBatchListResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.claimBatchFetchFailed,
    })
  );

export const getDashboardBusinessOverviewSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get dashboard business overview",
      description: "Retrieve business overview data for dashboard"
    }),
    ApiQuery({ name: "userId", required: false, type: Number }),
    ApiQuery({ name: "organisationId", required: false, type: Number }),
    ApiQuery({ name: "sbuId", required: false, type: Number }),
    ApiQuery({ name: "verticalId", required: false, type: Number }),
    ApiQuery({ name: "departmentId", required: false, type: Number }),
    ApiQuery({ name: "branchId", required: false, type: Number }),
    ApiQuery({ name: "quarter", required: false, type: String }),
    ApiQuery({ name: "month", required: false, type: String }),
    ApiQuery({ name: "financialYear", required: false, type: String }),
    ApiQuery({ name: "owner", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: "Business overview data fetched successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Business overview data fetched successfully" },
          data: {
            type: "object",
            properties: {
              businessOverview: {
                type: "object",
                properties: {
                  totalCompanyCount: { type: "number", example: 150 },
                  totalPolicyCount: { type: "number", example: 320 },
                  totalCompaniesPremium: { type: "number", example: 25000000 },
                  totalCompaniesBrokerage: { type: "number", example: 2500000 }
                }
              },
              claimsOverview: {
                type: "object",
                properties: {
                  totalClaimsCount: { type: "number", example: 450 },
                  totalClaimAmount: { type: "number", example: 3500000 },
                  policiesWithClaimsCount: { type: "number", example: 125 },
                  companiesWithClaimsCount: { type: "number", example: 80 }
                }
              }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: "Failed to fetch business overview data"
    })
  );
