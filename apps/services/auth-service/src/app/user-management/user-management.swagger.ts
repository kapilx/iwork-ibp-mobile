import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

export function getUsersSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get users",
      description: "Retrieve paginated list of users with optional filtering by type"
    }),
    ApiQuery({ name: "page", required: false, type: Number, example: 1, description: "Page number" }),
    ApiQuery({ name: "limit", required: false, type: Number, example: 10, description: "Items per page" }),
    ApiQuery({ name: "type", required: false, type: String, description: "User type filter" }),
    ApiResponse({
      status: 200,
      description: "Users retrieved successfully",
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                email: { type: "string" },
                name: { type: "string" },
                type: { type: "string" },
                isActive: { type: "boolean" }
              }
            }
          },
          total: { type: "number" },
          page: { type: "number" },
          limit: { type: "number" }
        }
      }
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

export function createUserSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create user",
      description: "Create a new user in the system"
    }),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({
      status: 201,
      description: "User created successfully",
      schema: {
        type: "object",
        properties: {
          id: { type: "number" },
          email: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          isActive: { type: "boolean"}
        }
      }
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

export function updateUserSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update user",
      description: "Update an existing user by ID"
    }),
    ApiParam({ name: "id", type: Number, description: "User ID" }),
    ApiBody({ type: UpdateUserDto }),
    ApiResponse({
      status: 200,
      description: "User updated successfully",
      schema: {
        type: "object",
        properties: {
          id: { type: "number" },
          email: { type: "string" },
          name: { type: "string" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    }),
    ApiResponse({ status: 404, description: "User not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

export function deleteUserSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete user",
      description: "Soft delete a user by ID"
    }),
    ApiParam({ name: "id", type: Number, description: "User ID" }),
    ApiResponse({
      status: 200,
      description: "User deleted successfully",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "User deleted successfully" }
        }
      }
    }),
    ApiResponse({ status: 404, description: "User not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}
