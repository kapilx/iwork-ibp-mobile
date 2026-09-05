import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CreateBrokerDto } from "./dto/create-broker.dto";
import { UpdateBrokerDto } from "./dto/update-broker.dto";

export function addBrokerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Add a new broker",
      description:
        "Creates a new broker with the provided details, including address information.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description:
        "Details of the broker to be created, including address information.",
      type: CreateBrokerDto,
    }),
    ApiResponse({
      status: 201,
      description: "Broker created successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Broker created successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 66 },
              brokerName: { type: "string", example: "ABC Brokers Pvt Ltds" },
              displayName: { type: "string", example: "ABC Brokers" },
              website: {
                type: "string",
                example: "https://www.abcbrokers.com",
              },
              remarks: {
                type: "string",
                example: "Leading insurance broker in the region",
              },
              companyTypeLid: { type: "number", example: 19 },
              companyType: {
                type: "object",
                properties: {
                  id: { type: "number", example: 19 },
                  lookUpValue: { type: "string", example: "Public" },
                },
              },
              status: {
                type: "object",
                properties: {
                  id: { type: "number", example: 274 },
                  lookUpValue: { type: "string", example: "Active" },
                },
              },
              brokerAddresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1365 },
                    addressTypeLid: { type: "number", example: 25 },
                    addressType: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 25 },
                        lookUpValue: { type: "string", example: "Office" },
                      },
                    },
                    address1: { type: "string", example: "123 Main St" },
                    countryId: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "India" },
                        isoCode: { type: "string", example: null },
                        id: { type: "number", example: 1 },
                      },
                    },
                    stateId: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Andhra Pradesh" },
                        stateCode: { type: "string", example: "AP" },
                        id: { type: "number", example: 1 },
                      },
                    },
                    cityId: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Visakhapatnam" },
                        id: { type: "number", example: 1 },
                      },
                    },
                    address2: { type: "string", example: "Address v23" },
                    area: { type: "string", example: "Downtown" },
                    pinCode: { type: "string", example: "12345" },
                    phoneNumber: { type: "string", example: "1234567890" },
                    alternatePhoneNumber: {
                      type: "string",
                      example: "0987654321",
                    },
                    email: { type: "string", example: "email@1811.com" },
                    supportNumber: { type: "string", example: "1234567890" },
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
      description: "Invalid input data.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getAllBrokersSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get all brokers",
      description:
        "Retrieves a list of all brokers, including their associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "page",
      required: false,
      example: 1,
      description: "Page number for pagination (optional).",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      example: 10,
      description:
        "Number of records per page(by default limit is 10 records) (optional).",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      example: "brokerName:DESC",
      description: "Field to sort by (optional).",
    }),
    ApiQuery({
      name: "search",
      required: false,
      example: "brokerName:test",
      description: "Search term to filter results (optional).",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      example: "test",
      description: "Search based on brokerName.",
    }),
    ApiResponse({
      status: 200,
      description: "Broker list retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Broker list retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                brokerName: { type: "string", example: "ABC Brokers Pvt Ltd" },
                displayName: { type: "string", example: "ABC Brokers" },
                companyType: { type: "string", example: "Private" },
                website: {
                  type: "string",
                  example: "https://www.abcbrokers.com",
                },
                remarks: {
                  type: "string",
                  example: "Leading insurance broker in the region",
                },
                addresses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number", example: 101 },
                      addressLine1: {
                        type: "string",
                        example: "123 Main Street",
                      },
                      cityId: { type: "number", example: 1 },
                      stateId: { type: "number", example: 2 },
                      countryId: { type: "number", example: 3 },
                      postalCode: { type: "string", example: "123456" },
                    },
                  },
                },
                count: { type: "number", example: 56 },
                totalBrokers: { type: "number", example: 56 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No brokers found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getBrokerByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get a broker by ID",
      description:
        "Retrieves details of a specific broker by its ID, including associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Broker retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Broker retrieved successfully.",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              brokerName: { type: "string", example: "ABC Brokers Pvt Ltd" },
              displayName: { type: "string", example: "ABC Brokers" },
              companyType: { type: "string", example: "Private" },
              website: {
                type: "string",
                example: "https://www.abcbrokers.com",
              },
              remarks: {
                type: "string",
                example: "Leading insurance broker in the region",
              },
              addresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 101 },
                    addressLine1: {
                      type: "string",
                      example: "123 Main Street",
                    },
                    cityId: { type: "number", example: 1 },
                    stateId: { type: "number", example: 2 },
                    countryId: { type: "number", example: 3 },
                    postalCode: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Broker not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function updateBrokerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update a broker",
      description: "Updates the details of an existing broker.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Updated broker details, including addresses.",
      type: UpdateBrokerDto,
    }),
    ApiResponse({
      status: 200,
      description: "Broker updated successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Broker updated successfully." },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              brokerName: { type: "string", example: "ABC Brokers Pvt Ltd" },
              displayName: { type: "string", example: "ABC Brokers" },
              companyType: { type: "string", example: "Private" },
              website: {
                type: "string",
                example: "https://www.abcbrokers.com",
              },
              remarks: { type: "string", example: "Updated broker details" },
              addresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 101 },
                    addressLine1: {
                      type: "string",
                      example: "123 Main Street",
                    },
                    cityId: { type: "number", example: 1 },
                    stateId: { type: "number", example: 2 },
                    countryId: { type: "number", example: 3 },
                    postalCode: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Broker not found.",
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function deleteBrokerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a broker",
      description: "Deletes a broker by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Broker successfully deleted.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Broker successfully deleted." },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Broker not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getBrokerListSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get all Brokers List",
      description:
        "Retrieves a list of all Brokers, including their associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "page",
      required: false,
      example: 1,
      description: "Page number for pagination (optional).",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      example: 10,
      description:
        "Number of records per page(by default limit is 10 records) (optional).",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      example: "createdAt",
      description: "Field to sort by (optional).",
    }),
    ApiQuery({
      name: "sortOrder",
      required: false,
      example: "ASC",
      description: "Sort order: ASC or DESC (optional).",
    }),
    ApiQuery({
      name: "search",
      required: false,
      example: "Test",
      description: "Search term to filter results (optional).",
    }),
    ApiResponse({
      status: 200,
      description: "Broker list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Broker list retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 44 },
                brokerName: { type: "string", example: "Abhi" },
                displayName: { type: "string", example: "Test Display" },
              },
            },
          },
          total: { type: "number", example: 56 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No Brokers found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getBrokerDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get broker details by ID",
      description:
        "Retrieves details of a specific broker by its ID, including associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "ID of the broker",
      example: 44,
    }),
    ApiResponse({
      status: 200,
      description: "Broker details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Broker details retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 44 },
              brokerName: { type: "string", example: "Abhi" },
              displayName: { type: "string", example: "Test Display" },
              brokerAddresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 325 },
                    address1: { type: "string", example: "test nagar ofice" },
                    city: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Visakhapatnam" },
                        id: { type: "number", example: 1 },
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
      status: 404,
      description: "Broker not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getBrokerContactsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get contacts of a broker",
      description: "Fetches all contacts associated with a specific broker.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "brokerId",
      required: true,
      description: "ID of the broker",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Broker contacts retrieved successfully.",
      schema: {
        example: {
          status: 200,
          message: "Broker contacts retrieved successfully",
          data: [
            {
              id: 583,
              firstName: "Navanitha",
              lastName: "Makulla",
              displayName: "Navanitha Makulla",
            },
            {
              id: 578,
              firstName: "Test Broker",
              lastName: "Label",
              displayName: "Test Broker Label",
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No contacts found for broker.",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to fetch broker contacts.",
    })
  );
}
