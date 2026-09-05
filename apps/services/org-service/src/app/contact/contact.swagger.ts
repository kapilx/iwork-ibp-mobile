import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

// Swagger metadata for the createContact method
export function createContactSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create Contact",
      description:
        "Creates a new contact with the provided details, including addresses, experiences, and contact details.",
    }),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiBody({
      description: "Contact creation payload",
      examples: {
        companyContact: {
          summary: "Company Contact",
          value: {
            salutationLid: 16,
            firstName: "navai",
            middleName: "Mavi",
            lastName: "company",
            displayName: "John Doe",
            linkedInUrl:
              "https://www.linkedin.com/company/divami-design-led-ai/posts/?feedView=all",
            companyId: 435,
            companyLocationId: 1,
            companyBranchId: 3,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            reportingToId: null,
            relationshipTypeLid: 290,
            remarks: "Test contact - for company contact",
            contactRecordTypeLid: 88,
            address: [
              {
                addressTypeLid: 25,
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
              },
            ],
            contactDetails: {
              gender: 34,
              dateOfBirth: "2000-10-11",
              favouriteFood: "Chocolatssse",
              favouriteRestaurant: "Udapi",
              personalHistory: "Foddy",
              majorAchievements: "Topper",
              maritalStatus: 37,
              dateOfWedding: "2020-10-10",
              spouseName: "archana",
              spouseDateOfBirth: "2000-12-10",
              spouseWorkingStatus: 41,
              workingCompany: "Divami",
              childDetails: [
                {
                  childName: "vinay",
                  childDob: "2020-10-04",
                  childGender: 34,
                },
              ],
            },
            professionalExperiences: [
              {
                fromDate: "2016-03-20",
                toDate: "2020-03-01",
                company: "Divami",
                designation: "Sofware Eng",
                department: "Engg",
                details: "4 years of my life",
              },
            ],
            qualificationExperiences: [
              {
                nameOfQualification: "B.Tech",
                yearOfQualification: 2020,
                details: "Passed",
                universityName: "IIT Bombay",
              },
            ],
            communicationDetails: [
              {
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                documentId: 25,
              },
            ],
          },
        },
        insurerContact: {
          summary: "Insurer Contact",
          value: {
            salutationLid: 16,
            firstName: "uday",
            middleName: "gupta",
            lastName: "yama",
            displayName: "Uday Yama",
            companyId: 163,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Insurer Contact",
            contactRecordTypeLid: 89,
            address: [
              {
                addressTypeLid: 25,
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
              },
            ],
            communicationDetails: [
              {
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                documentId: 25,
              },
            ],
          },
        },
        tpaContact: {
          summary: "Tpa Contact",
          value: {
            salutationLid: 16,
            firstName: "Navanitha",
            middleName: "Mavi",
            lastName: "Makulla",
            displayName: "Navanitha Makulla",
            companyId: 55,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Tpa Contact",
            contactRecordTypeLid: 90,
            address: [
              {
                addressTypeLid: 25,
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
              },
            ],
            communicationDetails: [
              {
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                documentId: 25,
              },
            ],
          },
        },
        brokerContact: {
          summary: "Broker Contact",
          value: {
            salutationLid: 16,
            firstName: "Abhilash",
            middleName: "Mavi",
            lastName: "Dongari",
            displayName: "Abhilash Dongari",
            companyId: 4,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Broker Contact",
            contactRecordTypeLid: 91,
            address: [
              {
                addressTypeLid: 25,
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
              },
            ],
            communicationDetails: [
              {
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                documentId: 25,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Contact created successfully",
      examples: {
        companyContact: {
          summary: "Company Contact",
          value: {
            id: 444,
            firstName: "navai",
            lastName: "company",
            middleName: "Mavi",
            displayName: "John Doe",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - for company contact",
            linkedInUrl:
              "https://www.linkedin.com/company/divami-design-led-ai/posts/?feedView=all",
            relationshipTypeLid: 290,
            relationshipType: {
              id: 290,
              lookUpValue: "Champion",
            },
            address: [
              {
                id: 1394,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "123 Main St",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              id: 350,
              gender: 34,
              dateOfBirth: "2000-10-11",
              favouriteFood: "Chocolatssse",
              favouriteRestaurant: "Udapi",
              personalHistory: "Foddy",
              majorAchievements: "Topper",
              maritalStatus: 37,
              dateOfWedding: "2020-10-10",
              spouseName: "archana",
              spouseDateOfBirth: "2000-12-10",
              spouseWorkingStatus: 41,
              workingCompany: "Divami",
              childDetails: [
                {
                  id: 88,
                  childName: "vinay",
                  childDob: "2020-10-04",
                  childGender: 34,
                  childGenderType: {
                    id: 34,
                    lookUpValue: "Male",
                  },
                  contactDetailsId: 350,
                },
              ],
              genderType: {
                id: 34,
                lookUpValue: "Male",
              },
              spouseWorkingStatusType: {
                id: 41,
                lookUpValue: "Not working",
              },
              maritalStatusType: {
                id: 37,
                lookUpValue: "Married",
              },
            },
            professionalExperiences: [
              {
                id: 298,
                fromDate: "2016-03-20",
                toDate: "2020-03-01",
                designation: "Sofware Eng",
                department: "Engg",
                company: "Divami",
                details: "4 years of my life",
              },
            ],
            qualificationExperiences: [
              {
                id: 298,
                nameOfQualification: "B.Tech",
                yearOfQualification: 2020,
                details: "Passed",
                universityName: "IIT Bombay",
              },
            ],
            contactDocMaps: [
              {
                id: 175,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 858,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 859,
                communicationType: "phone",
                communicationDetails: "1234527012",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: null,
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 88,
              lookUpValue: "company",
            },
            company: {
              id: 435,
              companyName: "Reliance Industries Ltd",
              displayName: "Reliance",
              companyTypeLid: 19,
              currencyId: 50,
              industrySegmentLid: 23,
              groupCompanyLid: 48,
              noOfEmployees: 1200,
              website: "http://www.ril.com/",
              dateOfIncorporation: "2000-04-01",
              panCardNumber: null,
              registrationNo: null,
              tanNumber: null,
              priorityLid: 53,
              statusLid: 31,
              remarks: null,
              source: "",
              companyAddresses: [
                {
                  address: {
                    addressTypeLid: 25,
                    address1: "navi",
                    countryId: {
                      name: "India",
                      isoCode: null,
                      id: 1,
                    },
                    stateId: {
                      name: "Arunachal Pradesh",
                      stateCode: "AR",
                      id: 2,
                    },
                    cityId: {
                      name: "Vijayawada",
                      id: 2,
                    },
                    address2: "",
                    area: "navi",
                    pinCode: "67890",
                    phoneNumber: "1234567890",
                    alternatePhoneNumber: "0987654321",
                    email: "navi@example.com",
                    supportNumber: "1800654321",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2025-04-13T08:40:48.617Z",
                    updatedAt: "2025-04-13T08:40:48.617Z",
                    id: 824,
                    deletedAt: null,
                    addressType: {
                      id: 25,
                      lookUpKey: "ADDRESS_TYPE_OFFICE",
                      lookUpName: "ADDRESS_TYPE",
                      lookUpValueKey: "OFFICE",
                      lookUpValue: "Office",
                      description: "Official address",
                      lookUpOrder: 2,
                      createdAt: "2025-03-21T13:57:19.009Z",
                      updatedAt: "2025-03-21T13:57:19.009Z",
                      createdBy: "SYSTEM",
                      updatedBy: "SYSTEM",
                    },
                  },
                  isPrimary: false,
                  id: 273,
                },
              ],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 435,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        insurerContact: {
          summary: "Insurer Contact",
          value: {
            id: 445,
            firstName: "uday",
            lastName: "yama",
            middleName: "gupta",
            displayName: "Uday Yama",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Insurer Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1395,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 176,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 860,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 861,
                communicationType: "phone",
                communicationDetails: "1234527013",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 89,
              lookUpValue: "insurer",
            },
            company: {
              id: 163,
              insurerName: "insurer final test ",
              displayName: "insurer final testing",
              companyTypeLid: 19,
              website: "https://divami.com/",
              isLifeLid: 84,
              companyTagLid: 22,
              remarks: "<p>testing</p>",
              insureCode: "test insurer",
              statusLid: 85,
              isLife: {
                id: 84,
                lookUpValue: "No",
              },
              companyType: {
                id: 19,
                lookUpValue: "Public",
              },
              companyTag: {
                id: 22,
                lookUpValue: "General",
              },
              status: {
                id: 85,
                lookUpValue: "Active",
              },
              companyAddresses: [
                {
                  id: 128,
                  insurerId: 163,
                  addressId: 910,
                  address: {
                    addressTypeLid: 57,
                    address1: "address update check",
                    countryId: {
                      name: "India",
                      isoCode: null,
                      id: 1,
                    },
                    stateId: {
                      name: "Karnataka",
                      stateCode: "KA",
                      id: 11,
                    },
                    cityId: {
                      name: "Bengaluru",
                      id: 23,
                    },
                    address2: "Insurer checking check",
                    area: "DEF",
                    pinCode: "560032",
                    phoneNumber: "0123456789",
                    alternatePhoneNumber: "01234567890",
                    email: "testing@divami.com",
                    supportNumber: "1234567890",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2025-04-13T14:48:59.394Z",
                    updatedAt: "2025-04-13T14:49:15.834Z",
                    id: 910,
                    deletedAt: null,
                    addressType: {
                      id: 57,
                      lookUpKey: "ADDRESS_TYPE_BRANCH",
                      lookUpName: "ADDRESS_TYPE",
                      lookUpValueKey: "BRANCH",
                      lookUpValue: "Branch",
                      description: "Branch Address",
                      lookUpOrder: 1,
                      createdAt: "2025-03-21T13:57:19.009Z",
                      updatedAt: "2025-03-21T13:57:19.009Z",
                      createdBy: "SYSTEM",
                      updatedBy: "SYSTEM",
                    },
                  },
                },
              ],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 163,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        tpaContact: {
          summary: "Tpa Contact",
          value: {
            id: 446,
            firstName: "Navanitha",
            lastName: "Makulla",
            middleName: "Mavi",
            displayName: "Navanitha Makulla",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Tpa Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1396,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 177,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 862,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 863,
                communicationType: "phone",
                communicationDetails: "1234527015",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 90,
              lookUpValue: "tpa",
            },
            company: {
              id: 55,
              tpaName: "Navi testing",
              displayName: "test",
              companyTypeLid: 1,
              website: "divami.com",
              remarks: "test",
              statusLid: 80,
              status: {
                id: 80,
                lookUpValue: "Active",
              },
              companyAddresses: [],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 55,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        brokerContact: {
          summary: "Broker Contact",
          value: {
            id: 447,
            firstName: "Abhilash",
            lastName: "Dongari",
            middleName: "Mavi",
            displayName: "Abhilash Dongari",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Broker Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1397,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 178,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 864,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 865,
                communicationType: "phone",
                communicationDetails: "1234527017",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 91,
              lookUpValue: "broker",
            },
            company: {
              id: 4,
              brokerName: "ABBro Pvt Lt",
              displayName: "ABC Brokers",
              companyTypeLid: 19,
              website: "https://www.abcbrokers.com",
              remarks: "Leading insurance broker in the region",
              statusLid: 274,
              status: {
                id: 274,
                lookUpValue: "Active",
              },
              companyType: {
                id: 19,
                lookUpValue: "Public",
              },
              companyAddresses: [],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 4,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Invalid input data" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
}

// Swagger metadata for the getContact method
export const getContactSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get contact data by ID",
      description:
        "Retrieves the details of a specific contact by its ID, including related information such as company, address, and experiences.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the contact",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Contact data retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Contact retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              firstName: { type: "string", example: "navai" },
              lastName: { type: "string", example: "Doe" },
              middleName: { type: "string", example: "Mavi" },
              displayName: { type: "string", example: "John Doe" },
              linkedInUrl: {
                type: "string",
                example:
                  "https://www.linkedin.com/company/divami-design-led-ai/posts/?feedView=all",
              },
              companyLocationId: { type: "number", example: 2 },
              companyBranchId: { type: "number", example: 3 },
              reportingToId: { type: "number", nullable: true, example: null },
              relationshipTypeLid: {
                type: "number",
                nullable: true,
                example: 290,
              },
              remarks: { type: "string", example: "Test contact" },
              status: { type: "number", example: 1 },
              qualificationExperiences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 33 },
                    nameOfQualification: { type: "string", example: "B.Tech" },
                    yearOfQualification: { type: "number", example: 2020 },
                    details: { type: "string", example: "Passed" },
                    universityName: { type: "string", example: "IIT Bombay" },
                  },
                },
              },
              professionalExperiences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 30 },
                    fromDate: {
                      type: "string",
                      format: "date-time",
                      example: "2016-03-19T18:30:00.000Z",
                    },
                    toDate: {
                      type: "string",
                      format: "date-time",
                      example: "2020-02-29T18:30:00.000Z",
                    },
                    company: { type: "string", example: "Divami" },
                    designation: { type: "string", example: "Software Eng" },
                    department: { type: "string", example: "Engg" },
                    details: { type: "string", example: "4 years of my life" },
                  },
                },
              },
              contactDetails: {
                type: "object",
                properties: {
                  id: { type: "number", example: 55 },
                  gender: { type: "number", example: 34 },
                  dateOfBirth: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: null,
                  },
                  favouriteFood: { type: "string", example: "Chocolatssse" },
                  favouriteRestaurant: { type: "string", example: "Udapi" },
                  personalHistory: { type: "string", example: "Foddy" },
                  majorAchievements: {
                    type: "string",
                    nullable: true,
                    example: null,
                  },
                  maritalStatus: {
                    type: "number",
                    nullable: true,
                    example: 37,
                  },
                  dateOfWedding: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: null,
                  },
                  spouseName: {
                    type: "string",
                    nullable: true,
                    example: null,
                  },
                  spouseDateOfBirth: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: null,
                  },
                  spouseWorkingStatus: {
                    type: "string",
                    nullable: true,
                    example: null,
                  },
                  workingCompany: { type: "string", example: "Divami" },
                  childDetails: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 12 },
                        childName: {
                          type: "string",
                          example: "vinay",
                        },
                        childDob: {
                          type: "string",
                          format: "date",
                          example: "2020-10-04",
                        },
                        childGender: {
                          type: "number",
                          example: 34,
                        },
                      },
                    },
                  },
                },
              },
              communicationDetails: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    communicationType: { type: "string", example: "email" },
                    communicationDetails: {
                      type: "string",
                      example: "johnn.doe@example.com",
                    },
                    isPrimary: { type: "boolean", example: true },
                    contactId: { type: "number", example: 122 },
                    id: { type: "number", example: 39 },
                  },
                },
                example: [
                  {
                    communicationType: "email",
                    communicationDetails: "johnn.doe@example.com",
                    isPrimary: true,
                    contactId: 122,
                    id: 39,
                  },
                  {
                    communicationType: "phone",
                    communicationDetails: "1234527011",
                    isPrimary: true,
                    contactId: 122,
                    id: 40,
                  },
                ],
              },
              id: { type: "number", example: 64 },
              company: {
                type: "object",
                properties: {
                  companyName: { type: "string", example: "VerIT Solutions" },
                  displayName: { type: "string", example: "Ver IT Solutions" },
                  companyTypeLid: { type: "number", example: 19 },
                  companyTagLid: { type: "number", example: 21 },
                  currencyId: { type: "number", example: 50 },
                  industrySegmentLid: { type: "number", example: 23 },
                  groupCompanyLid: { type: "number", example: 47 },
                  noOfEmployees: { type: "number", example: 200 },
                  website: { type: "string", example: "verit.com" },
                  dateOfIncorporation: {
                    type: "string",
                    format: "date",
                    example: "2001-03-16",
                  },
                  panCardNumber: { type: "string", example: "CJVPK1165J" },
                  registrationNo: { type: "string", example: "65786" },
                  existingBrokerId: { type: "number", example: 5 },
                  paidUpCapital: { type: "number", example: 10 },
                  tanNumber: { type: "string", example: "PDES32028F" },
                  priorityLid: { type: "number", example: 53 },
                  statusLid: { type: "number", example: 31 },
                  approverId: { type: "number", nullable: true, example: null },
                  parentCompanyId: {
                    type: "number",
                    nullable: true,
                    example: null,
                  },
                  id: { type: "number", example: 114 },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    example: "2025-03-28T06:30:52.427Z",
                  },
                  updatedAt: {
                    type: "string",
                    format: "date-time",
                    example: "2025-03-28T07:39:05.777Z",
                  },
                  deletedAt: { type: "string", nullable: true, example: null },
                  createdBy: { type: "number", nullable: true, example: 1 },
                  updatedBy: { type: "number", nullable: true, example: 1 },
                  remarks: {
                    type: "string",
                    example: "For Testing Purpose test",
                  },
                  source: { type: "string", nullable: true, example: null },
                },
              },
              address: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 222 },
                    addressTypeLid: { type: "number", example: 25 },
                    address1: { type: "string", example: "navi" },
                    address2: { type: "string", example: "mumbai" },
                    area: { type: "string", example: "navi" },
                    countryId: { type: "number", example: 1 },
                    stateId: { type: "number", example: 2 },
                    cityId: { type: "number", example: 2 },
                    pinCode: { type: "string", example: "67890" },
                    email: { type: "string", example: "navi@example.com" },
                    phoneNumber: { type: "string", example: "1234567890" },
                    alternatePhoneNumber: {
                      type: "string",
                      example: "0987654321",
                    },
                  },
                },
              },
              salesOpportunity: {
                type: "array",
                items: { type: "string" },
                example: [],
              },
              renewalOpportunity: {
                type: "array",
                items: { type: "string" },
                example: [],
              },
              policy: { type: "array", items: { type: "string" }, example: [] },
              contactDocMaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 243 },
                    documentId: { type: "number", example: 25 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Contact not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the deleteContact method
export const deleteContactSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Delete contact by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the contact to delete",
      type: Number,
    }),
    ApiBearerAuth("access-token"),
    ApiResponse({ status: 200, description: "Contact deleted successfully" }),
    ApiResponse({ status: 404, description: "Contact not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the contactList method
export const getContactsSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get all contacts with pagination, sorting, and search",
      description:
        "Retrieves a paginated list of contacts with optional sorting and search functionality.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "page",
      required: true,
      type: Number,
      description: "Page number (default: 1)",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: true,
      type: Number,
      description: "Number of items per page (default: 10)",
      example: 10, // Default value
    }),
    ApiQuery({
      name: "contactRecordTypeLid",
      required: true,
      type: Number,
      description: "contact record type",
      example: 88, // Default value
    }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description:
        "Sorting format: field:order (e.g., department:ASC,contactName:DESC)",
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search format : key:value  (department:Sales, owner:test)",
      example: "department:Sales",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Global Search : Active",
      example: "Active",
    }),
    ApiResponse({
      status: 200,
      description: "Contact list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Contact List retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 7 },
                    companyId: { type: "number", example: 435 },
                    contactName: { type: "string", example: "navai Doe" },
                    companyName: { type: "string", example: "VerIT Solutions" },
                    owner: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 7 },
                        firstName: { type: "string", example: "rohit" },
                        lastName: { type: "string", example: "tester" },
                      },
                    },
                    communicationDetails: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 7 },
                          communicationType: {
                            type: "string",
                            example: "email",
                          },
                          communicationDetails: {
                            type: "string",
                            example: "jrohit6@example.com",
                          },
                          isPrimary: { type: "boolean", example: true },
                        },
                      },
                    },
                    department: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 62 },
                        lookUpValue: { type: "string", example: "Engineering" },
                      },
                    },
                    designation: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 67 },
                        lookUpValue: {
                          type: "string",
                          example: "HR Specialist",
                        },
                      },
                    },
                    status: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 29 },
                        lookUpValue: { type: "string", example: "Active" },
                      },
                    },
                  },
                },
              },
              count: { type: "number", example: 46 },
              totalContacts: { type: "number", example: 46 },
              totalCompanies: { type: "number", example: 3 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "No contacts found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};
// Swagger metadata for the updateContact method
export const updateContactSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Update Contact by ID",
      description:
        "Updates an existing contact with the provided details, including addresses, experiences, and contact details.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the contact to update",
      type: "number",
    }),
    ApiBody({
      description: "Contact update payload",
      examples: {
        companyContact: {
          summary: "Company Contact",
          value: {
            salutationLid: 16,
            firstName: "navai",
            middleName: "Mavi",
            lastName: "Doe",
            displayName: "John Doe",
            linkedInUrl:
              "https://www.linkedin.com/company/divami-design-led-ai/posts/?feedView=all",
            companyId: 435,
            companyLocationId: 2,
            companyBranchId: 3,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            statusLid: 29,
            reportingToId: null,
            relationshipTypeLid: 290,
            remarks: "Test contact- Company Contact",
            qualificationExperiences: [
              {
                nameOfQualification: "B.Tech",
                yearOfQualification: 2020,
                details: "Passed",
                universityName: "IIT Bombay",
                id: 16,
              },
            ],
            professionalExperiences: [
              {
                id: 20,
                fromDate: "2016-03-20T00:00:00.000Z",
                toDate: "2020-03-01T00:00:00.000Z",
                company: "DivamiDivami",
                designation: "Sofware Eng",
                department: "Engg",
                details: "4 years of my life",
              },
            ],
            contactDetails: {
              id: 42,
              gender: 34,
              dateOfBirth: "2000-10-11",
              favouriteFood: "ChocolatssseDivami",
              favouriteRestaurant: "Udapi",
              personalHistory: "Foddy",
              majorAchievements: "Topper",
              maritalStatus: 37,
              dateOfWedding: "2020-10-10",
              spouseName: "archana",
              spouseDateOfBirth: "2000-12-10",
              spouseWorkingStatus: 41,
              workingCompany: "Divami",
              childDetails: [
                {
                  id: 12,
                  childName: "vinay",
                  childDob: "2020-10-04",
                  childGender: 34,
                },
              ],
            },
            address: [
              {
                id: 213,
                addressTypeLid: 25,
                address1: "navi",
                address2: "test",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                email: "navi@example.com",
              },
            ],
            communicationDetails: [
              {
                id: 39,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 40,
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                id: 13,
                documentId: 25,
              },
            ],
          },
        },
        insurerContact: {
          summary: "Insurer Contact",
          value: {
            salutationLid: 16,
            firstName: "uday",
            middleName: "gupta",
            lastName: "yama",
            displayName: "Uday Yama",
            companyId: 163,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Insurer Contact",
            statusLid: 29,
            address: [
              {
                id: 213,
                addressTypeLid: 25,
                address1: "navi",
                address2: "test",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                email: "navi@example.com",
              },
            ],
            communicationDetails: [
              {
                id: 39,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 40,
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                id: 13,
                documentId: 25,
              },
            ],
          },
        },
        tpaContact: {
          summary: "Tpa Contact",
          value: {
            salutationLid: 16,
            firstName: "Navanitha",
            middleName: "Mavi",
            lastName: "Makulla",
            displayName: "Navanitha Makulla",
            companyId: 55,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Tpa Contact",
            statusLid: 29,
            address: [
              {
                id: 213,
                addressTypeLid: 25,
                address1: "navi",
                address2: "test",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                email: "navi@example.com",
              },
            ],
            communicationDetails: [
              {
                id: 39,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 40,
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                id: 13,
                documentId: 25,
              },
            ],
          },
        },
        brokerContact: {
          summary: "Broker Contact",
          value: {
            salutationLid: 16,
            firstName: "Abhilash",
            middleName: "Mavi",
            lastName: "Dongari",
            displayName: "Abhilash Dongari",
            companyId: 4,
            companyLocationId: 1,
            companyBranchId: 3,
            tagLid: 59,
            contactTypeLid: 56,
            department: "Finance",
            designation: "Accountant",
            remarks: "Test contact - Broker Contact",
            statusLid: 29,
            address: [
              {
                id: 213,
                addressTypeLid: 25,
                address1: "navi",
                address2: "test",
                area: "navi",
                countryId: 1,
                stateId: 2,
                cityId: 2,
                pinCode: "67890",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                email: "navi@example.com",
              },
            ],
            communicationDetails: [
              {
                id: 39,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 40,
                communicationType: "phone",
                communicationDetails: "1234527011",
                isPrimary: true,
              },
            ],
            contactDocMaps: [
              {
                id: 13,
                documentId: 25,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Contact updated successfully",
      examples: {
        companyContact: {
          summary: "Company Contact",
          value: {
            id: 444,
            firstName: "navai",
            lastName: "company",
            middleName: "Mavi",
            displayName: "John Doe",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - for company contact",
            linkedInUrl:
              "https://www.linkedin.com/company/divami-design-led-ai/posts/?feedView=all",
            relationshipTypeLid: 290,
            relationshipType: {
              id: 290,
              lookUpValue: "Champion",
            },
            address: [
              {
                id: 1394,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "123 Main St",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              id: 350,
              gender: 34,
              dateOfBirth: "2000-10-11",
              favouriteFood: "Chocolatssse",
              favouriteRestaurant: "Udapi",
              personalHistory: "Foddy",
              majorAchievements: "Topper",
              maritalStatus: 37,
              dateOfWedding: "2020-10-10",
              spouseName: "archana",
              spouseDateOfBirth: "2000-12-10",
              spouseWorkingStatus: 41,
              workingCompany: "Divami",
              childDetails: [
                {
                  id: 88,
                  childName: "vinay",
                  childDob: "2020-10-04",
                  childGender: 34,
                  childGenderType: {
                    id: 34,
                    lookUpValue: "Male",
                  },
                  contactDetailsId: 350,
                },
              ],
              genderType: {
                id: 34,
                lookUpValue: "Male",
              },
              spouseWorkingStatusType: {
                id: 41,
                lookUpValue: "Not working",
              },
              maritalStatusType: {
                id: 37,
                lookUpValue: "Married",
              },
            },
            professionalExperiences: [
              {
                id: 298,
                fromDate: "2016-03-20",
                toDate: "2020-03-01",
                designation: "Sofware Eng",
                department: "Engg",
                company: "Divami",
                details: "4 years of my life",
              },
            ],
            qualificationExperiences: [
              {
                id: 298,
                nameOfQualification: "B.Tech",
                yearOfQualification: 2020,
                details: "Passed",
                universityName: "IIT Bombay",
              },
            ],
            contactDocMaps: [
              {
                id: 175,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 858,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 859,
                communicationType: "phone",
                communicationDetails: "1234527012",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: null,
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 88,
              lookUpValue: "company",
            },
            company: {
              id: 435,
              companyName: "Reliance Industries Ltd",
              displayName: "Reliance",
              companyTypeLid: 19,
              currencyId: 50,
              industrySegmentLid: 23,
              groupCompanyLid: 48,
              noOfEmployees: 1200,
              website: "http://www.ril.com/",
              dateOfIncorporation: "2000-04-01",
              panCardNumber: null,
              registrationNo: null,
              tanNumber: null,
              priorityLid: 53,
              statusLid: 31,
              remarks: null,
              source: "",
              companyAddresses: [
                {
                  address: {
                    addressTypeLid: 25,
                    address1: "navi",
                    countryId: {
                      name: "India",
                      isoCode: null,
                      id: 1,
                    },
                    stateId: {
                      name: "Arunachal Pradesh",
                      stateCode: "AR",
                      id: 2,
                    },
                    cityId: {
                      name: "Vijayawada",
                      id: 2,
                    },
                    address2: "",
                    area: "navi",
                    pinCode: "67890",
                    phoneNumber: "1234567890",
                    alternatePhoneNumber: "0987654321",
                    email: "navi@example.com",
                    supportNumber: "1800654321",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2025-04-13T08:40:48.617Z",
                    updatedAt: "2025-04-13T08:40:48.617Z",
                    id: 824,
                    deletedAt: null,
                    addressType: {
                      id: 25,
                      lookUpKey: "ADDRESS_TYPE_OFFICE",
                      lookUpName: "ADDRESS_TYPE",
                      lookUpValueKey: "OFFICE",
                      lookUpValue: "Office",
                      description: "Official address",
                      lookUpOrder: 2,
                      createdAt: "2025-03-21T13:57:19.009Z",
                      updatedAt: "2025-03-21T13:57:19.009Z",
                      createdBy: "SYSTEM",
                      updatedBy: "SYSTEM",
                    },
                  },
                  isPrimary: false,
                  id: 273,
                },
              ],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 435,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        insurerContact: {
          summary: "Insurer Contact",
          value: {
            id: 445,
            firstName: "uday",
            lastName: "yama",
            middleName: "gupta",
            displayName: "Uday Yama",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Insurer Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1395,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 176,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 860,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 861,
                communicationType: "phone",
                communicationDetails: "1234527013",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 89,
              lookUpValue: "insurer",
            },
            company: {
              id: 163,
              insurerName: "insurer final test ",
              displayName: "insurer final testing",
              companyTypeLid: 19,
              website: "https://divami.com/",
              isLifeLid: 84,
              companyTagLid: 22,
              remarks: "<p>testing</p>",
              insureCode: "test insurer",
              statusLid: 85,
              isLife: {
                id: 84,
                lookUpValue: "No",
              },
              companyType: {
                id: 19,
                lookUpValue: "Public",
              },
              companyTag: {
                id: 22,
                lookUpValue: "General",
              },
              status: {
                id: 85,
                lookUpValue: "Active",
              },
              companyAddresses: [
                {
                  id: 128,
                  insurerId: 163,
                  addressId: 910,
                  address: {
                    addressTypeLid: 57,
                    address1: "address update check",
                    countryId: {
                      name: "India",
                      isoCode: null,
                      id: 1,
                    },
                    stateId: {
                      name: "Karnataka",
                      stateCode: "KA",
                      id: 11,
                    },
                    cityId: {
                      name: "Bengaluru",
                      id: 23,
                    },
                    address2: "Insurer checking check",
                    area: "DEF",
                    pinCode: "560032",
                    phoneNumber: "0123456789",
                    alternatePhoneNumber: "01234567890",
                    email: "testing@divami.com",
                    supportNumber: "1234567890",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2025-04-13T14:48:59.394Z",
                    updatedAt: "2025-04-13T14:49:15.834Z",
                    id: 910,
                    deletedAt: null,
                    addressType: {
                      id: 57,
                      lookUpKey: "ADDRESS_TYPE_BRANCH",
                      lookUpName: "ADDRESS_TYPE",
                      lookUpValueKey: "BRANCH",
                      lookUpValue: "Branch",
                      description: "Branch Address",
                      lookUpOrder: 1,
                      createdAt: "2025-03-21T13:57:19.009Z",
                      updatedAt: "2025-03-21T13:57:19.009Z",
                      createdBy: "SYSTEM",
                      updatedBy: "SYSTEM",
                    },
                  },
                },
              ],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 163,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        tpaContact: {
          summary: "Tpa Contact",
          value: {
            id: 446,
            firstName: "Navanitha",
            lastName: "Makulla",
            middleName: "Mavi",
            displayName: "Navanitha Makulla",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Tpa Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1396,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 177,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 862,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 863,
                communicationType: "phone",
                communicationDetails: "1234527015",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 90,
              lookUpValue: "tpa",
            },
            company: {
              id: 55,
              tpaName: "Navi testing",
              displayName: "test",
              companyTypeLid: 1,
              website: "divami.com",
              remarks: "test",
              statusLid: 80,
              status: {
                id: 80,
                lookUpValue: "Active",
              },
              companyAddresses: [],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 55,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
        brokerContact: {
          summary: "Broker Contact",
          value: {
            id: 447,
            firstName: "Abhilash",
            lastName: "Dongari",
            middleName: "Mavi",
            displayName: "Abhilash Dongari",
            companyLocationId: 1,
            companyBranchId: 3,
            remarks: "Test contact - Broker Contact",
            linkedInUrl: null,
            relationshipTypeLid: null,
            relationshipType: {},
            address: [
              {
                id: 1397,
                addressTypeLid: 25,
                addressType: {
                  id: 25,
                  lookUpValue: "Office",
                },
                address1: "navi",
                address2: "mumbai",
                area: "navi",
                countryId: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
                stateId: {
                  name: "Arunachal Pradesh",
                  stateCode: "AR",
                  id: 2,
                },
                cityId: {
                  name: "Vijayawada",
                  id: 2,
                },
                pinCode: "67890",
                email: "navi@example.com",
                phoneNumber: "1234567890",
                alternatePhoneNumber: "0987654321",
                supportNumber: "",
              },
            ],
            contactDetails: {
              genderType: {},
              spouseWorkingStatusType: {},
              maritalStatusType: {},
            },
            professionalExperiences: [],
            qualificationExperiences: [],
            contactDocMaps: [
              {
                id: 178,
                documentId: 25,
              },
            ],
            communicationDetails: [
              {
                id: 864,
                communicationType: "email",
                communicationDetails: "johnn.doe@example.com",
                isPrimary: true,
              },
              {
                id: 865,
                communicationType: "phone",
                communicationDetails: "1234527017",
                isPrimary: true,
              },
            ],
            salutation: {
              id: 16,
              lookUpValue: "Mr.",
            },
            tag: {
              id: 59,
              lookUpValue: "Auditor",
            },
            contactType: {
              id: 56,
              lookUpValue: "HR",
            },
            department: null,
            designation: null,
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            contactRecordType: {
              id: 91,
              lookUpValue: "broker",
            },
            company: {
              id: 4,
              brokerName: "ABBro Pvt Lt",
              displayName: "ABC Brokers",
              companyTypeLid: 19,
              website: "https://www.abcbrokers.com",
              remarks: "Leading insurance broker in the region",
              statusLid: 274,
              status: {
                id: 274,
                lookUpValue: "Active",
              },
              companyType: {
                id: 19,
                lookUpValue: "Public",
              },
              companyAddresses: [],
            },
            companyLocation: {
              id: 1,
              lookUpValue: "Visakhapatnam",
            },
            companyId: 4,
            salesOpportunity: [],
            renewalOpportunity: [],
            policy: [],
            reportingTo: null,
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Invalid input data" }),
    ApiResponse({ status: 404, description: "Contact not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for contactList endpoint
export function getContactListSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Contact List",
      description: "Retrieves a paginated list of contacts with optional filtering by contact record type and search term.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
      example: 10,
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search term for filtering contacts",
    }),
    ApiQuery({
      name: "contactRecordTypeLid",
      required: false,
      type: Number,
      description: "Filter by contact record type lookup ID",
    }),
    ApiQuery({
      name: "entityIds",
      required: false,
      type: String,
      description: "Comma-separated entity IDs for filtering",
    }),
    ApiResponse({
      status: 200,
      description: "Contact list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Contact list retrieved successfully" },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    contactId: { type: "number", example: 201 },
                    firstName: { type: "string", example: "John" },
                    lastName: { type: "string", example: "Doe" },
                    emailId: { type: "string", example: "john.doe@example.com" },
                    phoneNumber: { type: "string", example: "1234567890" },
                  },
                },
              },
              count: { type: "number", example: 50 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve contact list",
    })
  );
}
