import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { UpdateCompanyPortalConfigDto } from "./dto/update-company-portal-config.dto";
import { CompanyConfigSubmissionDto } from "./dto/company-config-submission.dto";
import { CompanyConfigApprovalDto } from "./dto/company-config-approval.dto";
import { UpdateCompanyPolicyFeatureDocumentDto } from "./dto/update-company-policy-feature-document.dto";
import { CompanyPolicyFeatureDocumentResponseDto } from "./dto/company-policy-feature-document.response.dto";
import { UpdateCompanyOnboardingMailModeDto } from "./dto/update-company-onboarding-mail-mode.dto";
import { CompanyOnboardingMailModeResponseDto } from "./dto/company-onboarding-mail-mode.response.dto";
import { TriggerCompanyOnboardingMailDto } from "./dto/trigger-company-onboarding-mail.dto";

export const getAllCompanyConfigsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Get all company configurations" }),
    ApiResponse({
      status: 200,
      description: "Company configurations retrieved successfully",
    })
  );

export const upsertCompanyPortalConfigurationSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Upsert company portal and authentication configuration",
    }),
    ApiBody({
      description: "Portal configuration payload",
      schema: { $ref: getSchemaPath(UpdateCompanyPortalConfigDto) },
    }),
    ApiResponse({
      status: 200,
      description: "Company portal configuration updated successfully",
    }),
    ApiResponse({ status: 400, description: "Invalid payload" })
  );

export const getCompanyPortalConfigurationSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get the portal configuration for a company",
    }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Company portal configuration retrieved successfully",
    })
  );

export const submitCompanyConfigForApprovalSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Submit company configuration for approval" }),
    ApiBody({
      description: "Submission payload for company configuration approval",
      schema: { $ref: getSchemaPath(CompanyConfigSubmissionDto) },
    }),
    ApiResponse({ status: 200, description: "Submission captured successfully" }),
    ApiResponse({ status: 400, description: "Invalid submission payload" }),
    ApiResponse({ status: 404, description: "Company configuration not found" })
  );

export const approveCompanyConfigSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Approve or reject a company configuration" }),
    ApiBody({
      description: "Approval or rejection payload",
      schema: { $ref: getSchemaPath(CompanyConfigApprovalDto) },
    }),
    ApiResponse({ status: 200, description: "Approval decision recorded" }),
    ApiResponse({ status: 400, description: "Invalid approval payload" }),
    ApiResponse({ status: 404, description: "Company configuration not found" })
  );

export const updateCompanyPolicyFeatureDocumentSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Update company policy feature document ID",
    }),
    ApiBody({
      description: "Company policy feature document payload",
      schema: { $ref: getSchemaPath(UpdateCompanyPolicyFeatureDocumentDto) },
    }),
    ApiResponse({
      status: 200,
      description: "Company policy feature document updated successfully",
    }),
    ApiResponse({ status: 400, description: "Invalid payload" }),
    ApiResponse({ status: 404, description: "Company configuration not found" })
  );

export const getCompanyPolicyFeatureDocumentSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get company policy feature document ID",
    }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Company policy feature document retrieved successfully",
      schema: { $ref: getSchemaPath(CompanyPolicyFeatureDocumentResponseDto) },
    }),
    ApiResponse({ status: 404, description: "Company configuration not found" })
  );

export const getCompanyOnboardingMailModeSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get company initial onboarding mail trigger mode",
    }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Company onboarding mail trigger mode retrieved successfully",
      schema: { $ref: getSchemaPath(CompanyOnboardingMailModeResponseDto) },
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
  );

export const updateCompanyOnboardingMailModeSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Update company initial onboarding mail trigger mode",
    }),
    ApiBody({
      description: "Company onboarding mail trigger mode payload",
      schema: { $ref: getSchemaPath(UpdateCompanyOnboardingMailModeDto) },
    }),
    ApiResponse({
      status: 200,
      description: "Company onboarding mail trigger mode updated successfully",
      schema: { $ref: getSchemaPath(CompanyOnboardingMailModeResponseDto) },
    }),
    ApiResponse({ status: 400, description: "Invalid payload" }),
    ApiResponse({ status: 404, description: "Company not found" }),
  );

export const triggerCompanyOnboardingMailsSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Trigger pending initial onboarding mails for a company",
    }),
    ApiBody({
      description: "Company onboarding mail trigger payload",
      schema: { $ref: getSchemaPath(TriggerCompanyOnboardingMailDto) },
    }),
    ApiResponse({
      status: 200,
      description: "Pending initial onboarding mails triggered successfully",
    }),
    ApiResponse({ status: 400, description: "Invalid payload" }),
    ApiResponse({ status: 404, description: "Company not found" }),
  );
