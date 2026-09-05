import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

// Swagger metadata for the createAddress method
export function createAddressSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create Address",
      description: "Creates a new address with the provided details.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Address creation payload",
      schema: {
        type: "object",
        properties: {
          addressTypeLid: { type: "number", example: 0 },
          address1: { type: "string", example: "SD Road" },
          area: { type: "string", example: "sec-bad" },
          countryId: { type: "number", example: 1 },
          stateId: { type: "number", example: 24 },
          cityId: { type: "number", example: 46 },
          pinCode: { type: "string", example: "500025" },
          email: { type: "string", example: "rohit@divami.com" },
          phoneNumber: { type: "string", example: "7095639485" },
          alternatePhoneNumber: { type: "string", example: "9177184763" },
          supportNumber: { type: "string", example: "1234567890" },
        },
      },
    }),
    ApiResponse({ status: 201, description: "Address created successfully" }),
    ApiResponse({ status: 400, description: "Invalid input data" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

// Swagger metadata for the getAddress method
export const getAddressSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Get address data by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the address",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Address data retrieved successfully",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({ status: 404, description: "Address not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the deleteAddress method
export const deleteAddressSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Delete address by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the address to delete",
      type: Number,
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({ status: 200, description: "Address deleted successfully" }),
    ApiResponse({ status: 404, description: "Address not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the addressList method
export const getAddressesSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Address list with pagination, sorting, and search",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number (default: 1)",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of items per page (default: 10)",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description:
        "Sorting format: field:order (e.g., address1:ASC, cityId:DESC)",
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search term for address details",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "List of addresses retrieved successfully",
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the updateAddress method
export const updateAddressSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Update address by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the address to update",
      type: Number,
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Fields to update in the address",
      schema: {
        type: "object",
        properties: {
          addressTypeLid: { type: "number", example: 0 },
          address1: { type: "string", example: "New SD Road" },
          area: { type: "string", example: "new-sec-bad" },
          countryId: { type: "number", example: 1 },
          stateId: { type: "number", example: 24 },
          cityId: { type: "number", example: 46 },
          pinCode: { type: "string", example: "500026" },
          email: { type: "string", example: "updated@divami.com" },
          phoneNumber: { type: "string", example: "7095639400" },
          alternatePhoneNumber: { type: "string", example: "9177184777" },
          supportNumber: { type: "string", example: "0987654321" },
        },
      },
    }),
    ApiResponse({ status: 200, description: "Address updated successfully" }),
    ApiResponse({ status: 400, description: "Bad Request - Validation Error" }),
    ApiResponse({ status: 404, description: "Address not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for region/list endpoint
export const getRegionListSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Region List",
      description: "Retrieves a list of all regions.",
    }),
    ApiResponse({
      status: 200,
      description: "Region list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Region list retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
               id: { type: "number", example: 1 },
               name: { type: "string", example: "Asia" },
               description: { type: "string", example: "Asian Region"},
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for country/list endpoint
export const getCountryListSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Country List",
      description: "Retrieves a list of all countries.",
    }),
    ApiResponse({
      status: 200,
      description: "Country list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Country list retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                name: { type: "string", example: "India" },
                isoCode: { type: "string", example: "IN" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for country/:regionId endpoint
export const getCountriesByRegionSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Countries by Region",
      description: "Retrieves a list of countries for a specific region.",
    }),
    ApiParam({
      name: "regionId",
      description: "The ID of the region",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Countries retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Countries retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
        
                properties: {
                id: { type: "number", example: 1 },
                name: { type: "string", example: "India" },
                isoCode: { type: "string", example: "IN" },
              },
           
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Region not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for state/:countryId endpoint
export const getStatesByCountrySwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get States by Country",
      description: "Retrieves a list of states for a specific country.",
    }),
    ApiParam({
      name: "countryId",
      description: "The ID of the country",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "States retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "States retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 24 },
                stateCode: { type: "number", example: 24 },
               name: { type: "string", example: "Telangana" },
                countryId: { type: "number", example: 1 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Country not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for city/:stateId endpoint
export const getCitiesByStateSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Cities by State",
      description: "Retrieves a list of cities for a specific state.",
    }),
    ApiParam({
      name: "stateId",
      description: "The ID of the state",
      type: Number,
      example: 24,
    }),
    ApiResponse({
      status: 200,
      description: "Cities retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Cities retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 46 },
                name: { type: "string", example: "Hyderabad" },
                stateId: { type: "number", example: 24 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "State not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};