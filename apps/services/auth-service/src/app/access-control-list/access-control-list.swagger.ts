import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

export function getAclMetadataSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get ACL metadata or role ACL",
      description: "Retrieve ACL metadata for all roles or specific role ACL if roleId is provided"
    }),
    ApiQuery({ name: "role", required: false, type: Number, description: "Role ID to get specific role ACL" }),
    ApiResponse({
      status: 200,
      description: "ACL data retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "ACL metadata retrieved successfully" },
          data: {
            type: "object",
            description: "ACL metadata or role ACL data",
            example: {
              "aclCategoryId": 10,
              "aclCatActionMapIds": [
                37,
                38,
                39,
                40,
                41,
                42
              ]
            },
          }
        }
      }
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

export function updateRoleAclSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update role ACL",
      description: "Update access control list for a specific role"
    }),
    ApiParam({ name: "roleId", type: Number, description: "Role ID" }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          aclIds: {
            type: "array",
            items: { type: "number" },
            example: [1, 2, 3, 4, 5]
          }
        },
        required: ["aclIds"]
      }
    }),
    ApiResponse({
      status: 200,
      description: "Role ACL updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Role ACL updated successfully" }
        }
      }
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

export function getUserPermissionsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get User Permissions",
      description:
        "Retrieves the permissions for a specific user based on their roles and access control mappings.",
    }),
    ApiResponse({
      status: 200,
      description: "Permissions retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Permissions retrieved successfully.",
          },
          data: {
            type: "object",
            properties: {
              roleId: { type: "number", example: 1 },
              roleName: { type: "string", example: "Admin" },
              access: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    read: { type: "boolean", example: true },
                    write: { type: "boolean", example: false },
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
      description: "Unauthorized. Invalid or expired token.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 401 },
          message: { type: "string", example: "Invalid or expired token." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}
