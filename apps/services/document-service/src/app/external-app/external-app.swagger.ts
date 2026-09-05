import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";

// Swagger metadata for POST /external-app-sso/magic-url endpoint
export const getExternalAppMagicUrlSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get External App Magic URL",
      description:
        "Generates a one-time magic URL or result URL for seamless SSO access to an external application. " +
        "Supports two auth flows: JWT (iConnect, Poppins) and SESSION (Good Health TPA E-Card). " +
        "For JWT flow, only appKey is required. For SESSION flow, dynamicFields must be provided.",
    }),

    ApiBody({
      description: "External application identifier and optional dynamic fields",
      schema: {
        type: "object",
        required: ["appKey"],
        properties: {
          appKey: {
            type: "string",
            example: "poppins",
            description: "External application key/label (e.g., 'poppins', 'iconnect', 'ecard')",
          },
          dynamicFields: {
            type: "object",
            nullable: true,
            description:
              "Optional dynamic fields for payload template resolution. " +
              "Required for SESSION auth_type apps where credentials/data come from the frontend.",
            example: {
              userName: "IIRMHO",
              password: "IIRMHO",
              encrptedKey: "W{dH:}4eX!@hT%cBSY)!-7$#L6HC2",
              policyNumber: "HG00003083000107",
              policyCommencementDate: "01-08-2025",
              policyValideUpdate: "31-07-2026",
              tpaId: "GHRS0100085017",
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 200,
      description: "Magic URL / Result URL generated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Magic URL generated successfully",
          },
          data: {
            type: "object",
            properties: {
              magicUrl: {
                type: "string",
                example:
                  "https://external-app.example.com/auth/magic?token=abc123xyz",
              },
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: "Bad Request",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "User email not found in request",
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: "Unauthorized",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: {
            type: "string",
            example: "Authorization token not provided",
          },
        },
      },
    }),

    ApiResponse({
      status: 403,
      description: "Forbidden",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example:
              "Access Denied for external application 'ecard'",
          },
        },
      },
    }),

    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to generate magic URL",
          },
        },
      },
    }),
  );
