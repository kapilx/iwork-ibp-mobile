import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

export function getAllLookUpsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve all LookUps",
      description:
        "Fetches all LookUps with optional search, sorting, and pagination.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "search",
      required: false,
      description: "Search term to filter LookUps by name.",
      example: "example",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      description: "Field to sort the LookUps by.",
      example: "id",
    }),
    ApiQuery({
      name: "sortOrder",
      required: false,
      description: "Sort order (ASC or DESC).",
      example: "ASC",
    }),
    ApiQuery({
      name: "page",
      required: false,
      description: "Page number for pagination.",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      description:
        "Number of records per page(by default limit is 10 records).",
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "LookUps retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "LookUps retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                lookUpName: { type: "string", example: "Example Name" },
                lookUpKey: { type: "string", example: "example_key" },
                lookUpValueKey: {
                  type: "string",
                  example: "example_value_key",
                },
                lookUpValue: { type: "string", example: "Example Value" },
                description: { type: "string", example: "Example Description" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function createLookUpSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create a new LookUp",
      description: "Creates a new LookUp with the provided details.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload for creating a LookUp.",
      schema: {
        type: "object",
        properties: {
          lookUpName: { type: "string", example: "Example Name" },
          lookUpKey: { type: "string", example: "example_key" },
          lookUpValueKey: { type: "string", example: "example_value_key" },
          lookUpValue: { type: "string", example: "Example Value" },
          description: { type: "string", example: "Example Description" },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "LookUp created successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "LookUp created successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              lookUpName: { type: "string", example: "Example Name" },
              lookUpKey: { type: "string", example: "example_key" },
              lookUpValueKey: { type: "string", example: "example_value_key" },
              lookUpValue: { type: "string", example: "Example Value" },
              description: { type: "string", example: "Example Description" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getLookUpByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a LookUp by ID",
      description: "Fetches a single LookUp by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the LookUp to retrieve.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "LookUp retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "LookUp retrieved successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              lookUpName: { type: "string", example: "Example Name" },
              lookUpKey: { type: "string", example: "example_key" },
              lookUpValueKey: { type: "string", example: "example_value_key" },
              lookUpValue: { type: "string", example: "Example Value" },
              description: { type: "string", example: "Example Description" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "LookUp not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function updateLookUpByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update a LookUp by ID",
      description: "Updates the details of a LookUp by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the LookUp to update.",
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating a LookUp.",
      schema: {
        type: "object",
        properties: {
          lookUpName: { type: "string", example: "Updated Name" },
          lookUpKey: { type: "string", example: "updated_key" },
          lookUpValueKey: { type: "string", example: "updated_value_key" },
          lookUpValue: { type: "string", example: "Updated Value" },
          description: { type: "string", example: "Updated Description" },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "LookUp updated successfully.",
    }),
    ApiResponse({
      status: 404,
      description: "LookUp not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function deleteLookUpByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a LookUp by ID",
      description: "Deletes a LookUp by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the LookUp to delete.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "LookUp deleted successfully.",
    }),
    ApiResponse({
      status: 404,
      description: "LookUp not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getLookUpByValueSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve LookUps by Value",
      description: "Fetches LookUps filtered by their value.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "LookUps retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "LookUps retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                lookUpName: { type: "string", example: "Example Name" },
                lookUpKey: { type: "string", example: "example_key" },
                lookUpValueKey: {
                  type: "string",
                  example: "example_value_key",
                },
                lookUpValue: { type: "string", example: "Example Value" },
                description: { type: "string", example: "Example Description" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No LookUps found for the given value.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getLookUpsByKeySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve LookUps by Key",
      description: "Fetches LookUps filtered by their key.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "LookUps retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "LookUps retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                lookUpName: { type: "string", example: "Example Name" },
                lookUpKey: { type: "string", example: "example_key" },
                lookUpValue: { type: "string", example: "Example Value" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "lookUpKey is required.",
    }),
    ApiResponse({
      status: 404,
      description: "No LookUps found for the given key.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export const getDistinctLookUpNamesSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get distinct lookup names",
      description:
        "Retrieves distinct lookup names from the lookup_data table.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Distinct lookup names retrieved successfully",
    })
  );
};

export function getLookUpsByNamesSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve LookUp records by names",
      description:
        "Fetches LookUp records based on a list of lookup names provided in the request body.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload containing the list of lookup names.",
      required: true,
      schema: {
        type: "object",
        properties: {
          lookupNames: {
            type: "array",
            items: { type: "string" },
            example: [
              "IIRM_ROLE",
              "INDUSTRY_SEGMENT",
              "DOCUMENT_TYPE",
              "COMPANY_TYPE",
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "LookUp records retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "LookUp records retrieved successfully",
          },
          data: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  lookUpValue: { type: "string", example: "Admin" },
                },
              },
            },
            example: {
              IIRM_ROLE: [
                { id: 1, lookUpValue: "Admin" },
                { id: 2, lookUpValue: "User" },
              ],
              INDUSTRY_SEGMENT: [
                { id: 3, lookUpValue: "Technology" },
                { id: 4, lookUpValue: "Finance" },
              ],
              DOCUMENT_TYPE: [
                { id: 5, lookUpValue: "Passport" },
                { id: 6, lookUpValue: "License" },
              ],
              COMPANY_TYPE: [
                { id: 7, lookUpValue: "Private" },
                { id: 8, lookUpValue: "Public" },
              ],
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid request payload.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "lookupNames must be a non-empty array",
          },
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
          message: {
            type: "string",
            example: "An error occurred while retrieving LookUp records",
          },
        },
      },
    })
  );
}
