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
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { DEFAULT_VALUES } from "../../../../service-lib/src/lib/constants";
import { CreateBrokingSlipVersionDto } from "./dto/create-broking-slip-version.dto";
import { CreateDataValidationDto } from "./dto/create-data-validation.dto";
import { CreateDeviationTaskDto } from "./dto/create-deviation-task.dto";
import {
  CreateFinalNegotiationActivityDto,
  UpdateFinalNegotiationActivityDto,
} from "./dto/create-final-negotiation-activity.dto";
import { CreateFinalNegotiationDto } from "./dto/create-final-negotiation.dto";
import {
  CreateKDMMeetingDto,
  UpdateKDMMeetingDto,
} from "./dto/create-kdm-meeting.dto";
import { CreateMandateDto } from "./dto/create-mandate-details.dto";
import { CreateOpportunityLostDto } from "./dto/create-opportunity-lost.dto";
import {
  CreateOpportunityDto,
  RenewalOpportunityDto,
} from "./dto/create-opportunity.dto";
import { CreatePlacementSlipDto } from "./dto/create-placement-slip.dto";
import { UpdateQuoteComparisonReportDto } from "./dto/create-quote-comparison-report.dto";
import { CreateQuoteDto } from "./dto/create-quote-entry.dto";
import { QuoteComparisonReportDto } from "./dto/generate-quote-comparison-report.dto";
import { GetMeetingByIdResponseDto } from "./dto/get-metting-by-id.dto";
import { OpportunityGetResponseDto } from "./dto/get-opportunity-by-id.dto";
import { GetOpportunityActivitiesResponseDto } from "./dto/opportunity-activities.dto";
import { OpportunityActivitiesDto } from "./dto/opportunity-activity.dto";
import { OpportunityListResponseDto } from "./dto/opportunity-list-response.dto";
import {
  ExcelGenerationDto,
  GetOpportunityBrokerageSummaryDto,
  GetOpportunityMonthlyBrokerageBreakdown,
  GetOpportunityQueryDto,
} from "./dto/opportunity-query-param.dto";
import { BrokingSlipVersionDetailDto } from "./dto/qcr-broking-slip-version-details.dto";
import { UpdateHeldCoverNoteDto } from "./dto/update-held-cover-note.dto";
import { ExtendOpportunityDto } from "./dto/update-opportunity.dto";
import { UpdatePlacementSlipDto } from "./dto/update-placement-slip.dto";
import { UpdatePolicyConfirmationDto } from "./dto/update-policy-confirmation.dto";
import { UpdatePolicyHardCopyDto } from "./dto/update-policy-hard-copy.dto";
import { UpdatePremiumCalculationDto } from "./dto/update-premium-calculation.dto";

export const getAllOpportunitiesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve all opportunities",
      description:
        "Fetches all opportunities with optional search, sorting, and pagination.",
    }),
    ...Object.keys(GetOpportunityQueryDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetOpportunityQueryDto.prototype,
          key,
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetOpportunityQueryDto.prototype,
          key,
        )?.example,
      }),
    ),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityListRetrieved,
      type: OpportunityListResponseDto, // Reference the DTO here
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
};

export function createOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateOpportunityDto),
    ApiOperation({
      summary: "Create a new opportunity",
      description: "Creates a new opportunity with the provided details.",
    }),
    ApiBody({
      description: "Payload for creating an opportunity.",
      schema: {
        $ref: getSchemaPath(CreateOpportunityDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.opportunityCreated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: {
            type: "string",
            example: successMessage.opportunityCreated,
          },
          data: {
            type: "object",
            $ref: getSchemaPath(OpportunityGetResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.opportunityCreationFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.opportunityCreationFailed,
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export const getOpportunityByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Retrieve opportunity data by ID" }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityId",
      description: "The ID of the opportunity",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityDetails,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityDetails,
          },
          data: {
            $ref: getSchemaPath(OpportunityGetResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.opportunityNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.opportunityNotFound,
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
};

export function updateOpportunityByIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update an opportunity by ID",
      description: "Updates the details of an opportunity by its ID.",
    }),
    ApiParam({
      name: "opportunityId",
      required: true,
      description: "The ID of the opportunity to update.",
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating an opportunity.",
      schema: {
        $ref: getSchemaPath(CreateOpportunityDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityUpdated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityUpdated,
          },
          data: {
            type: "object",
            $ref: getSchemaPath(OpportunityGetResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.opportunityNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.opportunityNotFound,
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function deleteOpportunityByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete an opportunity by ID",
      description: "Deletes an opportunity by its ID.",
    }),
    ApiParam({
      name: "opportunityId",
      required: true,
      description: "The ID of the opportunity to delete.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityDeleted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityDeleted,
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.opportunityNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.opportunityNotFound,
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function createFinalNegotiationMeetingSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateFinalNegotiationDto),
    ApiOperation({
      summary: "Create a final negotiation meeting",
      description:
        "Creates a final negotiation meeting and stores insurer participants if provided.",
    }),
    ApiBody({
      description: "Payload for creating a final negotiation meeting.",
      schema: {
        $ref: getSchemaPath(CreateFinalNegotiationDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "Final negotiation meeting created successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: {
            type: "string",
            example: "Final negotiation meeting created successfully.",
          },
          data: {
            $ref: getSchemaPath(CreateFinalNegotiationDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Final negotiation meeting creation failed.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data" },
        },
      },
    }),
  );
}

export function updateOpportunityActivitiesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(OpportunityActivitiesDto),
    ApiOperation({
      summary: "Update multiple opportunity activities",
      description:
        "Update multiple opportunity activities with the provided details.",
    }),
    ApiBody({
      description: "Payload for creating multiple opportunity activities.",
      schema: {
        $ref: getSchemaPath(OpportunityActivitiesDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityUpdatedSuccessfully,
      type: OpportunityActivitiesDto, // Reference the DTO here
    }),

    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid input data",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export const getOpportunityActivityByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve opportunity activity by ID",
      description:
        "Fetches the details of a specific opportunity activity by its ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetOpportunityActivitiesResponseDto),
    ApiResponse({
      status: 200,
      description: "Opportunity Activities retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity Activities retrieved successfully.",
          },
          data: {
            type: "array",
            items: { $ref: getSchemaPath(GetOpportunityActivitiesResponseDto) },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Opportunity activity not found",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Opportunity activity not found",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
};

export function getOpportunityActivityMetaSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve Opportunity Activity Meta",
      description:
        "Fetches the meta information of a specific opportunity activity by its opportunityId.",
    }),
    ApiParam({
      name: "opportunityId",
      required: true,
      description: "The ID of the opportunity.",
      example: 75,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityMetaRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityActivityMetaRetrieved,
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 4 },
                activityId: { type: "number", example: 2 },
                activityName: { type: "string", example: "KDM Meeting" },
                activityMeta: {
                  type: "object",
                  example: { key2: "value2" },
                },
              },
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: errorMessages.opportunityActivityMetaNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.opportunityActivityMetaNotFound,
          },
        },
      },
    }),
  );
}

export function createKDMMeetingSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateKDMMeetingDto),
    ApiOperation({
      summary: "Create a KDM meeting",
      description: "Creates a KDM meeting with the provided details.",
    }),
    ApiBody({
      description: "Payload for creating a KDM meeting.",
      schema: {
        $ref: getSchemaPath(CreateKDMMeetingDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "KDM meeting created successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: {
            type: "string",
            example: "KDM meeting created successfully.",
          },
          data: {
            $ref: getSchemaPath(CreateKDMMeetingDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "KDM meeting creation failed.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export const createDataValidationSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create Data Validation for an Opportunity Activity",
      description:
        "Creates a new data validation record for a specific opportunity activity. This includes fields like plan date, perform date, description, and activity type.",
    }),
    ApiExtraModels(CreateDataValidationDto), // Include the DTO model explicitly

    ApiBody({
      description: "The data validation details to create.",
      schema: {
        $ref: getSchemaPath(CreateDataValidationDto), // Reference the DTO schema
      },
    }),
    ApiResponse({
      status: 201,
      description: "Successfully created the data validation record.",
      schema: {
        type: "object",
        properties: {
          id: { type: "number", example: 1 },
          opportunityId: { type: "number", example: 1 },
          activityId: { type: "number", example: 2 },
          planDate: { type: "string", example: "2025-05-14" },
          performDate: { type: "string", example: "2025-05-15" },
          description: {
            type: "string",
            example: "This is a sample description for the activity.",
          },
          activityTypeLid: { type: "number", example: 3 },
          createdAt: { type: "string", example: "2025-05-10T10:00:00.000Z" },
          updatedAt: { type: "string", example: "2025-05-10T10:00:00.000Z" },
          createdBy: { type: "number", example: 1 },
          updatedBy: { type: "number", example: 1 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "Failed to create data validation due to invalid input or other errors.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
          error: { type: "string", example: "Bad Request" },
        },
      },
    }),
  );
};

export const getDataValidationByOpportunityActivityIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Data Validation by Opportunity Activity ID",
      description:
        "Fetches the data validation record for a specific opportunity activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      description: "The ID of the opportunity activity.",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Successfully retrieved the data validation record.",
      schema: {
        type: "object",
        properties: {
          id: { type: "number", example: 1 },
          opportunityId: { type: "number", example: 1 },
          activityId: { type: "number", example: 2 },
          planDate: { type: "string", example: "2025-05-14" },
          performDate: { type: "string", example: "2025-05-15" },
          description: {
            type: "string",
            example: "This is a sample description for the activity.",
          },
          activityTypeLid: { type: "number", example: 3 },
          createdAt: { type: "string", example: "2025-05-10T10:00:00.000Z" },
          updatedAt: { type: "string", example: "2025-05-10T10:00:00.000Z" },
          createdBy: { type: "number", example: 1 },
          updatedBy: { type: "number", example: 1 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Data validation record not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Data validation record not found.",
          },
          error: { type: "string", example: "Not Found" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to retrieve data validation due to invalid input.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
          },
          error: { type: "string", example: "Bad Request" },
        },
      },
    }),
  );
};

export const getMeetingByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve meeting details by opportunityActivityId",
      description: "Fetches the details of a specific meeting by its ID.",
    }),
    ApiParam({
      name: "opportunityActivityId",
      description: "The opportunityActivityId of the Opportunity Activity",
      type: Number,
      example: 1,
    }),
    ApiExtraModels(GetMeetingByIdResponseDto),
    ApiResponse({
      status: 200,
      description: "Meeting details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Meeting details retrieved successfully.",
          },
          data: {
            $ref: getSchemaPath(GetMeetingByIdResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Meeting not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Meeting not found" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
};

export function createOpportunityActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({ summary: "Create Opportunity Activity Data" }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Activity data request (choose type)",
      schema: { type: "object" },
      examples: {
        dataValidation: {
          summary: "Data Validation Activity",
          value: {
            opportunityActivityId: 162,
            planDate: "2025-05-14",
            performDate: "2025-07-15",
            description: "This is a sample description for the activity.",
            activityTypeLid: 395,
          },
        },
        kdmMeeting: {
          summary: "KDM Meeting Activity",
          value: {
            opportunityActivityId: 401,
            meetingTypeLid: 444,
            meetingDate: "2025-12-10",
            startTime: "2025-05-10T10:00:00Z",
            endTime: "2025-05-10T11:00:00Z",
            location: "Conference Room A",
            minOfMeeting: "Discussed project timelines and deliverables.",
            remarks: "This is a detailed description of the meeting.",
            statusLid: 450,
            participants: [
              { participantId: 580, participantRecordType: "TPA_CONTACT" },
            ],
            documents: [{ documentId: 222 }],
          },
        },
        mandateForm: {
          summary: "Mandate Form",
          value: {
            opportunityActivityId: 181,
            activityDate: "2025-01-31",
            planDate: "2025-11-30",
            mandateTypeLid: 399,
            validFrom: "2025-01-16",
            validTo: "2025-12-31",
            compensationPayable: 1000,
            compensationTypeLid: 401,
            issuedOn: "2023-07-01",
            remarks: "This is a sample remark for the mandate.",
            mandateDetailsDocuments: [
              {
                documentTypeLid: 237,
                documentId: 35,
              },
            ],
            mandateDetailsContacts: [
              {
                contactId: 272,
              },
            ],
          },
        },
        brokingSlipDetails: {
          summary: "Broking Slip Details Activity",
          value: {
            opportunityActivityId: 575,
            statusLid: 403,
            brokingSlipVersionDetails: [
              {
                opportunityId: 414,
                sumInsured: 1000000,
                versionName: "sample version",
                brokeragePercentage: 2.5,
                policyFrom: "2025-12-10T00:00:00.000Z",
                policyTo: "2026-12-10T00:00:00.000Z",
                renewalDate: "2026-12-10T00:00:00.000Z",
                quoteReceiptTimeline: "2025-12-01T00:00:00.000Z",
                businessActivity: "Manufacturing",
                riskMitigationFeatures:
                  "Fire alarms, sprinklers, CCTV surveillance",
                clauses: "No claims made in the last 5 years.",
                insurerRemarks: "The insurer has approved the risk assessment.",
                remarks: "This is a high-value opportunity.",
                preferredInsurerDetails: [
                  {
                    insurerId: 233,
                    locationId: 1,
                    branchId: 1681,
                    contactId: 579,
                  },
                ],
                preferredTpaDetails: [
                  {
                    tpaId: 159,
                    locationId: 1,
                    branchId: 1681,
                    contactId: 578,
                  },
                ],
                coverDetails: [
                  {
                    opportunityId: 414,
                    coverMapId: 165,
                    policyId: 255,
                    coverName: "Hospitalization Expenses",
                    coverResponse: "Answer for Accidental Death Benefit",
                  },
                  {
                    opportunityId: 414,
                    coverMapId: 166,
                    policyId: 255,
                    coverName: "Disability Benefit",
                    coverResponse: "Answer for Maturity Benefit",
                  },
                  {
                    opportunityId: 414,
                    coverMapId: 167,
                    policyId: 255,
                    coverName: "Waiver of Premium",
                    coverResponse: "Answer for Critical Illness Cover",
                  },
                ],
              },
            ],
          },
        },
        quoteEntry: {
          summary: "Quote Entry Activity",
          value: {
            opportunityActivityId: 1511,
            opportunityId: 123,
            brokingSlipId: 453,
            insurerId: 789,
            quoteReceivedOn: "2025-05-26T10:00:00Z",
            basicPremium: 10000,
            terrorism: 2000,
            tax: 18,
            taxValue: 1800,
            netPremium: 11800,
            brokeragePercent: 10,
            insurerRemarks: "Sample remarks for the insurer",
            attachmentUrl: "https://example.com/quote-document.pdf",
            statusId: 1,
            documents: [
              {
                documentId: 120,
              },
              {
                documentId: 121,
              },
            ],
            covers: [
              {
                id: 121,
                response: "test",
              },
            ],
          },
        },
        finalNegotiation: {
          summary: "Final Negotiation Activity",
          value: {
            opportunityActivityId: 391,
            meeting: {
              meetingTypeLid: 443,
              meetingDate: "2025-06-20",
              startTime: "2023-10-01T10:00:00Z",
              endTime: "2023-10-01T11:00:00Z",
              location: "Meeting location",
              meetingPurpose: "Discuss project updates",
              minOfMeeting: "Minutes of the meeting are recorded here.",
              participants: [
                {
                  participantId: 578,
                  participantRecordType: "TPA_CONTACT",
                },
              ],
              documents: [
                {
                  documentId: 112,
                },
              ],
            },
            policyPlacedTypeId: 310,
            leadInsurerId: 248,
            isLeadInsurerPayCommission: true,
            finalizedQuoteId: 19,
            isQuoteEdited: false,
            basicPremium: 10000,
            terrorism: 500,
            tax: 18,
            taxValue: 1800,
            netPremium: 11800,
            brokeragePercentage: 10,
            insurerRemarks: "Insurer remarks",
            remarks: "General remarks",
            sharingDetails: [
              {
                insurerId: 248,
                sharePercentage: 25.5,
                brokeragePercentage: 10,
                brokerageAmount: 5000,
              },
            ],
            qcrVariations: [
              {
                name: "Variation A",
                description: "Description of the variation",
              },
            ],
            slaDetails: [
              {
                serviceTypeId: 259,
                numberOfDays: 30,
              },
            ],
            documents: [
              {
                documentId: 101,
              },
            ],
          },
        },
        premiumCalculation: {
          summary: "Premium Calculation Activity",
          value: {
            opportunityActivityId: 580,
            statusLid: 403,
            premiumCalculationDetails: {
              "662": "This is my Commercial vessels data",
              "663": "This is my ships",
              "664": "This is my data",
            },
            remarksSection: {
              remarks: "This is my reamrks data",
            },
            documents: [
              {
                documentTypeLid: 237,
                documentId: 25,
              },
            ],
          },
        },
        rfpCoverDetail: {
          summary: "RFP Cover Detail Activity",
          value: {
            opportunityActivityId: 573,
            coversConfig: {
              "165": "Answer for Accidental Death Benefit",
              "166": "Answer for Maturity Benefit",
              "167": "Answer for Critical Illness Cover",
            },
            statusLid: 403,
            remarksSection: {
              remarks: "testRemarks",
            },
            documents: [
              {
                documentTypeLid: 240,
                documentId: 292,
              },
            ],
          },
        },
        heldCoverNote: {
          summary: "Held Cover Note Activity",
          value: {
            opportunityActivityId: 2145,
            statusLid: 403,
            placementSlipDeviationsSection: {
              placementSlipDeviationsLid: 406,
            },
            deviationSection: {
              deviations: "dcsfg",
            },
            deviationsAddressedSection: {
              deviationsAddressedLid: 406,
              resolutionLid: 408,
              revisedHeldCoverNoteLid: 406,
            },
            premiumReceiptDetailsSection: {
              acknowledgedBy: 12,
              receiptDate: "2025-10-15",
              receiptNo: "PO-1000",
              allDocumentsReceivedDate: "2025-10-25",
            },
            remarksSection: {
              remarks: "djsk",
            },
            documents: [
              {
                documentTypeLid: 237,
                documentId: 25,
              },
            ],
          },
        },
        policyHardCopy: {
          summary: "Policy Hard Copy Activity",
          value: {
            opportunityActivityId: 786,
            statusLid: 403,
            insurerPolicyHardCopyDetails: {
              insurerPolicyNo: "Insurer Policy-PO001",
              hardCopyReceivedOn: "2025-05-21",
            },
            deviationSection: {
              deviationsLid: 406,
              premium: "300",
              brokeragePercentage: "15%",
              brokerageAmount: "45556",
              deviationCoveragesLid: 406,
              coverages: "coverages data",
              exclusions: "exclusions data",
              deductibles: "deductibles data ",
            },
            deviationsAddressedSection: {
              deviationsAddressedLid: 406,
              policyHardCopyReceivedLid: 406,
              resolutionLid: null,
              remarks: "remarks data",
            },
            documents: [
              {
                documentTypeLid: 237,
                documentId: 117,
              },
            ],
          },
        },
        policyConfirmation: {
          summary: "Policy Confirmation Activity",
          value: {
            opportunityActivityId: 501,
            statusLid: 403,
            policyDataWrongSection: {
              policyDataWrongLid: 406,
              deviationResolvedLid: 405,
              comments: "Need to verify with underwriting team",
            },
            deviationSection: {
              deviations: "Enter deviations",
            },
            policyDataRectifiedSection: {
              policyDataRectifiedLid: 406,
              resolutionLid: 408,
              remarks: "Remarks data",
            },
            documents: [
              {
                documentTypeLid: 237,
                documentId: 25,
              },
            ],
          },
        },
        policyDocket: {
          summary: "Policy Docket Activity",
          value: {
            opportunityActivityId: 617,
            statusLid: 403,
            placementSlipDetailsSection: {
              issuanceDate: "2025-05-14",
            },
            serviceLevelAgreementSection: {
              heldCoverNote: 1,
              policyDocument: 20,
              policyDocket: 5,
              endorsement: 3,
              healthClaims: 5,
              nonHealthClaims: 2,
              mir: 1,
              monthlyMeeting: 4,
              quarterlyMeeting: 6,
              renewalNotice: 8,
              dataCollection: 0,
              remarks: "Policy Docket",
            },
            documents: [
              {
                documentTypeLid: 237,
                documentId: 51,
              },
            ],
          },
        },
        HandOverMeet: {
          summary: "Hand Over Meet Activity",
          value: {
            opportunityActivityId: 754,
            meetingDate: "2025-12-10",
            startTime: "2025-05-10T10:00:00Z",
            endTime: "2025-05-10T11:00:00Z",
            meetingTypeLid: 444,
            location: "Conference Room A",
            minutesOfMeeting: "Discussed project timelines and deliverables.",
            remarks: "This is a detailed description of the meeting.",
            statusLid: 403,
            participants: [
              {
                participantRecordType: "INSURER_CONTACT",
                participantId: 637,
              },
            ],
            documents: [
              {
                documentTypeLid: 237,
                documentId: 35,
              },
            ],
          },
        },
        rfpDeatilsentry: {
          summary: "Rfp details Entry Activity",
          value: {
            opportunityActivityId: 2019,
            descriptionRequirements: {
              description: "Sample description",
              requirements: "Sample requirements",
            },
            preferredInsurers: [
              {
                insurerId: 361,
                locationId: 2,
                branchId: 1,
                contactId: 2,
              },
            ],
            excludedInsurers: [
              {
                insurerId: 358,
                locationId: 4,
                branchId: 1,
                contactId: 934,
              },
            ],
            preferredTPA: [
              {
                tpaId: 204,
                locationId: 2,
                branchId: 1,
                contactId: null,
              },
            ],
            excludedTPA: [
              {
                tpaId: 205,
                locationId: 3,
                branchId: 1,
                contactId: 1,
              },
            ],
            dynamicQuote: {
              multipleBrokerInvolved: 1,
              isMarketAllocationDone: 1,
            },
            clientContactDetails: {
              contactId: 949,
              decisionInfluencers: [1, 2],
              expectedPremium: 76,
            },
            creditSharing: [
              {
                executiveId: 2,
                percentage: 213,
              },
            ],
            targetQcrDate: {
              targetQcrDate: "2025-06-26",
            },
            clientConsiderations: {
              clientConsiderations: "Sample considerations",
              threatsFromExistingInsurer: "Sample threats from insurer",
              threatsFromExistingBroker: "Sample threats from broker",
              extraneousFactors: "extraneous Factors",
              planForClosingDetail: "Sample closing plan",
            },
            remarks: {
              remarks: "Sample remarks",
            },
            documents: [
              {
                documentId: 802,
                documentTypeLid: 240,
              },
            ],
            statusLid: 403,
          },
        },
        placementSlip: {
          summary: "Placement Slip Activity",
          value: {
            opportunityActivityId: 1693,
            statusLid: 357,
            policyDetails: {
              policyFromDate: "2025-06-12",
              policyToDate: "2025-06-16",
              sumInsured: 15000,
              basicPremium: 789,
              isPremiumInstallmentBased: 399,
            },
            installmentDates: [
              {
                firstInstallmentDate: "2025-06-06",
                installmentAmount: 2000.12,
              },
              {
                firstInstallmentDate: "2025-06-14",
                installmentAmount: 3000.5,
              },
            ],
            feeDetails: {
              fee: 46,
              isFeeInInstallment: 399,
              terrorismCommissionPercentage: 78,
              serviceTaxPercentage: 78,
              serviceTaxAmount: 90,
              other: "90",
              totalPremium: 79,
              placementSlipDate: "2025-06-12",
            },
            insurerDetails: [
              {
                insurerId: 373,
                insurerLocationId: 46,
                insurerBranchId: 2978,
                insurerContactId: 915,
              },
            ],
            tpaDetails: [
              {
                tpaId: 221,
                tpaLocationId: 46,
                tpaBranchId: 2845,
                tpaContactId: 952,
              },
            ],
            otherDeatils: {
              leadInsurerId: 373,
              isLeadInsurerPayCommission: 399,
              maxAgeOfDependents: 60,
              brokeragePercentage: 99,
              policyPlacedTypeLid: 341,
            },
            insurerAndBrokeragePercentage: [
              {
                insurerId: 373,
                sharePercentage: 28,
                brokeragePercentage: 89,
                brokerageAmount: 90,
              },
            ],
            cdAccountDetails: {
              paymentTypeLid: 444,
              cdAccountTypeLid: 442,
              accountName: "Saving Account",
              openBalance: 78,
              selectCdAccount: 442,
              transactionTypeLid: 440,
              chequeDate: "2025-06-14",
              chequeAmount: 890,
              chequeNumber: "101022",
              bankName: "HDFC Bank",
            },
            coverDetails: {},
            remarks: {
              remarks: "no remarks",
            },
            documents: [
              {
                documentId: 123,
                documentTypeLid: 237,
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity Activity saved successfully",
    }),
    ApiResponse({ status: 404, description: "Activity meta not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );
}

export const updateKDMMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Update KDM Meeting",
      description:
        "This endpoint allows updating an existing KDM meeting record by its ID. The request body accepts partial updates for the KDM meeting fields.",
    }),
    ApiParam({
      name: "id",
      type: Number,
      description: "The ID of the KDM meeting record to update.",
      required: true,
      example: 1,
    }),
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateKDMMeetingDto), // Include the DTO model explicitly
    ApiBody({
      description: "The KDM meeting details to update.",
      schema: {
        $ref: getSchemaPath(UpdateKDMMeetingDto), // Reference the DTO schema
      },
    }),
    ApiResponse({
      status: 200,
      description: "KDM meeting updated successfully.",
      schema: {
        example: {
          statusCode: 200,
          message: "KDM meeting updated successfully.",
          data: {
            id: 1,
            meetingDate: "2025-05-14",
            description: "Updated description for the KDM meeting.",
            participants: [{ participantId: 101 }, { participantId: 102 }],
            documents: [{ documentId: 201 }, { documentId: 202 }],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "KDM meeting not found.",
      schema: {
        example: {
          statusCode: 404,
          message: "KDM meeting not found.",
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request.",
      schema: {
        example: {
          statusCode: 400,
          message: "Failed to update KDM meeting.",
        },
      },
    }),
  );
};

export const updateHandOverMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Update Hand Over Meeting",
      description:
        "This endpoint allows updating an existing Hand Over meeting record by its ID. The request body accepts partial updates for the Hand Over meeting fields.",
    }),
    ApiParam({
      name: "id",
      type: Number,
      description: "The Meeting ID of the Hand over meeting record to update.",
      required: true,
      example: 1,
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "The Hand Over meeting details to update.",
      schema: {
        type: "object",
        properties: {
          meetingDate: { type: "string", example: "2025-12-12" },
          startTime: { type: "string", example: "2025-05-10T11:00:00Z" },
          endTime: { type: "string", example: "2025-05-10T12:00:00Z" },
          remarks: {
            type: "string",
            example: "Updated remarks for the handover meeting.",
          },
          location: { type: "string", example: "Conference Room B" },
          meetingTypeLid: { type: "number", example: 444 },
          minutesOfMeeting: {
            type: "string",
            example: "Discussed project timelines and deliverables.",
          },
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                participantId: { type: "number", example: 578 },
                participantRecordType: {
                  type: "string",
                  example: "TPA_CONTACT",
                },
              },
            },
          },
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                documentTypeLid: { type: "number", example: 237 },
                documentId: { type: "number", example: 333 },
              },
            },
          },
          statusLid: { type: "number", example: 403 },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Hand Over meeting updated successfully.",
      schema: {
        example: {
          statusCode: 200,
          message: "Hand Over meet updated successfully.",
          data: {
            meetingId: { type: "number", example: 203 },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Hand Over meet not found.",
      schema: {
        example: {
          statusCode: 404,
          message: "Hand Over meet not found.",
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request.",
      schema: {
        example: {
          statusCode: 400,
          message: "Failed to update Hand Over meeting.",
        },
      },
    }),
  );
};

export function getRfpDataByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve RFP data by Opportunity Activity ID",
      description:
        "Fetches the RFP data associated with a specific Opportunity Activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description:
        "The ID of the Opportunity Activity for which RFP data is to be retrieved.",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "RFP data retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "RFP data retrieved successfully.",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              name: { type: "string", example: "Sample RFP" },
              description: {
                type: "string",
                example: "Details about the RFP",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "RFP data not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "RFP data not found.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid Opportunity Activity ID.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid Opportunity Activity ID.",
          },
        },
      },
    }),
  );
}

export function getOpportunityCoversMetaSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Opportunity Covers Metadata",
      description:
        "Fetches the metadata of covers associated with a specific Opportunity ID and optional Activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityId",
      type: Number,
      required: true,
      description:
        "The ID of the Opportunity for which covers metadata is to be retrieved.",
      example: 123,
    }),
    ApiQuery({
      name: "activityId",
      type: Number,
      required: false,
      description: "The optional Activity ID to filter the covers metadata.",
      example: 456,
    }),
    ApiResponse({
      status: 200,
      description: "Covers metadata retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Covers metadata retrieved successfully.",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                name: { type: "string", example: "Cover Name" },
                description: { type: "string", example: "Cover Description" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Covers metadata not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Covers metadata not found.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid Opportunity ID or Activity ID.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid Opportunity ID or Activity ID.",
          },
        },
      },
    }),
  );
}

export function createMandateSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create a mandate",
      description: "Creates a new mandate for an opportunity activity.",
    }),
    ApiExtraModels(CreateMandateDto),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Details required to create a mandate.",
      schema: {
        $ref: getSchemaPath(CreateMandateDto), // Reference the DTO schema
      },
    }),
    ApiResponse({
      status: 201,
      description: "Mandate created successfully.",
      type: CreateMandateDto,
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
    }),
    ApiResponse({
      status: 404,
      description: "Not Found. Opportunity activity not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to create mandate.",
    }),
  );
}

export function getMandateDetailsByOpportunityActivityIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve mandate details by Opportunity Activity ID",
      description:
        "Fetches the mandate details associated with a specific Opportunity Activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description: "The ID of the Opportunity Activity",
      example: 181,
    }),
    ApiResponse({
      status: 200,
      description: "Mandate details retrieved successfully.",
      type: CreateMandateDto,
    }),
    ApiResponse({
      status: 404,
      description: "Mandate details not found.",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
    }),
  );
}

export function getPolicyDocketByOpportunityActivityIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Policy Docket by Opportunity Activity ID",
      description:
        "Fetches the policy docket details for a specific opportunity activity ID, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      description: "The ID of the opportunity activity.",
      required: true,
      example: 753,
    }),
    ApiResponse({
      status: 200,
      description: "Policy docket retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy docket retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              opportunityId: { type: "number", example: 425 },
              activityId: { type: "number", example: 30 },
              opportunityActivityId: { type: "number", example: 753 },
              statusLid: { type: "number", example: 403 },
              issuanceDate: { type: "string", example: "2025-10-10" },
              heldCoverNote: { type: "number", example: 1 },
              policyDocument: { type: "number", example: 20 },
              policyDocket: { type: "number", example: 5 },
              endorsement: { type: "number", example: 3 },
              healthClaims: { type: "number", example: 5 },
              nonHealthClaims: { type: "number", example: 2 },
              mir: { type: "number", example: 1 },
              monthlyMeeting: { type: "number", example: 4 },
              quarterlyMeeting: { type: "number", example: 6 },
              renewalNotice: { type: "number", example: 8 },
              dataCollection: { type: "number", example: 0 },
              remarks: { type: "string", example: "Policy Docket remarks" },
              documents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 3 },
                    policyDocketId: { type: "number", example: 1 },
                    documentId: { type: "number", example: 26 },
                    documentTypeLid: { type: "number", example: 238 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Activity data not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );
}
export function getOpportunityActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({ summary: "Get Opportunity Activity Data" }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description: "The ID of the Opportunity Activity",
      example: 181,
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity Activity retrieve successfully",
      examples: {
        dataValidation: {
          summary: "Data Validation Activity",
          value: {
            id: 42,
            opportunityId: 430,
            activityId: 17,
            statusLid: 403,
            dataActivity: {
              remarks: {
                description: "This is a sample description for the activity.",
              },
              documents: [
                {
                  id: 1,
                  documentId: 222,
                  documentTypeLid: 237,
                },
              ],
            },
          },
        },
        kdmMeeting: {
          summary: "KDM Meeting Activity",
          value: {
            id: 112,
            meetingDate: "2025-12-10",
            startTime: "2025-05-10T10:00:00.000Z",
            endTime: "2025-05-10T11:00:00.000Z",
            location: "Conference Room B at 10:00 AM",
            minOfMeeting:
              "Discussed ravi kirab is a project one tho the project timelines and deliverables.",
            activityStatus: "Submitted",
            description: "This is a detailed description of the meeting.",
            meetingId: 111,
            company: {
              id: 834,
              name: "divami1223",
            },
            opportunity: {
              id: 404,
            },
            meetingType: {
              id: 343,
              name: "Introductory Call",
            },
            participants: [
              {
                id: 164,
                participantRecordType: "TPA_CONTACT",
              },
            ],
          },
        },
        mandateForm: {
          summary: "Mandate Form Activity",
          value: {
            id: 46,
            opportunityId: 401,
            activityId: 19,
            statusLid: 404,
            dataActivity: {
              mandateDetailsFromFields: {
                mandateTypeLid: 330,
                validFrom: "2025-05-29",
                validTo: "2025-12-31",
                compensationPayable: 1000,
                compensationTypeLid: 401,
                issuedOn: "2025-05-19",
                remarks:
                  "This is a sample added due to ravis decision remark for the mandate.",
                mandateDetailsContacts: [573],
              },
              documents: [
                {
                  id: 23,
                  documentId: 35,
                  documentTypeLid: 237,
                },
                {
                  id: 24,
                  documentId: 29,
                  documentTypeLid: 237,
                },
              ],
            },
          },
        },
        premiumCalculation: {
          summary: "Premium Calculation Activity",
          value: {
            opportunityActivityId: 580,
            statusLid: 403,
            dataActivity: {
              premiumCalculationDetails: {
                "662": "This is my Commercial vessels data",
                "663": "This is my ships",
                "664": "This is my data",
              },
              remarksSection: {
                remarks: "This is my reamrks data",
              },
              documents: [
                {
                  id: 9,
                  documentTypeLid: 237,
                  documentId: 25,
                },
                {
                  id: 10,
                  documentTypeLid: 237,
                  documentId: 25,
                },
                {
                  id: 11,
                  documentTypeLid: 237,
                  documentId: 25,
                },
                {
                  id: 12,
                  documentTypeLid: 237,
                  documentId: 25,
                },
              ],
            },
          },
        },
        heldCoverNote: {
          summary: "Held Cover Note Activity",
          value: {
            id: 14,
            opportunityActivityId: 462,
            statusLid: 403,
            dataActivity: {
              placementSlipDeviationsSection: {
                placementSlipDeviationsLid: 406,
              },
              deviationSection: {
                deviations: "deviations data",
              },
              deviationsAddressedSection: {
                deviationsAddressedLid: 406,
                resolutionLid: null,
                revisedHeldCoverNoteLid: 406,
              },
              premiumReceiptDetailsSection: {
                acknowledgedBy: null,
                receiptNo: "PO-1000",
                receiptDate: "2025-10-15T00:00:00.000Z",
                allDocumentsReceivedDate: "2025-10-25T00:00:00.000Z",
              },
              remarksSection: {
                remarks: "remarks data",
              },
              documents: [
                {
                  id: 40,
                  documentId: 45,
                  documentTypeLid: 237,
                },
              ],
            },
          },
        },
        policyConfirmation: {
          summary: "Policy Confirmation Activity",
          value: {
            id: 9,
            opportunityActivityId: 467,
            statusLid: 404,
            dataActivity: {
              policyDataWrongSection: {
                policyDataWrongLid: 406,
                deviationResolvedLid: 405,
                comments: "Need to verify with underwriting team",
              },
              deviationSection: {
                deviations: "enter deviations",
              },
              policyDataRectifiedSection: {
                policyDataRectifiedLid: 406,
                resolutionLid: 408,
                remarks: "remarks data",
              },
              documents: [
                {
                  id: 2,
                  documentTypeLid: 237,
                  documentId: 25,
                },
              ],
            },
          },
        },
        policyHardCopy: {
          summary: "Policy Hard Copy Activity",
          value: {
            id: 4,
            opportunityActivityId: 786,
            statusLid: 403,
            dataActivity: {
              insurerPolicyHardCopyDetails: {
                insurerPolicyNo: "Insurer Policy-PO001",
                hardCopyReceivedOn: "2025-05-21",
              },
              deviationSection: {
                deviationsLid: 406,
                premium: "300",
                brokeragePercentage: "15%",
                brokerageAmount: null,
                deviationCoveragesLid: 406,
                coverages: "coverages data",
                exclusions: "exclusions data",
                deductibles: "deductibles data ",
              },
              deviationsAddressedSection: {
                deviationsAddressedLid: 406,
                policyHardCopyReceivedLid: 406,
                resolutionLid: null,
                remarks: "remarks data",
              },
              policyHardCopyCoversConfig: { "101": "value" },
              documents: [
                {
                  id: 10,
                  documentId: 117,
                  documentTypeLid: 237,
                },
              ],
            },
          },
        },
        policyDocket: {
          summary: "Policy Docket Activity",
          value: {
            id: 6,
            opportunityActivityId: 617,
            statusLid: 403,
            dataActivity: {
              placementSlipDetailsSection: {
                issuanceDate: "2025-05-14",
              },
              serviceLevelAgreementSection: {
                heldCoverNote: 1,
                policyDocument: 20,
                policyDocket: 5,
                endorsement: 3,
                healthClaims: 5,
                nonHealthClaims: 2,
                mir: 1,
                monthlyMeeting: 4,
                quarterlyMeeting: 6,
                renewalNotice: 8,
                dataCollection: 0,
                remarks: "Policy Docket",
              },
              documents: [
                {
                  id: 12,
                  documentId: 51,
                  documentTypeLid: 237,
                },
              ],
            },
          },
        },
        handOverMeet: {
          summary: "Hand Over Meet Activity",
          value: {
            id: 3,
            activityId: 31,
            opportunityId: 417,
            opportunityActivityId: 618,
            remarks: "This is a detailed description of the meeting.",
            meetingId: 206,
            statusLid: 403,
            meeting: {
              opportunityId: 417,
              activityId: 618,
              meetingTypeLid: 444,
              meetingSubTypeLid: 449,
              companyId: 834,
              contactId: null,
              meetingDate: "2025-12-10",
              startTime: "2025-05-10T10:00:00.000Z",
              endTime: "2025-05-10T11:00:00.000Z",
              location: "Conference Room A",
              minOfMeeting: "Discussed project timelines and deliverables.",
              meetingPurpose: null,
              meetingAgenda: null,
              id: 206,
              participants: [
                {
                  meetingId: 206,
                  participantId: 637,
                  participantRecordType: "INSURER_CONTACT",
                  id: 100,
                },
              ],
              company: {
                companyName: "divami",
                displayName: "divami1223",
                companyTypeLid: 324,
                currencyId: 113,
                industrySegmentLid: 214,
                noOfEmployees: 657,
                website: "http://example.com",
                dateOfIncorporation: "2025-05-19",
                panCardNumber: "BUVPV9741D",
                registrationNo: "U12345AB1234PLC123456",
                annualPremium: "34567.00",
                tanNumber: "PDES03098F",
                priorityLid: 53,
                remarks: "<p>adasdadasdasdadasdasd</p>",
                statusLid: 32,
                groupCompanyLid: 47,
                sentimentLid: 301,
                sourceTypeLid: 294,
                source: "Some source",
                leadCrm: 1,
                accountManager: 91,
                countryId: 1,
                id: 834,
                country: {
                  name: "India",
                  isoCode: null,
                  id: 1,
                },
              },
              opportunity: {
                opportunityId: 417,
                companyId: 834,
                estimatedBrokerage: 1000,
                policyTypeLid: 255,
                policyStatusLid: 257,
                serviceLevelLid: 259,
                expiryDate: "2026-12-31",
                sumInsured: 500000,
                premiumPaid: 20000,
                estimatedFee: 500,
                opportunityTypeLid: 312,
                isPolicyMinedLid: 310,
                source: "Some source",
                opportunitySourceTypeLid: 303,
                salesPitch: "This is a sales pitch",
              },
              meetingType: {
                id: 444,
                lookUpValue: "Client Meeting",
              },
              meetingSubType: {
                id: 449,
                lookUpValue: "Hand Over Meet",
              },
              meetingDocs: [
                {
                  meetingId: 206,
                  documentId: 35,
                  id: 15,
                },
              ],
            },
            status: {
              id: 403,
              lookUpValue: "In Progress",
            },
          },
        },
        rfpDetailsEntry: {
          summary: "Rfp Details Entry Activity",
          value: {
            status: 200,
            message: "Opportunity activity details retrieved successfully",
            data: {
              opportunityActivityId: 455,
              descriptionRequirements: {
                description: "This is a sample RFP details entry description.",
                requirements: "Sample requirements for the RFP.",
              },
              preferredInsurers: [
                {
                  insurerId: 242,
                  locationId: 7,
                  branchId: 1,
                  contactId: 668,
                },
              ],
              excludedInsurers: [
                {
                  insurerId: 242,
                  locationId: 4,
                  branchId: 1,
                  contactId: 668,
                },
              ],
              preferredTPA: [
                {
                  tpaId: 160,
                  locationId: 2,
                  branchId: 1,
                  contactId: 604,
                },
              ],
              excludedTPA: [
                {
                  tpaId: 160,
                  locationId: 1,
                  branchId: 1,
                  contactId: 604,
                },
              ],
              dynamicQuote: {
                multipleBrokerInvolved: 1,
                isMarketAllocationDone: 1,
              },
              clientContactDetails: {
                contactId: null,
                decisionInfluencers: [],
                expectedPremium: null,
              },
              creditSharing: [
                {
                  executiveId: 701,
                  percentage: "50.50",
                },
                {
                  executiveId: 702,
                  percentage: "49.50",
                },
              ],
              targetQcrDate: {
                targetQcrDate: "2023-10-15",
              },
              clientConsiderations: {
                clientConsiderations:
                  "Client expects high-quality coverage and timely service.",
                threatsFromExistingInsurer:
                  "Existing insurer has strong ties with the client.",
                threatsFromExistingBroker: null,
                extraneousFactors:
                  "Economic conditions may influence the decision.",
                planForClosingDetail:
                  "Our strategy is to offer competitive pricing and better service.",
              },
              remarks: {
                remarks: "Additional remarks for the RFP details entry.",
              },
              documents: [
                {
                  documentId: 801,
                  documentTypeLid: 240,
                },
                {
                  documentId: 802,
                  documentTypeLid: 240,
                },
              ],
              statusLid: 403,
            },
          },
        },
        placementSlip: {
          summary: "Placement Slip Activity",
          value: {
            id: 3,
            opportunityActivityId: 1693,
            statusLid: 357,
            dataActivity: {
              policyDetails: {
                policyFromDate: "2025-06-12",
                policyToDate: "2025-06-16",
                sumInsured: "15000",
                basicPremium: "789",
                isPremiumInstallmentBased: 399,
              },
              installmentDates: [
                {
                  placementSlipId: 3,
                  firstInstallmentDate: "2025-06-06",
                  installmentAmount: 2000.12,
                  id: 3,
                },
                {
                  placementSlipId: 3,
                  firstInstallmentDate: "2025-06-14",
                  installmentAmount: 3000.5,
                  id: 4,
                },
              ],
              feeDetails: {
                fee: "46",
                isFeeInInstallment: 399,
                terrorismCommissionPercentage: "78",
                serviceTaxPercentage: "78",
                serviceTaxAmount: "90",
                other: "90",
                totalPremium: "79",
                placementSlipDate: "2025-06-12",
              },
              otherDeatils: {
                leadInsurerId: 373,
                isLeadInsurerPayCommission: 399,
                maxAgeOfDependents: 60,
                brokeragePercentage: "99",
                policyPlacedTypeLid: 341,
              },
              remarks: {
                remarks: "no remarks",
              },
              tpaDetails: [
                {
                  id: 2,
                  placementSlipId: 3,
                  tpaId: 221,
                  tpaLocationId: 46,
                  tpaBranchId: 2845,
                  tpaContactId: 952,
                },
              ],
              insurerDetails: [
                {
                  id: 2,
                  placementSlipId: 3,
                  insurerId: 373,
                  insurerLocationId: 46,
                  insurerBranchId: 2978,
                  insurerContactId: 915,
                },
              ],
              insurerAndBrokeragePercentage: [
                {
                  id: 2,
                  placementSlipId: 3,
                  insurerId: 373,
                  sharePercentage: "28",
                  brokeragePercentage: "89",
                  brokerageAmount: "90",
                },
              ],
              cdAccountDetails: {
                id: 2,
                placementSlipId: 3,
                paymentTypeLid: 444,
                cdAccountTypeLid: 442,
                accountName: "Saving Account",
                openBalance: "78.00",
                selectCdAccount: "442.00",
                transactionTypeLid: 440,
                chequeDate: "2025-06-14",
                chequeAmount: "890",
                chequeNumber: "101022",
                bankName: "HDFC Bank",
              },
              coverDetails: {},
              documents: [
                {
                  documentId: 123,
                  documentTypeLid: 237,
                  id: 2,
                },
              ],
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid Opportunity Activity ID.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid Opportunity Activity ID.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updatePolicyDocketByIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update Policy Docket by ID",
      description:
        "Updates the policy docket details for a specific policy docket ID, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the policy docket to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating a policy docket.",
      schema: {
        type: "object",
        properties: {
          opportunityActivityId: { type: "number", example: 753 },
          statusLid: { type: "number", example: 403 },
          issuanceDate: { type: "string", example: "2025-10-10" },
          heldCoverNote: { type: "number", example: 1 },
          policyDocument: { type: "number", example: 20 },
          policyDocket: { type: "number", example: 5 },
          endorsement: { type: "number", example: 3 },
          monthlyMeeting: { type: "number", example: 4 },
          quarterlyMeeting: { type: "number", example: 6 },
          renewalNotice: { type: "number", example: 8 },
          dataCollection: { type: "number", example: 0 },
          remarks: { type: "string", example: "Policy Docket " },
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 3, nullable: true },
                documentId: { type: "number", example: 26 },
                documentTypeLid: { type: "number", example: 238 },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Policy docket updated successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policy docket updated successfully",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy docket not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Policy docket not found for the given ID.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updateQuoteSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update a Quote",
      description: "Updates an existing quote and its associated documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateQuoteDto), // Register CreateQuoteDto as an extra model
    ApiParam({
      name: "quoteId",
      type: Number,
      description: "The ID of the quote to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Details required to update a quote.",
      schema: {
        $ref: getSchemaPath(CreateQuoteDto), // Reference the DTO schema
      },
    }),
    ApiResponse({
      status: 200,
      description: "Quote updated successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Quote updated successfully." },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Quote not found." },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to update quote.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updateOpportunityQuoteByActivityIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update Opportunity Quote by Activity",
      description:
        "Updates quote remarks, status and documents using opportunity activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateQuoteDto),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID associated with the quote.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Details required to update opportunity quote.",
      schema: {
        $ref: getSchemaPath(CreateQuoteDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Quote updated successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Quote updated successfully." },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Quote not found." },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to update quote.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}
export function getQuoteByBrokingSlipAndActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary:
        "Retrieve a Quote by Broking Slip ID and Opportunity Activity ID",
      description:
        "Fetches a quote based on the provided Broking Slip ID and Opportunity Activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "brokingSlipId",
      type: Number,
      required: true,
      description: "The ID of the Broking Slip.",
      example: 123,
    }),
    ApiQuery({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description: "The ID of the Opportunity Activity.",
      example: 456,
    }),
    ApiResponse({
      status: 200,
      description: "Quote retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Quote retrieved successfully." },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              brokingSlipId: { type: "number", example: 123 },
              opportunityActivityId: { type: "number", example: 456 },
              insurerId: { type: "number", example: 789 },
              basicPremium: { type: "number", example: 10000 },
              netPremium: { type: "number", example: 12000 },
              statusId: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Quote not found." },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to retrieve quote.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function getQuotesByBrokingSlipSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Quotes by Broking Slip ID",
      description: "Fetches all quotes mapped to the provided Broking Slip ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "brokingSlipId",
      type: Number,
      required: true,
      description: "The ID of the Broking Slip.",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Quote retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Quote retrieved successfully." },
          data: { type: "array", items: { type: "object" } },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Quote not found." },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to retrieve quote.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updateHeldCoverNoteByIdSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(UpdateHeldCoverNoteDto),
    ApiOperation({
      summary: "Update Held Cover Note by ID",
      description:
        "Updates the Held Cover Note details for a specific Id, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the Held Cover Note to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating an Held Cover Note",
      schema: {
        $ref: getSchemaPath(UpdateHeldCoverNoteDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Held Cover Note updated successfully",
      schema: {
        allOf: [
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Held Cover Note updated successfully",
              },
              data: { $ref: getSchemaPath(UpdateHeldCoverNoteDto) },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: "Held Cover Note not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Held Cover Note not found for the given ID.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updatePolicyConfirmationByIdSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(UpdatePolicyConfirmationDto),
    ApiOperation({
      summary: "Update Policy Confirmation by ID",
      description:
        "Updates the Policy Confirmation details for a specific Id, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the Policy Confirmation to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating an Policy Confirmation",
      schema: {
        $ref: getSchemaPath(UpdatePolicyConfirmationDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Policy Confirmation updated successfully",
      schema: {
        allOf: [
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Policy Confirmation updated successfully",
              },
              data: { $ref: getSchemaPath(UpdatePolicyConfirmationDto) },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy Confirmation not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Policy Confirmation not found for the given ID.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updatePolicyHardCopyByIdSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(UpdatePolicyHardCopyDto),
    ApiOperation({
      summary: "Update Policy Hard Copy by ID",
      description:
        "Updates the Policy Hard Copy details for a specific Id, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the Policy Hard Copy to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating an Policy Hard Copy",
      schema: {
        $ref: getSchemaPath(UpdatePolicyHardCopyDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Policy Hard Copy updated successfully",
      schema: {
        allOf: [
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Policy Hard Copy updated successfully",
              },
              data: { $ref: getSchemaPath(UpdatePolicyHardCopyDto) },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: "Policy Hard Copy not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Policy Hard Copy not found for the given ID.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}
export function updateFinalNegotiationActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update Final Negotiation Activity",
      description: "Updates an existing final negotiation activity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the final negotiation activity to update.",
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating final negotiation activity.",
      type: UpdateFinalNegotiationActivityDto,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.finalNegotiationActivityUpdated,
    }),
    ApiResponse({
      status: 400,
      description: "Bad request.",
    }),
    ApiResponse({
      status: 404,
      description: "Resource not found.",
    }),
  );
}

export function getFinalNegotiationActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get Final Negotiation Activity",
      description: "Retrieves a final negotiation activity by ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      required: true,
      description: "The ID of the final negotiation activity to retrieve.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.finalNegotiationActivityRetrieved,
    }),
    ApiResponse({
      status: 404,
      description: "Resource not found.",
    }),
  );
}

export function createFinalNegotiationActivitySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Create Final Negotiation Activity",
      description: "Creates a new final negotiation activity.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload for creating final negotiation activity.",
      type: CreateFinalNegotiationActivityDto,
    }),
    ApiResponse({
      status: 201,
      description: successMessage.finalNegotiationActivityCreated,
    }),
    ApiResponse({
      status: 400,
      description: "Bad request.",
    }),
    ApiResponse({
      status: 404,
      description: "Resource not found.",
    }),
  );
}

export function getOpportunityDocumentsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity documents",
      description:
        "Retrieve all documents associated with a specific opportunity with pagination and filtering",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number for pagination",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Search term",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Field to search by",
    }),
    ApiQuery({
      name: "from",
      required: false,
      type: String,
      description: "Start date filter",
    }),
    ApiQuery({
      name: "to",
      required: false,
      type: String,
      description: "End date filter",
    }),
    ApiQuery({
      name: "field",
      required: false,
      type: String,
      description: "Field to filter by date",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityDocumentsRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityDocumentsRetrieved,
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    documentId: { type: "number", example: 12345 },
                    opportunityId: { type: "number", example: 799351 },
                    documentTypeLid: { type: "number", example: 5001 },
                    documentName: {
                      type: "string",
                      example: "Policy Document.pdf",
                    },
                    documentUrl: {
                      type: "string",
                      example:
                        "https://storage.example.com/documents/12345.pdf",
                    },
                    documentSize: { type: "number", example: 1024000 },
                    uploadedBy: { type: "number", example: 3078 },
                    uploadedAt: {
                      type: "string",
                      format: "date-time",
                      example: "2025-07-26T03:07:26.105Z",
                    },
                    description: {
                      type: "string",
                      example: "Policy document for review",
                    },
                    status: { type: "string", example: "Active" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              count: { type: "number", example: 15 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getOpportunitiesByCompanyIdSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get Opportunities by Company ID",
      description:
        "Retrieves a list of opportunities associated with a specific company ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "companyId",
      type: Number,
      required: true,
      description:
        "The ID of the company whose opportunities are to be retrieved.",
    }),
    ApiQuery({
      name: "page",
      type: Number,
      required: false,
      description: "The page number for pagination. Default is 1.",
    }),
    ApiQuery({
      name: "limit",
      type: Number,
      required: false,
      description:
        "The number of records per page for pagination. Default is 10.",
    }),
    ApiQuery({
      name: "sort",
      type: String,
      required: false,
      description:
        "Comma-separated sort fields with optional direction. Supported fields: policyType, priority, expiryDate, activityName, premium, estimatedBrokerage. Example: 'policyType:ASC,premium:DESC'.",
    }),
    ApiQuery({
      name: "excludeWon",
      type: String,
      required: false,
      description:
        "When 'true', opportunities whose status is Won are excluded from the result.",
    }),
    ApiResponse({
      status: 200,
      description: "Successfully retrieved the list of opportunities.",
    }),
    ApiResponse({
      status: 404,
      description: "No opportunities found for the provided company ID.",
    }),
    ApiResponse({
      status: 400,
      description: "Bad request due to invalid input or missing parameters.",
    }),
  );
}

export const getAllBrokingSlipVersionsSwaggerMetadata = () => {
  return applyDecorators(
    ApiExtraModels(BrokingSlipVersionDetailDto),
    ApiOperation({
      summary: "Retrieve broking slip versions by Opportunity Activity ID",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      description: "The ID of the opportunity activity",
      type: Number,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.brokeingSlipVersionsRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.brokeingSlipVersionsRetrieved,
          },
          data: {
            type: "array",
            items: { $ref: getSchemaPath(BrokingSlipVersionDetailDto) },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.brokingSlipVersionsNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.brokingSlipVersionsNotFound,
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
};

export function createPlacementSlipSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreatePlacementSlipDto),
    ApiOperation({
      summary: "Create Placement Slip",
      description: "Creates a placement slip with the provided details.",
    }),
    ApiBody({
      description: "Payload for creating a placement slip.",
      schema: {
        $ref: getSchemaPath(CreatePlacementSlipDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "Placement slip created successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: {
            type: "string",
            example: "Placement slip created successfully.",
          },
          data: {
            $ref: getSchemaPath(CreatePlacementSlipDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Placement slip creation failed.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updatePlacementSlipSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Update Placement Slip" }),
    ApiParam({
      name: "id",
      required: true,
      description: "Placement slip ID",
      example: 1,
    }),
    ApiBody({ schema: { $ref: getSchemaPath(UpdatePlacementSlipDto) } }),
    ApiResponse({ status: 200, description: "Placement slip updated." }),
    ApiResponse({ status: 404, description: "Placement slip not found." }),
    ApiResponse({ status: 400, description: "Bad request." }),
  );
}

export function deletePlacementSlipSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Soft Delete Placement Slip" }),
    ApiParam({
      name: "id",
      required: true,
      description: "Placement slip ID",
      example: 1,
    }),
    ApiResponse({ status: 200, description: "Placement slip deleted." }),
    ApiResponse({ status: 404, description: "Placement slip not found." }),
  );
}

export function updateQuoteComparisonReportByIdSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(UpdateQuoteComparisonReportDto),
    ApiOperation({
      summary: "Update Quote Comparison Report by ID",
      description:
        "Updates the Quote Comparison Report details for a specific Id, including related documents.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the Quote Comparison Report to update.",
      required: true,
      example: 1,
    }),
    ApiBody({
      description: "Payload for updating an Quote Comparison Report",
      schema: {
        $ref: getSchemaPath(UpdateQuoteComparisonReportDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Quote Comparison Report updated successfully",
      schema: {
        allOf: [
          {
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Quote Comparison Report updated successfully",
              },
              data: { $ref: getSchemaPath(UpdateQuoteComparisonReportDto) },
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote Comparison Report not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Quote Comparison Report not found for the given ID.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid input data.",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function getOpportunityContactsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Opportunity Contacts",
      description:
        "Fetches the contacts associated with a specific opportunity.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityId",
      description: "The ID of the Opportunity",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity contacts retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity contacts retrieved successfully.",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                firstName: { type: "string", example: "John" },
                lastName: { type: "string", example: "Doe" },
                displayName: { type: "string", example: "John Doe" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Opportunity contacts not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Opportunity contacts not found.",
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
          statusCode: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to fetch opportunity contacts.",
          },
        },
      },
    }),
  );
}

export function generateQuoteComparisonReportSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(QuoteComparisonReportDto),
    ApiOperation({
      summary: "Generate Quote Comparison Report",
      description:
        "Generates a premium and cover comparison report for selected quotes and broking slip version.",
    }),
    ApiBody({
      description: "Payload for generating quote comparison report.",
      schema: {
        $ref: getSchemaPath(QuoteComparisonReportDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Quote comparison report generated successfully.",
      schema: {
        type: "object",
        properties: {
          premiumComparisonSection: {
            type: "object",
            properties: {
              headers: {
                type: "object",
                properties: {
                  key: { type: "string", example: "Parameters" },
                  quote_1: { type: "string", example: "Var_sys" },
                  quote_2: { type: "string", example: "Prabhakar Insurer One" },
                },
              },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", example: "Net Premium" },
                    quote_1: { type: "number", example: 2006 },
                    quote_2: { type: "number", example: 123 },
                  },
                },
              },
            },
          },
          coverDetailSection: {
            type: "object",
            properties: {
              headers: {
                type: "object",
                properties: {
                  key: { type: "string", example: "Cover Details" },
                  quote_1: { type: "string", example: "Var_sys" },
                  quote_2: { type: "string", example: "Prabhakar Insurer One" },
                },
              },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "string",
                      example: "Pre- and Post-Hospitalization",
                    },
                    quote_1: {
                      type: "string",
                      example:
                        "Verison I - Answer for Pre- and Post-Hospitalization - Broking Slip - Quote -1",
                    },
                    quote_2: { type: "string", example: "-" },
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
      description: "Bad Request. Required fields missing or invalid.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Required fields are missing in the request.",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Not Found. Opportunity activity or covers not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example:
              "Opportunity activity not found for the given Opportunity Activity Id",
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function getQuoteEntryDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve Quote Entry details by ID",
      description:
        "Fetches a quote entry along with documents, remarks and status.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "quoteId",
      type: Number,
      required: true,
      description: "The ID of the quote entry.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Quote retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Quote retrieved successfully." },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Quote not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Quote not found." },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request. Validation failed or invalid data provided.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error. Failed to retrieve quote.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function getPolicyConfirmationCdAccountDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve CD account details for Policy Confirmation",
      description:
        "Fetches the cheque and bank details (CD account) associated with a placement slip for the given opportunity activity ID.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description: "The ID of the Opportunity Activity",
      example: 501,
    }),
    ApiResponse({
      status: 200,
      description: "CD account details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "CD account details retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              cdData: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", example: "Cheque Amount" },
                    value: { type: "string", example: "11" },
                  },
                },
                example: [
                  { key: "Cheque Amount", value: "11" },
                  { key: "Cheque Date", value: "2025-06-08" },
                  { key: "Cheque Number", value: "10100" },
                  { key: "Bank Name", value: "HDFC" },
                ],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "CD account details not found.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Opportunity activity not found for ID: 501",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "CD account details retrieval failed",
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
          message: { type: "string", example: "Internal server error." },
        },
      },
    }),
  );
}

export function updateStageOwnerSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update Stage Owner for Opportunity Activities",
      description:
        "Updates the stage owner for all activities of a given opportunity and role key.",
    }),
    ApiBody({
      description: "Payload to update stage owner",
      schema: {
        example: {
          opportunityId: 387,
          roleKey: "ROLE_ISG_EXECUTIVE",
          ownerId: 2,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Stage owner updated successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Stage owner updated successfully.",
          },
          data: {
            type: "object",
            properties: {
              opportunityId: { type: "number", example: 387 },
              roleKey: { type: "string", example: "ROLE_ISG_EXECUTIVE" },
              ownerId: { type: "number", example: 2 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No activities found for the given criteria.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "No activities found for the given criteria.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
  );
}

export function getStageOwnersByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get unique stage owners by opportunity ID",
      description:
        "Returns a list of unique stage owners and their role keys for the given opportunity.",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      required: true,
      description: "The ID of the opportunity",
      example: 387,
    }),
    ApiResponse({
      status: 200,
      description: "Stage owners retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Stage owner updated successfully.",
          },
          data: {
            type: "object",
            properties: {
              opportunityId: { type: "number", example: 387 },
              ownerId: { type: "number", example: 1 },
              roleKey: { type: "string", example: "ROLE_ISG_EXECUTIVE" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No stage owners found for the given opportunity.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "No stage owners found for the given opportunity.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data." },
        },
      },
    }),
  );
}

export const getPendingActivitiesSummarySwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get pending activities summary",
      description:
        "Retrieve counts of pending opportunity activities grouped by ageing buckets.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      description: "The page number for pagination. Default is 1.",
      example: DEFAULT_VALUES.PAGE,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      description: "Number of records per page. Default is 10.",
      example: DEFAULT_VALUES.LIMIT,
    }),
    ApiQuery({
      name: "sort",
      required: false,
      description:
        "Sorting field and order in the format field:order, e.g. next30:ASC.",
      example: "next30:ASC",
    }),
    ApiQuery({
      name: "type",
      required: false,
      description: "Filter by opportunity type (SO for Sales, RO for Renewal).",
      enum: ["SO", "RO"],
      example: "SO",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.pendingActivitiesSummaryRetrieved,
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActivityName: { type: "string", example: "KDM Meeting" },
                next30: { type: "number", example: 0 },
                next60: { type: "number", example: 1 },
                next90: { type: "number", example: 0 },
                beyond90: { type: "number", example: 0 },
                total: { type: "number", example: 1 },
              },
            },
          },
          count: { type: "number", example: 10 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.pendingActivitiesSummaryFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.pendingActivitiesSummaryFailed,
          },
        },
      },
    }),
  );
};

export const bulkUpdateOpportunitiesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Bulk update opportunities",
      description:
        "Update multiple opportunities at once with specified field changes. Allows batch processing of opportunity updates for improved efficiency. When ownerId or isgId is updated, automatically updates related OpportunityActivityMap records for the respective role (BD Executive or ISG Executive).",
    }),
    ApiBody({
      description:
        "Bulk update request containing record IDs and field updates",
      schema: {
        type: "object",
        properties: {
          recordIds: {
            type: "array",
            items: { type: "number" },
            description: "Array of opportunity IDs to update",
            example: [1, 2, 3, 4, 5],
            minItems: 1,
          },
          fieldUpdates: {
            type: "object",
            description:
              "Object containing field names and their new values. Supported fields: ownerId, isgId, statusLid, expiryDate",
            example: {
              ownerId: 123,
              isgId: 456,
              statusLid: 10,
              expiryDate: "2024-12-31",
            },
            additionalProperties: true,
          },
          userId: {
            type: "number",
            description: "ID of the user performing the bulk update",
            example: 123,
          },
        },
        required: ["recordIds", "fieldUpdates", "userId"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "All opportunities successfully updated",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Successfully updated 5 opportunities",
          },
          data: {
            type: "object",
            properties: {
              totalRecords: {
                type: "number",
                description: "Total number of records attempted",
                example: 5,
              },
              successCount: {
                type: "number",
                description: "Number of successfully updated records",
                example: 5,
              },
              failureCount: {
                type: "number",
                description: "Number of records that failed to update",
                example: 0,
              },
              errors: {
                type: "array",
                description: "Array of errors for failed updates",
                items: {
                  type: "object",
                  properties: {
                    recordId: { type: "number", example: 1 },
                    fieldName: { type: "string", example: "statusLid" },
                    errorCode: { type: "string", example: "INVALID_TYPE" },
                    errorMessage: {
                      type: "string",
                      example: "Invalid status value",
                    },
                  },
                },
                example: [],
              },
              affectedRecords: {
                type: "array",
                items: { type: "number" },
                description: "Array of successfully updated record IDs",
                example: [1, 2, 3, 4, 5],
              },
              processingDuration: {
                type: "number",
                description: "Processing duration in milliseconds",
                example: 1250,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 206,
      description: "Partial success - some opportunities updated, some failed",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 206 },
          message: {
            type: "string",
            example: "Bulk update completed with 2 failures out of 5 records",
          },
          data: {
            type: "object",
            properties: {
              totalRecords: { type: "number", example: 5 },
              successCount: { type: "number", example: 3 },
              failureCount: { type: "number", example: 2 },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    recordId: { type: "number", example: 4 },
                    fieldName: { type: "string", example: "statusLid" },
                    errorCode: { type: "string", example: "NOT_FOUND" },
                    errorMessage: {
                      type: "string",
                      example: "Opportunity not found",
                    },
                  },
                },
                example: [
                  {
                    recordId: 4,
                    fieldName: "*",
                    errorCode: "NOT_FOUND",
                    errorMessage: "Opportunity not found",
                  },
                  {
                    recordId: 5,
                    fieldName: "statusLid",
                    errorCode: "OPPORTUNITY_WON",
                    errorMessage: "Cannot bulk edit won opportunities",
                  },
                ],
              },
              affectedRecords: { type: "array", example: [1, 2, 3] },
              processingDuration: { type: "number", example: 1850 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - validation errors",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example:
              "recordIds is required and must contain at least one record ID",
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
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Opportunity bulk update failed",
          },
        },
      },
    }),
  );
};

export function addQuoteFromFinalNegotiationSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Add Quote from Final Negotiation",
      description:
        "Updates Enter Quote and QCR activities to 'In Progress' status from Final Negotiation meeting.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      required: true,
      description: "The ID of the Final Negotiation Opportunity Activity",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Quote activities updated successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Quote activities updated successfully",
          },
          data: {
            type: "object",
            properties: {
              enterQuoteActivityId: { type: "number", example: 456 },
              qcrActivityId: { type: "number", example: 789 },
              updatedStatus: { type: "string", example: "In Progress" },
              updatedCount: { type: "number", example: 2 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - Invalid input data.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Bad request" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Not found - Final negotiation activity not found.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Activity not found" },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - User ID is required.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "User ID is required" },
        },
      },
    }),
  );
}

export function getSalesFunnelSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetOpportunityBrokerageSummaryDto),
    ApiOperation({
      summary: "Get sales funnel data",
      description: "Retrieve opportunity list for sales funnel visualization",
    }),
    ApiQuery({ required: false, type: GetOpportunityBrokerageSummaryDto }),

    ApiResponse({
      status: 200,
      description: "Opportunities retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunities retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stageName: { type: "string", example: "SO" },
                soCount: { type: "number", example: 68 },
                estimatedBrokerage: { type: "number", example: 444528854.93 },
                premium: { type: "number", nullable: true, example: 1250000 },
                target: { type: "number", nullable: true },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function getBrokerageSummarySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetOpportunityMonthlyBrokerageBreakdown),
    ApiOperation({
      summary: "Get brokerage summary",
      description: "Retrieve monthly brokerage breakdown",
    }),
    ApiQuery({ name: "userId", required: false, type: Number }),
    ApiQuery({ name: "organisationId", required: false, type: Number }),
    ApiQuery({ name: "sbuId", required: false, type: Number }),
    ApiQuery({ name: "verticalId", required: false, type: Number }),
    ApiQuery({ name: "departmentId", required: false, type: Number }),
    ApiQuery({ name: "branchId", required: false, type: Number }),
    ApiQuery({ name: "financialYear", required: false, type: Number }),
    ApiQuery({ name: "quarter", required: false, type: String }),
    ApiQuery({ name: "month", required: false, type: String }),
    ApiQuery({ name: "owner", required: false, type: String }),
    ApiQuery({ name: "type", required: false, enum: ["SO", "RO"] }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Brokerage summary retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Brokerage summary retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    month: { type: "string", example: "January" },
                    estimatedBrokerage: { type: "number", example: 1234567.89 },
                    count: { type: "number", example: 15 },
                  },
                },
              },
              count: { type: "number", example: 12 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function getActivityDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get activity details",
      description: "Retrieve opportunity activity details",
    }),
    ApiResponse({
      status: 200,
      description: "Activity details retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "All activity IDs and names retrieved successfully.",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                name: { type: "string", example: "Enter Quote" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Activity not found" }),
  );
}

export function getStageDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get stage details",
      description: "Retrieve opportunity stage details",
    }),
    ApiResponse({
      status: 200,
      description: "Stage details retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Stage details retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 1 },
                name: { type: "string", example: "Prospecting" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Stage not found" }),
  );
}

export function getDocumentsByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get documents by opportunity ID",
      description: "Retrieve all documents associated with an opportunity",
    }),
    ApiParam({ name: "id", type: Number, description: "Opportunity ID" }),
    ApiResponse({
      status: 200,
      description: "Documents retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getQuotesByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get quotes by opportunity ID",
      description: "Retrieve all quotes for an opportunity",
    }),
    ApiParam({ name: "id", type: Number, description: "Opportunity ID" }),
    ApiResponse({
      status: 200,
      description: "Quotes retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function extendOpportunityExpirySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(ExtendOpportunityDto),
    ApiOperation({
      summary: "Extend opportunity expiry",
      description: "Extend the expiry date of an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiBody({
      schema: {
        $ref: getSchemaPath(ExtendOpportunityDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity expiry extended successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityExpiryDateUpdated,
          },
          data: {
            type: "object",
            properties: {
              opportunityId: { type: "number", example: 799351 },
              companyId: { type: "number", example: 267160 },
              estimatedBrokerage: { type: "number", example: 3703.88 },
              estimatedBrokeragePercentage: { type: "string", example: "0.00" },
              policyTypeLid: { type: "number", example: 15083 },
              policyStatusLid: { type: "number", example: 3103 },
              serviceLevelLid: { type: "number", example: 3701 },
              expiryDate: {
                type: "string",
                format: "date",
                example: "2026-12-31",
              },
              sumInsured: { type: "number", nullable: true, example: null },
              premiumPaid: { type: "number", example: 0 },
              estimatedFee: { type: "number", nullable: true, example: null },
              opportunityTypeLid: { type: "number", example: 4402 },
              isPolicyMinedLid: { type: "number", example: 2701 },
              source: { type: "string", nullable: true, example: null },
              opportunitySourceTypeLid: {
                type: "number",
                nullable: true,
                example: null,
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-07-26T03:07:26.105Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2026-01-20T09:05:53.272Z",
              },
              deletedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                example: null,
              },
              createdBy: { type: "number", example: 3078 },
              updatedBy: { type: "number", example: 2 },
              salesPitch: { type: "string", nullable: true, example: null },
              ownerId: { type: "number", example: 3078 },
              refPolicyId: { type: "number", example: 63609 },
              statusLid: { type: "number", example: 4606 },
              refOpportunityId: {
                type: "number",
                nullable: true,
                example: null,
              },
              amId: { type: "number", nullable: true, example: null },
              isgId: { type: "number", nullable: true, example: null },
              auditRefId: { type: "string", nullable: true, example: null },
              injectedBy: { type: "string", nullable: true, example: null },
              status: {
                type: "object",
                properties: {
                  id: { type: "number", example: 4606 },
                  lookUpKey: {
                    type: "string",
                    example: "OPPORTUNITY_STATUS_OPEN",
                  },
                  lookUpName: { type: "string", example: "OPPORTUNITY_STATUS" },
                  lookUpValueKey: { type: "string", example: "OPEN" },
                  lookUpValue: { type: "string", example: "Open" },
                  description: {
                    type: "string",
                    example: "Opportunity created",
                  },
                  lookUpOrder: { type: "number", example: 1 },
                  status: { type: "number", example: 1 },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                  createdBy: { type: "string", example: "SYSTEM" },
                  updatedBy: { type: "string", example: "SYSTEM" },
                  organisationId: { type: "number", example: 0 },
                  deletedAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    example: null,
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 403, description: "Forbidden - Permission denied" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function createDeviationTaskSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateDeviationTaskDto),
    ApiOperation({
      summary: "Create deviation task",
      description: "Create a new deviation task for an opportunity activity",
    }),
    ApiBody({
      schema: {
        $ref: getSchemaPath(CreateDeviationTaskDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "Deviation task created",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Deviation task created" },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function createOpportunityLostSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create opportunity lost",
      description: "Mark an opportunity as lost with reason and details",
    }),
    ApiBody({
      type: CreateOpportunityLostDto,
    }),
    ApiResponse({
      status: 201,
      description: "Opportunity marked as lost successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Opportunity lost" },
          data: {
            type: "object",
            properties: {
              opportunityLostId: { type: "number", example: 789 },
              opportunityId: { type: "number", example: 799351 },
              reasonLid: { type: "number", example: 5001 },
              remarks: { type: "string", example: "Customer chose competitor" },
              lostToCompetitor: { type: "string", example: "Competitor ABC" },
              lostDate: {
                type: "string",
                format: "date",
                example: "2026-01-20",
              },
              createdAt: { type: "string", format: "date-time" },
              createdBy: { type: "number", example: 3078 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request - Invalid data" }),
  );
}

export function updateOpportunityLostSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update opportunity lost",
      description: "Update lost opportunity details and reason",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          reasonLid: {
            type: "number",
            example: 5001,
            description: "Updated lost reason lookup ID",
          },
          remarks: {
            type: "string",
            example: "Updated remarks",
            description: "Updated remarks",
          },
          lostToCompetitor: {
            type: "string",
            example: "Competitor XYZ",
            description: "Updated competitor name",
          },
          lostDate: {
            type: "string",
            format: "date",
            example: "2026-01-20",
            description: "Updated lost date",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Lost opportunity updated successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Lost opportunity updated successfully",
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Updated opportunity lost data from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function updateRfpDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update RFP details",
      description: "Update RFP entry details for an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          rfpDate: { type: "string", format: "date", example: "2026-01-20" },
          rfpDetails: { type: "string", example: "RFP submitted to insurers" },
          expectedResponseDate: {
            type: "string",
            format: "date",
            example: "2026-02-20",
          },
          documents: { type: "array", items: { type: "object" } },
          participants: { type: "array", items: { type: "object" } },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "RFP Details Entry updated successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "RFP Details Entry updated successfully.",
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Result object from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request - Invalid RFP data" }),
    ApiResponse({ status: 404, description: "Opportunity activity not found" }),
  );
}

export function getBrokingSlipVersionDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip version details",
      description: "Retrieve version details of a broking slip",
    }),
    ApiParam({
      name: "brokingSlipVersionId",
      type: Number,
      description: "Broking slip version ID",
    }),
    ApiResponse({
      status: 200,
      description: "Broking slip version details retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Broking slip version not found" }),
  );
}

export function createBrokingSlipVersionSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateBrokingSlipVersionDto),
    ApiOperation({
      summary: "Create broking slip version",
      description: "Create a new version of a broking slip",
    }),
    ApiBody({
      schema: {
        $ref: getSchemaPath(CreateBrokingSlipVersionDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "Broking slip version created successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function updateBrokingSlipVersionSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateBrokingSlipVersionDto),
    ApiOperation({
      summary: "Update broking slip version",
      description: "Update an existing broking slip version",
    }),
    ApiParam({
      name: "versionId",
      type: Number,
      description: "Broking slip version ID",
    }),
    ApiBody({
      schema: {
        $ref: getSchemaPath(CreateBrokingSlipVersionDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityMetaRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityActivityMetaRetrieved,
          },
          data: {
            type: "object",
            properties: {
              versionId: { type: "number", example: 123 },
              opportunityActivityId: { type: "number", example: 456 },
              versionNumber: { type: "number", example: 1 },
              statusLid: { type: "number", example: 4606 },
              brokingSlipVersionDetails: {
                type: "object",
                properties: {
                  insurers: { type: "array", items: { type: "object" } },
                  covers: { type: "array", items: { type: "object" } },
                  premium: { type: "number" },
                  sumInsured: { type: "number" },
                },
              },
              updatedAt: { type: "string", format: "date-time" },
              updatedBy: { type: "number", example: 3078 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Broking slip version not found" }),
  );
}

export function deleteBrokingSlipVersionSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete broking slip version",
      description: "Delete a broking slip version",
    }),
    ApiParam({
      name: "brokingSlipVersionId",
      type: Number,
      description: "Broking slip version ID",
    }),
    ApiResponse({
      status: 200,
      description: "Broking slip version deleted successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Broking slip version not found" }),
  );
}

export function updatePremiumCalculationSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update premium calculation",
      description:
        "Update premium calculation details for an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiBody({
      type: UpdatePremiumCalculationDto,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.premiumCalculationUpdated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.premiumCalculationUpdated,
          },
          data: {
            type: "object",
            properties: {
              opportunityActivityId: { type: "number", example: 456 },
              premium: { type: "number", example: 50000 },
              sumInsured: { type: "number", example: 1000000 },
              tax: { type: "number", example: 9000 },
              netPremium: { type: "number", example: 41000 },
              brokerage: { type: "number", example: 5000 },
              brokeragePercentage: { type: "number", example: 10 },
              updatedAt: { type: "string", format: "date-time" },
              updatedBy: { type: "number", example: 3078 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - Invalid calculation data",
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.premiumCalculationNotFound,
    }),
  );
}

export function getExcelGenerationUrlSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Excel generation URL",
      description: "Generate and retrieve URL for Excel file",
    }),
    ApiBody({
      type: ExcelGenerationDto,
    }),
    ApiResponse({
      status: 200,
      description: "Excel generation URL retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Excel generation URL retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              url: {
                type: "string",
                example:
                  "https://storage.example.com/excel/broking-slip-123.xlsx",
                description: "Download URL for the generated Excel file",
              },
              fileName: {
                type: "string",
                example: "broking-slip-123.xlsx",
                description: "Name of the generated file",
              },
              expiresAt: {
                type: "string",
                format: "date-time",
                example: "2026-01-20T12:00:00Z",
                description: "URL expiration timestamp",
              },
              fileSize: {
                type: "number",
                example: 2048000,
                description: "File size in bytes",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - Invalid request payload",
    }),
    ApiResponse({ status: 404, description: "Resource not found" }),
  );
}

export function getRenewalOpportunitiesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create renewal opportunity",
      description: "Create a new renewal opportunity from existing opportunity",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          optyType: {
            type: "string",
            example: "RO",
            description: "Opportunity type",
          },
          companyId: { type: "number", example: 267160 },
          policyTypeLid: { type: "number", example: 15083 },
          expiryDate: { type: "string", format: "date", example: "2026-12-31" },
          estimatedBrokerage: { type: "number", example: 3703.88 },
          ownerId: { type: "number", example: 3078 },
          refPolicyId: { type: "number", example: 63609 },
        },
        required: ["optyType", "companyId", "ownerId"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Renewal opportunity created successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Renewal opportunity created successfully",
          },
          data: {
            type: "object",
            properties: {
              opportunityId: { type: "number", example: 799999 },
              optyType: { type: "string", example: "RO" },
              companyId: { type: "number", example: 267160 },
              companyName: { type: "string", example: "IIRM India" },
              policyTypeLid: { type: "number", example: 15083 },
              policyType: { type: "string", example: "Group Mediclaim Policy" },
              expiryDate: {
                type: "string",
                format: "date",
                example: "2026-12-31",
              },
              estimatedBrokerage: { type: "number", example: 3703.88 },
              ownerId: { type: "number", example: 3078 },
              ownerName: { type: "string", example: "John Doe" },
              refPolicyId: { type: "number", example: 63609 },
              createdAt: { type: "string", format: "date-time" },
              createdBy: { type: "number", example: 3078 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Referenced policy not found" }),
  );
}

export function getOpportunityAnalyticsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity analytics",
      description: "Retrieve analytics data for opportunities",
    }),
    ApiQuery({ name: "userId", required: false, type: Number }),
    ApiQuery({ name: "organizationId", required: false, type: Number }),
    ApiQuery({ name: "startDate", required: false, type: String }),
    ApiQuery({ name: "endDate", required: false, type: String }),
    ApiResponse({
      status: 200,
      description: "Analytics data retrieved successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function updateOpportunityStageSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update opportunity stage",
      description: "Update the current stage of an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiBody({ type: Object }),
    ApiResponse({
      status: 200,
      description: "Opportunity stage updated successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getOpportunityTimelineSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity timeline",
      description: "Retrieve timeline of activities for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Timeline retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function assignOpportunityUserSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Assign user to opportunity",
      description: "Assign a user to an opportunity",
    }),
    ApiBody({ type: Object }),
    ApiResponse({
      status: 200,
      description: "User assigned successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Opportunity or user not found" }),
  );
}

export function bulkAssignOpportunitiesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Bulk assign opportunities",
      description: "Assign multiple opportunities to users",
    }),
    ApiBody({ type: Object }),
    ApiResponse({
      status: 200,
      description: "Opportunities assigned successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );
}

export function getOpportunityNotesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity notes",
      description: "Retrieve all notes for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Notes retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getOpportunityTasksSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity tasks",
      description: "Retrieve all tasks for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Tasks retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function downloadOpportunityReportSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download opportunity report",
      description: "Generate and download opportunity report",
    }),
    ApiQuery({ name: "format", required: false, type: String }),
    ApiQuery({ name: "opportunityId", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Report downloaded successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function cloneOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Clone opportunity",
      description: "Create a copy of an existing opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID to clone",
    }),
    ApiResponse({
      status: 201,
      description: "Opportunity cloned successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function mergeOpportunitiesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Merge opportunities",
      description: "Merge multiple opportunities into one",
    }),
    ApiBody({ type: Object }),
    ApiResponse({
      status: 200,
      description: "Opportunities merged successfully",
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({
      status: 404,
      description: "One or more opportunities not found",
    }),
  );
}

export function archiveOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Archive opportunity",
      description: "Archive an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity archived successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function restoreOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Restore opportunity",
      description: "Restore an archived opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Opportunity restored successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getOpportunityHistorySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity history",
      description: "Retrieve change history for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "History retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export const getOpportunitiesByContactIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunities by contact ID",
      description: "Retrieve all policies associated with a contact",
    }),
    ApiParam({
      name: "contactId",
      type: Number,
      description: "Contact ID",
    }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "type", required: false, enum: ["SO", "RO"] }),

    ApiResponse({
      status: 200,
      description: "Policies retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Policies retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 432689 },
                    policyName: {
                      type: "string",
                      example: "2949206593103300000",
                    },
                    companyName: {
                      type: "string",
                      example: "ANTHEM GLOBAL TECHNOLOGY SERVICES",
                    },
                    contact: { type: "string", nullable: true, example: null },
                    opportunityId: {
                      type: "number",
                      nullable: true,
                      example: null,
                    },
                    policyType: {
                      type: "string",
                      example: "Bharat_Sookshma_Udyam_Suraksha",
                    },
                    status: { type: "string", example: "Active" },
                    sumInsured: { type: "string", example: "0" },
                    premium: { type: "string", example: "0" },
                    brokerage: {
                      type: "number",
                      nullable: true,
                      example: null,
                    },
                    policyFrom: {
                      type: "string",
                      format: "date",
                      example: "2024-07-05",
                    },
                    policyTo: {
                      type: "string",
                      format: "date",
                      example: "2898-01-01",
                    },
                    accountManager: {
                      type: "string",
                      example: "Manish Mishra",
                    },
                    policyNumber: {
                      type: "string",
                      example: "2949206593103300000",
                    },
                  },
                },
              },
              count: { type: "number", example: 1 },
            },
          },
        },
      },
    }),

    ApiResponse({ status: 404, description: "Contact not found" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getQuotesBasedOnOpportunityActivityIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get quotes by opportunity activity ID",
      description: "Retrieve all quotes for an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),

    ApiResponse({
      status: 200,
      description: "Opportunities retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunities retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    contactId: { type: "number", example: 104062 },
                    opportunityId: { type: "number", example: 674553 },
                    estimatedBrokerage: {
                      type: "number",
                      nullable: true,
                      example: 2,
                    },
                    policyType: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 3202 },
                        value: {
                          type: "string",
                          example: "Group Mediclaim Policy",
                        },
                      },
                    },
                    status: {
                      type: "object",
                      properties: {
                        id: { type: "number", example: 4505 },
                        value: { type: "string", example: "Lost" },
                      },
                    },
                    sumInsured: { type: "number", example: 50 },
                    expiryDate: {
                      type: "string",
                      format: "date",
                      example: "2025-08-01",
                    },
                    opportunityIdentifier: {
                      type: "string",
                      example: "Group Mediclaim Policy (50)",
                    },
                  },
                },
              },
              count: { type: "number", example: 45 },
            },
          },
        },
      },
    }),

    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "Opportunity activity not found" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
  );

export function getQuoteByIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get finalised quote by ID",
      description: "Retrieve a specific finalised quote",
    }),
    ApiParam({ name: "quoteId", type: Number, description: "Quote ID" }),
    ApiResponse({
      status: 200,
      description: "Quote retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.quoteRetrieved },
          data: {
            type: "object",
            properties: {
              quoteId: { type: "number", example: 123 },
              opportunityActivityId: { type: "number", example: 456 },
              brokingSlipId: { type: "number", example: 789 },
              insurerId: { type: "number", example: 101 },
              insurerName: { type: "string", example: "ABC Insurance" },
              premium: { type: "number", example: 50000 },
              sumInsured: { type: "number", example: 1000000 },
              quotedDate: {
                type: "string",
                format: "date",
                example: "2025-01-15",
              },
              status: { type: "string", example: "Finalised" },
              covers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    coverId: { type: "number" },
                    coverName: { type: "string" },
                    sumInsured: { type: "number" },
                    premium: { type: "number" },
                  },
                },
              },
              documents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    documentId: { type: "number" },
                    documentTypeLid: { type: "number" },
                    documentName: { type: "string" },
                    documentUrl: { type: "string" },
                  },
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Quote not found" }),
  );
}

export function getPreferredInsurersSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get preferred insurers",
      description: "Retrieve preferred insurers for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Preferred insurers retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Preferred insurers retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              preferredInsurers: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insurerId: { type: "number" },
                        insurerName: { type: "string" },
                        isPreferred: { type: "boolean" },
                      },
                    },
                  },
                  count: { type: "number", example: 5 },
                },
              },
              insurerDetails: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insurerId: { type: "number" },
                        insurerName: { type: "string" },
                      },
                    },
                  },
                  count: { type: "number", example: 10 },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getCoverDataPrefillSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get cover data prefill",
      description: "Retrieve cover data for prefilling forms",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Cover details retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Cover details retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              covers: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Cover map ID to cover response mapping",
                example: {
                  "1": "IPD Cover: Sum Insured 500000",
                  "2": "OPD Cover: Per visit limit 5000",
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Opportunity activity not found" }),
  );
}

export const getExistingMandateDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Fetch existing mandate details",
      description:
        "Retrieve existing mandate details for an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),

    ApiResponse({
      status: 200,
      description: "Mandate details retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Mandate details retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 8 },
              opportunityId: { type: "number", example: 661722 },
              activityId: { type: "number", example: 3 },
              opportunityActivityId: { type: "number", example: 78196 },
              dataActivity: {
                type: "object",
                properties: {
                  mandateDetailsFromFields: {
                    type: "object",
                    properties: {
                      mandateTypeLid: { type: "number", example: 7001 },
                      validFrom: {
                        type: "string",
                        format: "date",
                        example: "2025-06-29",
                      },
                      validTo: {
                        type: "string",
                        format: "date",
                        example: "2025-07-31",
                      },
                      compensationPayable: { type: "number", example: 10000 },
                      compensationTypeLid: { type: "number", example: 6301 },
                      issuedOn: {
                        type: "string",
                        format: "date",
                        example: "2025-07-01",
                      },
                      remarks: { type: "string", example: "ok" },
                      mandateDetailsContacts: {
                        type: "array",
                        items: { type: "object" },
                      },
                    },
                  },
                  documents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        documentId: {
                          type: "number",
                          nullable: true,
                          example: null,
                        },
                        documentTypeLid: {
                          type: "number",
                          nullable: true,
                          example: null,
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

    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Mandate not found" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
  );

export const getOpportunityBrokerageSummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity brokerage summary",
      description:
        "Retrieve brokerage calculation details for a specific opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),

    ApiResponse({
      status: 200,
      description: "Opportunity Brokerage retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity Brokerage retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              sumInsured: { type: "number", example: 100 },
              basicPremium: { type: "number", example: 0 },
              basicBrokeragePercentage: { type: "number", example: 8.5 },
              basicBrokerageAmount: { type: "number", example: 0 },

              tcBrokerageAmount: { type: "number", example: 0 },

              fee: { type: "number", example: 0 },
              feePercentage: { type: "number", example: 0 },

              gstPercentage: { type: "number", example: 100 },
              gstAmount: { type: "number", example: 0 },

              other: { type: "number", example: 0 },
              otherPercentage: { type: "number", example: 0 },

              netPremium: { type: "number", example: 0 },
              grossPremium: { type: "number", example: 0 },

              terrorism: { type: "number", example: 0 },
              terrorismBrokeragePercentage: { type: "number", example: 0 },

              srccAmount: { type: "number", example: 0 },
              srccPercentage: { type: "number", example: 0 },
              srccBrokerageAmount: { type: "number", example: 0 },

              adminCharges: { type: "number", example: 0 },
              adminChargesPercentage: { type: "number", example: 0 },

              cessAmount: { type: "number", example: 0 },
              cessPercentage: { type: "number", example: 0 },

              totalBrokerageAmount: { type: "number", example: 0 },
            },
          },
        },
      },
    }),

    ApiResponse({ status: 404, description: "Opportunity not found" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 400, description: "Bad request" }),
  );

export function opportunityActivityApprovalSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Activity approval",
      description: "Approve or reject an opportunity activity with remarks",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          isApproved: {
            type: "boolean",
            example: true,
            description: "Approval status",
          },
          remarks: {
            type: "string",
            example: "Approved after review",
            description: "Approval remarks",
          },
          approvalLevel: {
            type: "number",
            example: 1,
            description: "Approval level",
          },
        },
        required: ["isApproved"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Activity approval processed successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Activity has been approved successfully.",
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Opportunity activity object from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Activity not found" }),
  );
}

export function updateOpportunityActivityMetaSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update activity meta",
      description: "Update metadata for an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          activityMeta: {
            type: "object",
            description: "Activity metadata object",
          },
          statusLid: { type: "number", example: 4606 },
          remarks: { type: "string", example: "Activity updated" },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Activity meta updated successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Activity metadata updated successfully",
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Result object from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Activity not found" }),
  );
}

export function deleteQuoteEntrySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete quote entry",
      description: "Soft delete a specific quote entry",
    }),
    ApiParam({ name: "quoteId", type: Number, description: "Quote ID" }),
    ApiResponse({
      status: 200,
      description: successMessage.quoteDeleted,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.quoteDeleted },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Quote not found" }),
  );
}

export function getBrokingSlipByOpportunityActivityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip by opportunity activity ID",
      description:
        "Retrieve broking slip data for a specific opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityMetaRetrieved,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityActivityMetaRetrieved,
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Broking slip object from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: "Forbidden - Permission denied" }),
    ApiResponse({ status: 404, description: "Broking slip not found" }),
  );
}

export function getBrokingSlipVersionsByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip versions",
      description: "Retrieve all versions of broking slip for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityMetaRetrieved,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityActivityMetaRetrieved,
          },
          data: {
            type: "object",
            additionalProperties: true,
            description: "Broking slip versions object from service layer",
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: "Forbidden - Permission denied" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function getBrokingSlipByVersionIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip by version ID",
      description:
        "Retrieve a specific version of broking slip for an opportunity",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiParam({
      name: "versionId",
      type: Number,
      description: "Broking slip version ID",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityCreated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.opportunityActivityCreated,
          },
          data: {
            type: "object",
            properties: {
              versionId: { type: "number", example: 123 },
              opportunityId: { type: "number", example: 799351 },
              opportunityActivityId: { type: "number", example: 456 },
              versionNumber: { type: "number", example: 1 },
              versionName: { type: "string", example: "Initial Version" },
              status: { type: "string", example: "Active" },
              brokingSlipDetails: {
                type: "object",
                properties: {
                  insurers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insurerId: { type: "number" },
                        insurerName: { type: "string" },
                        premium: { type: "number" },
                        sumInsured: { type: "number" },
                      },
                    },
                  },
                  covers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        coverId: { type: "number" },
                        coverName: { type: "string" },
                        premium: { type: "number" },
                        sumInsured: { type: "number" },
                      },
                    },
                  },
                  totalPremium: { type: "number", example: 50000 },
                  totalSumInsured: { type: "number", example: 1000000 },
                  documents: { type: "array", items: { type: "object" } },
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              createdBy: { type: "number", example: 3078 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: "Forbidden - Permission denied" }),
    ApiResponse({ status: 404, description: "Broking slip version not found" }),
  );
}

export function getAllBrokingSlipVersionsByOpportunityIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip Excel data",
      description: "Retrieve Excel data for all broking slip versions",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: "Excel data retrieved successfully",
    }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}

export function regenerateRenewalOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Regenerate renewal opportunity",
      description:
        "Regenerate a renewal opportunity based on from date and duration",
    }),
    ApiBody({
      type: RenewalOpportunityDto,
    }),
    ApiResponse({
      status: 200,
      description: "Renewal opportunities created successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Renewal opportunities created successfully.",
          },
          data: {
            type: "object",
            properties: {
              created: {
                type: "number",
                example: 15,
                description: "Number of renewal opportunities created",
              },
              failed: {
                type: "number",
                example: 0,
                description: "Number of failures",
              },
              total: {
                type: "number",
                example: 15,
                description: "Total opportunities processed",
              },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    opportunityId: { type: "number", example: 123456 },
                    renewalOpportunityId: { type: "number", example: 789012 },
                    companyId: { type: "number", example: 267160 },
                    status: { type: "string", example: "created" },
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
      description: "Bad request - Invalid fromDate or duration",
    }),
    ApiResponse({
      status: 404,
      description: "No opportunities found for renewal",
    }),
  );
}

export function getCautionDepositsByCompanySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get caution deposits by company",
      description: "Retrieve caution deposits for a company",
    }),
    ApiParam({ name: "companyId", type: Number, description: "Company ID" }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Caution deposits retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity Brokerage retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                accountName: { type: "string" },
                accountNumber: { type: "string" },
                openBalance: { type: "number" },
                cdAccountType: { type: "object" },
              },
            },
          },
          count: { type: "number" },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
  );
}

export function getOpportunityActivityTasksSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get opportunity activity tasks",
      description: "Retrieve all tasks associated with an opportunity activity",
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID",
    }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Opportunity activity tasks retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity activity tasks retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    taskName: { type: "string" },
                    description: { type: "string" },
                    dueDate: { type: "string", format: "date" },
                    assignee: {
                      type: "object",
                      properties: {
                        userId: { type: "number" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                      },
                    },
                    priority: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        lookUpValue: { type: "string" },
                      },
                    },
                    taskStatus: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        lookUpValue: { type: "string" },
                      },
                    },
                    company: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        name: { type: "string" },
                        displayName: { type: "string" },
                      },
                    },
                    opportunity: {
                      type: "object",
                      properties: {
                        opportunityId: { type: "number" },
                        policy: { type: "string" },
                      },
                    },
                    activity: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        activityName: { type: "string" },
                      },
                    },
                  },
                },
              },
              count: { type: "number" },
              isAlltasksCompleted: { type: "boolean" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Opportunity activity not found" }),
  );
}

export function getBrokingSlipExcelDataSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get broking slip Excel data",
      description:
        "Retrieve Excel data for all broking slip versions by opportunity ID with complete form data including general data, TPA details, expiring policy details, insurer details, covers configuration, terms and conditions, and disclaimers",
    }),
    ApiParam({
      name: "opportunityId",
      type: Number,
      description: "Opportunity ID",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.opportunityActivityMetaRetrieved,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Opportunity activity meta retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                versionName: { type: "string", example: "Version 1" },
                policyType: {
                  type: "string",
                  example: "Group Mediclaim Policy",
                },
                organisationName: { type: "string", example: "IIRM India" },
                formData: {
                  type: "object",
                  properties: {
                    generalData: {
                      type: "object",
                      properties: {
                        "Name of the insured": { type: "string" },
                        "Address of Insured/Proposer": { type: "string" },
                        "Business Activities of Company": { type: "string" },
                        "Name of Directors / Partners / Proprietor": {
                          type: "string",
                        },
                        "Contact person name": { type: "string" },
                        Designation: { type: "string" },
                        "Contact number": { type: "string" },
                        "Email-ID": { type: "string" },
                      },
                    },
                    preferredTpaDetails: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Name: { type: "string" },
                        },
                      },
                    },
                    expiringPolicyDetails: {
                      type: "object",
                      properties: {
                        "Period of Insurance and Policy Number": {
                          type: "string",
                        },
                        "Name of Existing TPA (if any)": { type: "string" },
                        "Period of Insurance From": {
                          type: "string",
                          format: "date",
                        },
                        "Period of Insurance To": {
                          type: "string",
                          format: "date",
                        },
                        "Previous Premium": { type: "string" },
                        "Claims Experience": { type: "string" },
                      },
                    },
                    preferredInsurerDetails: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Name: { type: "string" },
                        },
                      },
                    },
                    coversConfig: {
                      type: "object",
                      properties: {
                        "Family Sum Insured": { type: "string" },
                        "No. of Employees": { type: "string", example: "17" },
                        "No. of Lives to be Covered": { type: "string" },
                        "No. of Members - Employees": { type: "string" },
                        "No. of Members - Spouses": { type: "string" },
                        "No. of Members - Children": { type: "string" },
                        "No. of Members - Parents": { type: "string" },
                        "No. of Members - In-laws": { type: "string" },
                        "No. of Lives to be Added": { type: "string" },
                        "Parent & In-law - Included or Excluded": {
                          type: "string",
                        },
                        "Definition of Parents/In-laws": { type: "string" },
                        "Pre-existing Conditions (PEDs)": { type: "string" },
                        "PED Waiting Period": { type: "string" },
                        "Maternity Benefit": { type: "string" },
                        "Maternity Waiting Period": { type: "string" },
                        "Maternity Benefit - Sub-Limit": { type: "string" },
                        "Copay / Coinsurance": { type: "string" },
                        "Pre & Post Hospitalisation": { type: "string" },
                        "Ambulance Expenses": { type: "string" },
                        "Network Hospitals Only or Anywhere in India": {
                          type: "string",
                        },
                        "Cashless or Reimbursement or Both": { type: "string" },
                        "Day Care Procedure - Covered or Not": {
                          type: "string",
                        },
                        "Room Rent": { type: "string" },
                        "Domiciliary Hospitalisation (Domiciliary Treatment)": {
                          type: "string",
                        },
                        "AYUSH Treatment": { type: "string" },
                        "Initial waiting period": { type: "string" },
                        "OPD Expenses": { type: "string" },
                        "Dental Treatment": { type: "string" },
                        "Wellness Benefits": { type: "string" },
                        "Congenital Diseases / Disorders": { type: "string" },
                        "New Born Baby Cover": { type: "string" },
                        "Automatic inclusion of new born": { type: "string" },
                      },
                    },
                    otherTermsAndConditions: {
                      type: "object",
                      properties: {
                        "Additional Covers": { type: "string" },
                        "Exclusions (if any)": { type: "string" },
                        "Specific requirements, if any": { type: "string" },
                      },
                    },
                    disclaimer: {
                      type: "object",
                      properties: {
                        Note: { type: "string" },
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
    ApiResponse({ status: 403, description: "Forbidden - Permission denied" }),
    ApiResponse({ status: 404, description: "Opportunity not found" }),
  );
}
