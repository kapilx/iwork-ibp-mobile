import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { CompanyInsurerQueryDto } from "./dto/company-insurer-query.dto";
import {
  CompanyInsurerDto,
  CompanyInsurerListResponseDto,
} from "./dto/company-insurer.dto";

export function addInsurerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Add a new insurer",
      description:
        "Creates a new insurer with the provided details, including address information.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description:
        "Details of the insurer to be created, including address information.",
      schema: {
        type: "object",
        properties: {
          insurerName: { type: "string", example: "sagar 123" },
          displayName: { type: "string", example: "Test Display" },
          companyTypeLid: { type: "number", example: 19 },
          website: { type: "string", example: "http://example.com" },
          isLifeLid: { type: "number", example: 83 },
          companyTagLid: { type: "number", example: 21 },
          insureCode: { type: "string", example: "ABC" },
          remarks: { type: "string", example: "Test remarks" },
          address: {
            type: "array",
            items: {
              type: "object",
              properties: {
                addressTypeLid: { type: "number", example: 25 },
                address1: { type: "string", example: "test nagar ofice" },
                address2: { type: "string", example: "SD Road" },
                countryId: { type: "number", example: 1 },
                stateId: { type: "number", example: 1 },
                cityId: { type: "number", example: 1 },
                area: { type: "string", example: "test" },
                pinCode: { type: "string", example: "92912" },
                phoneNumber: { type: "string", example: "1234567890" },
                alternatePhoneNumber: { type: "string", example: "1234567890" },
                email: { type: "string", example: "test@gmail.com" },
                supportNumber: { type: "string", example: "test" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Insurer successfully created.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Insurer successfully created." },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 211 },
              insurerName: { type: "string", example: "sagar 123" },
              displayName: { type: "string", example: "Test Display" },
              companyTypeLid: { type: "number", example: 19 },
              companyTag: {
                type: "object",
                properties: {
                  id: { type: "number", example: 21 },
                  lookUpValue: { type: "string", example: "Preferred" },
                },
              },
              companyType: {
                type: "object",
                properties: {
                  id: { type: "number", example: 19 },
                  lookUpValue: { type: "string", example: "Public" },
                },
              },
              isLife: {
                type: "object",
                properties: {
                  id: { type: "number", example: 83 },
                  lookUpValue: { type: "string", example: "Yes" },
                },
              },
              status: {
                type: "object",
                properties: {
                  id: { type: "number", example: 85 },
                  lookUpValue: { type: "string", example: "Active" },
                },
              },
              website: { type: "string", example: "http://example.com" },
              companyTagLid: { type: "number", example: 21 },
              remarks: { type: "string", example: "Test remarks" },
              insureCode: { type: "string", example: "ABC" },
              policy: { type: "array", items: { type: "object" }, example: [] },
              insurerAddresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1364 },
                    addressTypeLid: { type: "number", example: 25 },
                    addressType: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 25 },
                        lookUpValue: { type: "string", example: "Office" },
                      },
                    },
                    address1: { type: "string", example: "test nagar ofice" },
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
                    address2: { type: "string", example: "SD Road" },
                    area: { type: "string", example: "test" },
                    pinCode: { type: "string", example: "92912" },
                    phoneNumber: { type: "string", example: "1234567890" },
                    alternatePhoneNumber: {
                      type: "string",
                      example: "1234567890",
                    },
                    email: { type: "string", example: "test@gmail.com" },
                    supportNumber: { type: "string", example: "test" },
                  },
                },
              },
              insurerContacts: {
                type: "array",
                items: { type: "object", properties: {} },
              },
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

export function getAllInsurersSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get all insurers",
      description:
        "Retrieves a list of all insurers, including their associated addresses.",
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
        "Number of records per page (optional)(by default limit is 10 records).",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      example: "insurerName:DESC",
      description: "Field to sort by (optional).",
    }),
    ApiQuery({
      name: "search",
      required: false,
      example: "companyTag:general,insurerName:new",
      description: "Search term to filter results (optional).",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      example: "test",
      description: "Search based on insurerName, companyTag",
    }),
    ApiResponse({
      status: 200,
      description: "Insurer list retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Insurer list retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 79 },
                    insurerName: { type: "string", example: "sagar" },
                    displayName: { type: "string", example: "Test Display" },
                    status: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 87 },
                        lookUpValue: {
                          type: "string",
                          example: "UNDER_REVIEW",
                        },
                      },
                    },
                    insurerAddresses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 72 },
                          address1: {
                            type: "string",
                            example: "test nagar ofice",
                          },
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
                          phoneNumber: { type: "string", example: "test" },
                        },
                      },
                    },
                  },
                },
              },
              count: { type: "number", example: 3 },
              totalActiveInsurers: { type: "number", example: 67 },
              totalActivepolacies: { type: "number", example: 0 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No insurers found.",
    })
  );
}

export function getInsurerByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get an insurer by ID",
      description:
        "Retrieves details of a specific insurer by its ID, including associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Insurer retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Insurer retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 79 },
              insurerName: { type: "string", example: "sagar" },
              displayName: { type: "string", example: "Test Display" },
              companyTypeLid: { type: "number", example: 19 },
              companyTag: {
                type: "object",
                properties: {
                  id: { type: "number", example: 21 },
                  lookUpValue: { type: "string", example: "High Priority" },
                },
              },
              companyType: {
                type: "object",
                properties: {
                  id: { type: "number", example: 19 },
                  lookUpValue: { type: "string", example: "Public" },
                },
              },
              isLife: {
                type: "object",
                properties: {
                  id: { type: "number", example: 83 },
                  lookUpValue: { type: "string", example: "Yes" },
                },
              },
              status: {
                type: "object",
                properties: {
                  id: { type: "number", example: 87 },
                  lookUpValue: { type: "string", example: "UNDER_REVIEW" },
                },
              },
              website: { type: "string", example: "http://example.com" },
              companyTagLid: { type: "number", example: 21 },
              remarks: { type: "string", example: "Test remarks" },
              insureCode: { type: "string", example: "ABC" },
              policy: { type: "array", items: { type: "object" }, example: [] },
              insurerAddresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 386 },
                    addressTypeLid: { type: "number", example: 25 },
                    addressType: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 25 },
                        lookUpValue: { type: "string", example: "Official" },
                      },
                    },
                    address1: { type: "string", example: "test nagar ofice" },
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
                    address2: { type: "string", example: "" },
                    area: { type: "string", example: "test" },
                    pinCode: { type: "string", example: "92912" },
                    phoneNumber: { type: "string", example: "test" },
                    alternatePhoneNumber: { type: "string", example: "" },
                    email: { type: "string", example: "test@gmail.com" },
                    supportNumber: { type: "string", example: "test" },
                  },
                },
              },
              insurerContacts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {},
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Insurer not found.",
    })
  );
}

export function modifyInsurerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update an insurer",
      description: "Updates the details of an existing insurer.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Updated insurer details, including addresses",
      schema: {
        type: "object",
        properties: {
          insurerName: { type: "string", example: "abhi varmasss" },
          displayName: { type: "string", example: "Test Display" },
          companyTypeLid: { type: "number", example: 19 },
          website: { type: "string", example: "http://example.com" },
          isLifeLid: { type: "number", example: 83 },
          companyTagLid: { type: "number", example: 21 },
          remarks: { type: "string", example: "Test remarks" },
          insureCode: { type: "string", example: "ABCD" },
          address: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 375 },
                addressTypeLid: { type: "number", example: 25 },
                address1: {
                  type: "string",
                  example: "test nagar oficefhedwhfwhf",
                },
                countryId: { type: "number", example: 1 },
                stateId: { type: "number", example: 1 },
                cityId: { type: "number", example: 1 },
                address2: { type: "string", example: "" },
                area: { type: "string", example: "test" },
                pinCode: { type: "string", example: "92912" },
                phoneNumber: { type: "string", example: "87975922557" },
                alternatePhoneNumber: {
                  type: "string",
                  example: "87975922557",
                },
                email: { type: "string", example: "test@gmail.com" },
                supportNumber: { type: "string", example: "test" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Insurer updated successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Insurer successfully updated." },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 73 },
              insurerName: { type: "string", example: "abhi varmasss" },
              displayName: { type: "string", example: "Test Display" },
              companyTypeLid: { type: "number", example: 19 },
              website: { type: "string", example: "http://example.com" },
              isLifeLid: { type: "number", example: 83 },
              companyTagLid: { type: "number", example: 21 },
              remarks: { type: "string", example: "Test remarks" },
              insureCode: { type: "string", example: "ABCD" },
              statusLid: { type: "number", example: 85 },
              address: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 375 },
                    addressTypeLid: { type: "number", example: 25 },
                    address1: {
                      type: "string",
                      example: "test nagar oficefhedwhfwhf",
                    },
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
                    address2: { type: "string", example: "" },
                    area: { type: "string", example: "test" },
                    pinCode: { type: "string", example: "92912" },
                    phoneNumber: { type: "string", example: "test" },
                    alternatePhoneNumber: { type: "string", example: "" },
                    email: { type: "string", example: "test@gmail.com" },
                    supportNumber: { type: "string", example: "test" },
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
      description: "Insurer not found.",
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
    })
  );
}

export function deleteInsurerSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete an insurer",
      description: "Deletes an insurer by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({
      status: 200,
      description: "Insurer successfully deleted.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Insurer successfully deleted." },
          data: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "Insurer successfully deleted.",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Insurer not found.",
    })
  );
}

export function getInsurerDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get insurer details by ID",
      description:
        "Retrieves details of a specific insurer by its ID, including associated addresses.",
    }),
    ApiBearerAuth("access-token"),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "ID of the insurer",
      example: 44,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Insurer details retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 44 },
              insurerName: { type: "string", example: "Abhi" },
              displayName: { type: "string", example: "Test Display" },
              insurerAddresses: {
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
      description: "Insurer not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getInsurerListSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get all insurers",
      description:
        "Retrieves a list of all insurers, including their associated addresses.",
    }),
    ApiBearerAuth("access-token"),
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
        "Number of records per page (optional)(by default limit is 10 records).",
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
      description: "Insurers retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Insurers retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 44 },
                insurerName: { type: "string", example: "Abhi" },
                displayName: { type: "string", example: "Test Display" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No insurers found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getInsurerContactsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get contacts of an insurer",
      description: "Fetches all contacts associated with a specific insurer.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "insurerId",
      required: true,
      description: "ID of the insurer",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer contacts retrieved successfully.",
      schema: {
        example: {
          status: 200,
          message: "Insurer contacts retrieved successfully",
          data: [
            {
              id: 584,
              firstName: "uday",
              lastName: "yama",
              displayName: "Uday Yama",
            },
            {
              id: 579,
              firstName: "insurer",
              lastName: "update",
              displayName: "insurer update12",
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No contacts found for insurer.",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to fetch insurer contacts.",
    })
  );
}

export function getInsurerBranchesSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get branches of an insurer",
      description: "Fetches all branches associated with a specific insurer.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "insurerId",
      required: true,
      description: "ID of the insurer",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer branches retrieved successfully.",
      schema: {
        example: {
          status: 200,
          message: "Insurer branches retrieved successfully",
          data: {
            data: [
              {
                id: 1,
                branchName: "Mumbai Branch",
                branchCode: "MUM001",
                branchType: "Regional",
                address1: "123 Marine Lines",
              },
            ],
            count: 1,
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Failed to fetch insurer branches." })
  );
}

export function getCompanyInsurersSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(
      CompanyInsurerDto,
      CompanyInsurerListResponseDto,
      CompanyInsurerQueryDto
    ),
    ApiOperation({
      summary: "List insurers associated with a company",
      description:
        "Returns a paginated list of unique insurers mapped to the specified company across SO and RO policies with optional name search.",
    }),
    ApiParam({
      name: "companyId",
      type: Number,
      required: true,
      description: "Identifier of the company whose insurers need to be fetched.",
    }),
    ...Object.keys(CompanyInsurerQueryDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          CompanyInsurerQueryDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          CompanyInsurerQueryDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: "Insurers retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Insurers retrieved successfully." },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(CompanyInsurerDto) },
              },
              count: { type: "number", example: 10 },
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
          message: { type: "string", example: "Invalid company identifier" },
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
          message: { type: "string", example: "Failed to fetch insurers" },
        },
      },
    })
  );
}
