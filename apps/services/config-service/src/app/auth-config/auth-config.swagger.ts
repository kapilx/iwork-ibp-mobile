import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

export const getAllAuthMethodsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "List all available authentication methods" }),
    ApiResponse({
      status: 200,
      description: "Authentication methods retrieved successfully",
    })
  );

export const getCompanyAuthMethodsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "List authentication methods configured for a company" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Company authentication methods retrieved successfully",
    })
  );

export const getCompanyAuthConfigBySubdomainSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get company configuration and auth methods by subdomain",
    }),
    ApiQuery({
      name: "subdomain",
      description: "Company subdomain",
      required: false,
    }),
    ApiResponse({
      status: 200,
      description:
        "Company configuration and authentication methods retrieved successfully",
    }),
    ApiResponse({ status: 400, description: "Invalid subdomain" }),
    ApiResponse({
      status: 404,
      description: "Company configuration not found for the given subdomain",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve authentication configuration",
    })
  );

export const addAuthMethodToCompanySwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Add authentication method to a company" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiBody({
      description: "Authentication method assignment payload",
      schema: {
        type: "object",
        properties: {
          authMethodId: { type: "number" },
          displayOrder: { type: "number" },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Authentication method added to company successfully",
    }),
    ApiResponse({ status: 400, description: "Failed to add authentication method" })
  );

export const updateCompanyAuthMethodSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Update a company authentication mapping" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiParam({
      name: "authMethodId",
      description: "Authentication method ID",
      type: Number,
    }),
    ApiBody({
      description: "Authentication method update payload",
      schema: {
        type: "object",
        properties: {
          isEnabled: { type: "boolean" },
          displayOrder: { type: "number" },
          companyPortalAuthConfig: { type: "object", additionalProperties: true },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Authentication method updated successfully",
    }),
    ApiResponse({ status: 400, description: "Invalid update payload" }),
    ApiResponse({ status: 404, description: "Mapping not found" })
  );

export const removeAuthMethodFromCompanySwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Remove an authentication method from a company" }),
    ApiParam({ name: "companyId", description: "Company ID", type: Number }),
    ApiParam({
      name: "authMethodId",
      description: "Authentication method ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Authentication method removed successfully",
    })
  );

export const seedDefaultAuthMethodsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Seed default authentication methods" }),
    ApiResponse({
      status: 200,
      description: "Authentication methods seeded successfully",
    })
  );

export const downloadAuthConfigFileSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: "Download file from auth-config uploads",
    }),
    ApiParam({
      name: "documentId",
      description: "Identifier of the uploaded document",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "File stream retrieved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Invalid documentId or unable to stream file",
    })
  );
