import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";

export function loginSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "User Login",
      description:
        "Validates user credentials and returns access and refresh tokens.",
    }),
    ApiBody({
      description: "User login credentials",
      schema: {
        type: "object",
        properties: {
          userName: { type: "string", example: "john_doe" },
          password: { type: "string", example: "password123" },
          clientScopeId: {
            type: "string",
            example: "9d7e79c4-8b0e-4ef9-8a27-73b9842b2a3e",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Login successful",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.userLoggedIn },
          data: {
            type: "object",
            properties: {
              accessToken: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  refreshToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
      description: "Invalid credentials",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Invalid Credentials" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "User not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.userNotFound },
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
          message: { type: "string", example: "An unexpected error occurred" },
        },
      },
    })
  );
}

export function getUserDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get User Details",
      description: "Retrieves user details by user ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: successMessage.userDetailsRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.userDetailsRetrieved,
          },
          data: {
            type: "object",
            properties: {
              userId: { type: "number", example: 1 },
              salutation: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  lookUpValue: { type: "string", example: "Mr." },
                },
              },
              firstName: { type: "string", example: "John" },
              lastName: { type: "string", example: "Doe" },
              emailId: { type: "string", example: "example@gmail.com" },
              mobile: { type: "string", example: "1234567890" },
              loginName: { type: "string", example: "johndoe" },
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    name: { type: "string", example: "Admin" },
                    description: { type: "string", example: "Administrator" },
                  },
                },
              },
              country: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  name: { type: "string", example: "India" },
                  isoCode: { type: "string", example: null },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.userNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.userNotFound },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: errorMessages.failedToFindUser },
        },
      },
    })
  );
}

export function crmRedirectTokenSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Generate CRM Redirect Token",
      description: "Generates a short-lived HR portal token for a CRM user redirecting from iWork to a specific company.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "CRM redirect token request",
      schema: {
        type: "object",
        required: ["userId", "companyId"],
        properties: {
          userId: { type: "number", example: 123 },
          companyId: { type: "number", example: 456 },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Token generated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "eyJhbGci..." },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: "Caller is not the lead CRM for this company." }),
    ApiResponse({ status: 404, description: "Company not found." }),
  );
}

export const refreshTokenSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Refresh Access Token",
      description:
        "Validates the refresh token and generates a new access token.",
    }),
    ApiBody({
      description: "Refresh token to validate",
      schema: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description: "The refresh token to validate.",
            example: "your-refresh-token-here",
          },
        },
        required: ["refreshToken"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Access token refreshed successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Token refreshed successfully." },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "new-access-token-here" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Invalid or expired refresh token.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
};
