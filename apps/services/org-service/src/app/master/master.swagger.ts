import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

export function getEntitiesSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get list of supported master entities",
      description:
        "Returns a list of all supported master entities available for dynamic UI rendering. Each entity includes its name and display label.",
    }),
    ApiResponse({
      status: 200,
      description: "Entities retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Entities retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "organisation" },
                    label: { type: "string", example: "Organisation" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve entities",
    })
  );
}

export function getEntityMetadataSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get metadata for a specific entity",
      description:
        "Returns metadata configuration for the specified entity including parameter list, results list, and form configuration for dynamic UI generation.",
    }),
    ApiParam({
      name: "entity",
      required: true,
      description: "Entity name",
      example: "organisation",
    }),
    ApiResponse({
      status: 200,
      description: "Metadata retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Metadata retrieved successfully" },
          data: {
            type: "object",
            properties: {
              endPoint: { type: "string", example: "organisation" },
              parameterList: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "name" },
                    label: { type: "string", example: "Name" },
                    dataType: { type: "string", example: "string" },
                    options: {
                      type: "array",
                      nullable: true,
                      items: {
                        type: "object",
                        properties: {
                          value: { type: "number", example: 1 },
                          label: { type: "string", example: "IIRM India" },
                        },
                      },
                    },
                  },
                },
              },
              resultsList: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "id" },
                    label: { type: "string", example: "Id" },
                    dataType: { type: "string", example: "string" },
                  },
                },
              },
              formConfig: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    fieldName: { type: "string", example: "name" },
                    dataType: { type: "string", example: "string" },
                    fieldType: { type: "string", example: "input" },
                    optionType: { type: "string", nullable: true, example: "API" },
                    option: { type: "string", nullable: true, example: "/master/country/options" },
                    validation: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve metadata",
    })
  );
}

export function getEntityOptionsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get minimal options list for dropdown/select fields",
      description:
        "Returns a minimal list of options containing only id and name fields, suitable for dropdown/select components. No pagination is applied.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "Entity name",
      example: "organisation",
    }),
    ApiQuery({
      name: "lookupName",
      required: false,
      description: "Lookup name for filtering options",
      example: "region",
    }),
    ApiResponse({
      status: 200,
      description: "Options retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Options retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    name: { type: "string", example: "Option 1" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve options",
    })
  );
}

export function getFiltersByEntitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get filter preferences for the authenticated user",
      description:
        "Retrieves both system default filters and user-specific default filters organized by entity. Returns filter configurations including filter data and table settings.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Filter preferences retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Filter preferences retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              systemDefaultFilter: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    filterName: { type: "string", example: "SYSTEM_ORGANISATION" },
                    filterData: {
                      type: "object",
                      properties: {
                        smartSearchValues: {
                          type: "object",
                          example: { name: "test", city: "Bangalore" },
                        },
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 10 },
                        sortBy: { type: "string", example: "createdAt" },
                        sortOrder: { type: "string", example: "DESC" },
                      },
                    },
                    tableSetting: {
                      type: "object",
                      properties: {
                        tableDefaultSettings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              index: { type: "number", example: 0 },
                              name: { type: "string", example: "id" },
                              hide: { type: "boolean", example: false },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              userDefaultFilter: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    filterName: { type: "string", example: "USER_ORGANISATION" },
                    filterData: {
                      type: "object",
                      properties: {
                        smartSearchValues: {
                          type: "object",
                          example: { name: "custom", status: "active" },
                        },
                        page: { type: "number", example: 1 },
                        limit: { type: "number", example: 20 },
                        sortBy: { type: "string", example: "name" },
                        sortOrder: { type: "string", example: "ASC" },
                      },
                    },
                    tableSetting: {
                      type: "object",
                      properties: {
                        tableDefaultSettings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              index: { type: "number", example: 0 },
                              name: { type: "string", example: "name" },
                              hide: { type: "boolean", example: false },
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
      status: 500,
      description: "Failed to retrieve records",
    })
  );
}

export function saveUserFilterSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Save user filter preference",
      description:
        "Creates a new filter preference for the authenticated user. Filter preferences store user-specific filter configurations and table settings for entities.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Filter preference data",
      schema: {
        type: "object",
        required: ["entity"],
        properties: {
          entity: {
            type: "string",
            example: "ORGANISATION",
            description: "Entity name (will be converted to uppercase)",
          },
          filterName: {
            type: "string",
            example: "My Custom Filter",
            description: "Optional custom filter name",
          },
          filterTypeLid: {
            type: "number",
            example: 2,
            description: "Filter type lookup ID",
          },
          statusLid: {
            type: "number",
            example: 1,
            description: "Status lookup ID",
          },
          defaultFilterLid: {
            type: "number",
            example: 1,
            description: "Default filter lookup ID",
          },
          filterData: {
            type: "object",
            example: { search: "test", sortBy: "name" },
            description: "Filter configuration data",
          },
          tableSetting: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: { type: "number", example: 0 },
                name: { type: "string", example: "id" },
                hide: { type: "boolean", example: false },
              },
            },
            description: "Table column settings",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "User filter preference saved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: {
            type: "string",
            example: "User filter preference saved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              entity: { type: "string", example: "ORGANISATION" },
              userId: { type: "number", example: 123 },
              filterName: { type: "string", example: "123_ORGANISATION" },
              filterData: { type: "object" },
              tableSetting: { type: "array" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to save filter",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

export function updateUserFilterSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update user filter preference for an entity",
      description:
        "Updates an existing filter preference for the authenticated user. Allows modification of filter data and table settings.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "Entity name",
      example: "organisation",
    }),
    ApiBody({
      description: "Updated filter preference data",
      schema: {
        type: "object",
        properties: {
          filterName: {
            type: "string",
            example: "Updated Filter Name",
            description: "Optional filter name",
          },
          filterTypeLid: {
            type: "number",
            example: 2,
            description: "Filter type lookup ID",
          },
          statusLid: {
            type: "number",
            example: 1,
            description: "Status lookup ID",
          },
          defaultFilterLid: {
            type: "number",
            example: 1,
            description: "Default filter lookup ID",
          },
          filterData: {
            type: "object",
            example: { search: "updated", sortBy: "id" },
            description: "Updated filter configuration",
          },
          tableSetting: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: { type: "number", example: 0 },
                name: { type: "string", example: "name" },
                hide: { type: "boolean", example: true },
              },
            },
            description: "Updated table settings",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "User filter updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "User filter updated successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              entity: { type: "string", example: "ORGANISATION" },
              userId: { type: "number", example: 123 },
              filterName: { type: "string", example: "123_ORGANISATION" },
              filterData: { type: "object" },
              tableSetting: { type: "array" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to update filter",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

export function getAllRecordsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve all records",
      description:
        "Fetches all records for the specified entity with optional search, sorting, and pagination.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "search",
      required: false,
      description: "Search term to filter records.",
      example: "example",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      description: "Field to search by.",
      example: "name",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      description: "Field to sort the records by.",
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
    ApiQuery({
      name: "roleKey",
      required: false,
      description: "search by user role key",
      example: "[ROLE_ISG_MANAGER, ROLE_ISG_ADMIN]",
    }),
    ApiResponse({
      status: 200,
      description: "Records retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Records retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    name: { type: "string", example: "Example Name" },
                    description: { type: "string", example: "Example Description" },
                  },
                },
              },
              count: { type: "number", example: 100 },
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

export function getRecordByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a record by ID",
      description:
        "Fetches a single record by its ID for the specified entity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "The name of the entity to retrieve the record for.",
      example: "User",
    }),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the record to retrieve.",
      example: "123",
    }),
    ApiResponse({
      status: 200,
      description: "Record retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Record retrieved successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              name: { type: "string", example: "Example Name" },
              description: { type: "string", example: "Example Description" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Record not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function createRecordSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create a new record",
      description: "Creates a new record for the specified entity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "The name of the entity to create the record for.",
      example: "User",
    }),
    ApiBody({
      description: "Payload for creating a record.",
      schema: {
        type: "object",
        properties: {
          name: { type: "string", example: "Example Name" },
          description: { type: "string", example: "Example Description" },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Record created successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Record created successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              name: { type: "string", example: "Example Name" },
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

export function updateRecordByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update a record by ID",
      description:
        "Updates an existing record by its ID for the specified entity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "The name of the entity to update the record for.",
      example: "User",
    }),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the record to update.",
      example: "123",
    }),
    ApiBody({
      description: "Payload for updating a record.",
      schema: {
        type: "object",
        properties: {
          name: { type: "string", example: "Updated Name" },
          description: { type: "string", example: "Updated Description" },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Record updated successfully.",
    }),
    ApiResponse({
      status: 404,
      description: "Record not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function deleteRecordByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a record by ID",
      description: "Deletes a record by its ID for the specified entity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "entity",
      required: true,
      description: "The name of the entity to delete the record for.",
      example: "User",
    }),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the record to delete.",
      example: "123",
    }),
    ApiResponse({
      status: 200,
      description: "Record deleted successfully.",
    }),
    ApiResponse({
      status: 404,
      description: "Record not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}
