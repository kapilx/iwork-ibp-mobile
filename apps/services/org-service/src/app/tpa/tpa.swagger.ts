import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { GetTpasDto } from "./dto/get-tpas-query.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";

export function addTpaSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Add a new TPA",
      description:
        "Creates a new TPA with the provided details, including address information.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Details of the TPA to be created.",
      type: CreateTpaDto,
    }),
    ApiResponse({
      status: 201,
      description: "TPA created successfully.",
      schema: {
        example: {
          status: 201,
          message: "TPA created successfully",
          data: {
            id: 153,
            tpaName: "ABC Insurancetrfss",
            displayName: "ABC Insurance",
            companyTypeLid: 19,
            website: "https://www.example.com",
            remarks: "This is a remark",
            statusLid: 80,
            tpaAddresses: [
              {
                id: 1359,
                address1: "123 Main St",
                address2: "Address v23",
                area: "Downtown",
                pinCode: "12345",
                email: "email@1811.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "1234567890",
                countryId: {
                  id: 1,
                  name: "India",
                  isoCode: null,
                },
                stateId: {
                  id: 1,
                  name: "Andhra Pradesh",
                },
                cityId: {
                  id: 1,
                  name: "Visakhapatnam",
                },
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
              },
            ],
            status: {
              id: 80,
              lookUpValue: "Active",
            },
            companyType: {
              id: 19,
              lookUpValue: "Public",
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
    })
  );
}

export function getTpasSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve all TPAs",
      description:
        "Fetches a paginated list of all TPAs with optional search and sorting.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search term to filter TPAs by name.",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description: "Field to sort the TPAs by.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number for pagination.",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description:
        "Number of records per page(by default limit is 10 records).",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Search based on tpa name.",
    }),
    ApiResponse({
      status: 200,
      description: "List of TPAs retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "TPAs retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 145 },
                    tpaName: { type: "string", example: "ABC Insurance" },
                    displayName: { type: "string", example: "ABC Insurance" },
                    status: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 80 },
                        lookUpValue: { type: "string", example: "Active" },
                      },
                    },
                    tpaAddresses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 145 },
                          address1: { type: "string", example: "123 Main St" },
                          city: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                example: "Visakhapatnam",
                              },
                              id: { type: "number", example: 1 },
                            },
                          },
                          state: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                example: "Andhra Pradesh",
                              },
                              stateCode: { type: "string", example: "AP" },
                              id: { type: "number", example: 1 },
                            },
                          },
                          country: {
                            type: "object",
                            properties: {
                              name: { type: "string", example: "India" },
                              isoCode: { type: "string", example: null },
                              id: { type: "number", example: 1 },
                            },
                          },
                          phoneNumber: {
                            type: "string",
                            example: "1234567890",
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
        example: {
          status: 200,
          message: "TPAs retrieved successfully",
          data: {
            data: [
              {
                id: 145,
                tpaName: "ABC Insurance",
                displayName: "ABC Insurance",
                status: {
                  id: 80,
                  lookUpValue: "Active",
                },
                tpaAddresses: [
                  {
                    id: 145,
                    address1: "123 Main St",
                    city: {
                      name: "Visakhapatnam",
                      id: 1,
                    },
                    state: {
                      name: "Andhra Pradesh",
                      stateCode: "AP",
                      id: 1,
                    },
                    country: {
                      name: "India",
                      isoCode: null,
                      id: 1,
                    },
                    phoneNumber: "1234567890",
                  },
                ],
              },
            ],
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

export function getTpaByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a TPA by ID",
      description: "Fetches the details of a specific TPA by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "TPA retrieved successfully.",
      schema: {
        example: {
          status: 200,
          message: "TPA retrieved successfully",
          data: {
            id: 145,
            tpaName: "ABC Insurance",
            displayName: "ABC Insurance",
            companyTypeLid: 19,
            website: "https://www.example.com",
            remarks: "This is a remark",
            statusLid: 80,
            tpaAddresses: [
              {
                id: 1112,
                address1: "123 Main St",
                address2: "Address v23",
                area: "Downtown",
                pinCode: "12345",
                email: "email@1811.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "1234567890",
                countryId: {
                  id: 1,
                  name: "India",
                  isoCode: null,
                },
                stateId: {
                  id: 1,
                  name: "Andhra Pradesh",
                },
                cityId: {
                  id: 1,
                  name: "Visakhapatnam",
                },
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
              },
            ],
            status: {
              id: 80,
              lookUpValue: "Active",
            },
            companyType: {
              id: 19,
              lookUpValue: "Public",
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "TPA not found.",
    })
  );
}

export function updateTpaByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update a TPA by ID",
      description: "Updates the details of a specific TPA by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Details of the TPA to be updated.",
      type: UpdateTpaDto,
      examples: {
        example1: {
          summary: "Sample TPA Updation request",
          value: {
            tpaName: "Example TPA",
            displayName: "Example Display Name",
            companyTypeLid: 19,
            website: "https://example.com",
            remarks: "This is a sample TPA.",
            address: [
              {
                addressTypeLid: 25,
                address1: "123 Main St",
                address2: "Suite 100",
                area: "Downtown",
                pinCode: "123456",
                email: "contact@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "1800123456",
                cityId: 1,
                stateId: 2,
                countryId: 3,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "TPA updated successfully.",
      schema: {
        example: {
          status: 200,
          message: "TPA updated successfully",
          data: {
            id: 145,
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "TPA not found.",
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
    })
  );
}

export function deleteTpaByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a TPA by ID",
      description: "Deletes a specific TPA by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "TPA deleted successfully.",
    }),
    ApiResponse({
      status: 404,
      description: "TPA not found.",
    })
  );
}

export const getCompanyListSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a paginated list of companies",
      description:
        "Fetches a paginated list of companies with optional search and sorting functionality. Requires authentication and 'BD' role.",
    }),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiQuery({
      name: "page",
      required: false,
      type: "number",
      description: "Page number for pagination (default: 1)",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: "number",
      description:
        "Number of records per page (by default limit is 10 records)",
      example: 10,
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: "string",
      description: "Search term to filter companies by name",
      example: "TechCorp",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      type: "string",
      description: "Field to sort by (default: displayName)",
      example: "displayName",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      enum: ["ASC", "DESC"],
      description: "Sort order (default: ASC)",
      example: "ASC",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.tpaCompanyListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.tpaCompanyListRetrieved,
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
                    tpaName: { type: "string", example: "TechCorp" },
                    displayName: {
                      type: "string",
                      example: "Tech Corporation",
                    },
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
      status: 400,
      description: errorMessages.tpaCompanyListNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.tpaCompanyListNotFound,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have the required role",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have permission.",
          },
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
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

export const getCompanyDetailsSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Get company details by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the company to retrieve details",
      type: String,
    }),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiResponse({
      status: 200,
      description: "TPA details retrieved successfully",
      schema: {
        example: {
          status: 200,
          message: "TPA details retrieved successfully",
          data: [
            {
              id: 143,
              tpaName: "hhh",
              displayName: "RLGK",
              tpaAddresses: [
                {
                  id: 1,
                  address1: "testing Contact Details",
                  city: {
                    id: 1,
                    name: "Visakhapatnam",
                  },
                },
              ],
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

export function getTpaContactsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get contacts of a TPA",
      description: "Fetches all contacts associated with a specific TPA.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "tpaId",
      required: true,
      description: "ID of the TPA",
      example: 456,
    }),
    ApiResponse({
      status: 200,
      description: "TPA contacts retrieved successfully.",
      schema: {
        example: {
          status: 200,
          message: "TPA contacts retrieved successfully",
          data: [
            {
              id: 583,
              firstName: "Navanitha",
              lastName: "Makulla",
              displayName: "Navanitha Makulla",
            },
            {
              id: 578,
              firstName: "test tap label",
              lastName: "label",
              displayName: "test tap label label12",
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No contacts found for TPA.",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to fetch TPA contacts.",
    })
  );
}
