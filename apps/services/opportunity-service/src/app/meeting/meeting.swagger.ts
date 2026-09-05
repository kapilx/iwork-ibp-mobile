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
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { MeetingDto } from "./dto/meeting-response.dto";
import { GetMeetingsDto } from "./dto/get-meetings.dto";
import { CreateMeetingFeedbackDto } from "./dto/create-meeting-feedback.dto";

export const createMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateMeetingDto),
    ApiOperation({
      summary: "Create a new meeting",
      description: "Create a new meeting",
    }),
    ApiBody({
      description: "Meeting data",
      schema: {
        $ref: getSchemaPath(CreateMeetingDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.meetingCreation,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.meetingCreation },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.meetingCreationFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.meetingCreationFailed,
          },
        },
      },
    })
  );
};

export const updateMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateMeetingDto),
    ApiOperation({
      summary: "Update a meeting",
      description: "Update a meeting",
    }),
    ApiParam({
      name: "id",
      description: "Meeting ID",
      type: Number,
    }),
    ApiBody({
      description: "Meeting data",
      schema: {
        $ref: getSchemaPath(UpdateMeetingDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.meetingUpdated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.meetingUpdated },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.meetingUpdateFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.meetingUpdateFailed,
          },
        },
      },
    })
  );
};

export const getMeetingByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(MeetingDto),
    ApiOperation({
      summary: "Get meeting by ID",
      description: "Get meeting by ID",
    }),
    ApiParam({
      name: "id",
      description: "Meeting ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.meetingDetails,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.meetingDetails },
          data: {
            $ref: getSchemaPath(MeetingDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.meetingNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.meetingNotFound },
        },
      },
    })
  );
};

export const deleteMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete a meeting",
      description: "Delete a meeting",
    }),
    ApiParam({
      name: "id",
      description: "Meeting ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.meetingDeleted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.meetingDeleted },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.meetingNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.meetingNotFound },
        },
      },
    })
  );
};

export const getMeetingsSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get all meetings",
      description: "Get all meetings",
    }),
    ...Object.keys(GetMeetingsDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetMeetingsDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetMeetingsDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.meetingList,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.meetingList },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  $ref: getSchemaPath(MeetingDto),
                },
              },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    })
  );
};

export const completeMeetingSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateMeetingDto, CreateMeetingFeedbackDto),
    ApiOperation({
      summary: "Submit meeting feedback",
      description: "Submit feedback for a meeting",
    }),
    ApiParam({
      name: "id",
      description: "Meeting ID",
      type: Number,
    }),
    ApiBody({
      description: "Meeting feedback data",
      schema: {
        $ref: getSchemaPath(CreateMeetingFeedbackDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.meetingFeedbackSubmitted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.meetingFeedbackSubmitted,
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.meetingFeedbackSubmissionFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.meetingFeedbackSubmissionFailed,
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.meetingNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.meetingNotFound },
        },
      },
    })
  );
};

export const getMeetingsByOpportunityActivitySwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get meetings by opportunity activity",
      description: "Retrieve all meetings associated with an opportunity activity"
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID"
    }),
    ApiResponse({
      status: 200,
      description: "Meeting list retrieval successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Meeting list retrieval successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                meetingDate: { type: "string", example: "2025-06-30" },
                startTime: { type: "string", example: "04:00:00+05:30" },
                duration: { type: "number", nullable: true },
                endTime: { type: "string", example: "05:00:00+05:30" },
                meetingSubject: { type: "string", example: "KDM Meeting" },
                meetingAgenda: { type: "string", example: "KDM Meeting" },
                meetingRating: { type: "number", nullable: true },
                isFeedbackSubmitted: { type: "boolean", nullable: true },
                remarks: { type: "string", nullable: true },
                id: { type: "number", example: 192 },
                company: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 39419 },
                    name: { type: "string", example: "FIRST AMERICAN (INDIA) PRIVATE LIMITED" },
                    displayName: { type: "string", example: "FIRST AMERICAN (INDIA) PRIVATE LIMITED" }
                  }
                },
                opportunity: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 661722 },
                    policy: { type: "string", example: "Group Mediclaim Policy" }
                  }
                },
                activity: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 78195 },
                    activityKey: { type: "string", example: "kdm_meeting_activity" },
                    activityName: { type: "string", example: "Renewal KDM Meeting" }
                  }
                },
                meetingDocs: { type: "array", items: { type: "object" } },
                meetingType: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 7601 },
                    lookUpValue: { type: "string", example: "KDM Meeting" }
                  }
                },
                meetingStatus: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 7502 },
                    lookUpValue: { type: "string", example: "Completed" }
                  }
                },
                locationType: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 7202 },
                    lookUpValue: { type: "string", example: "Client Location" }
                  }
                }
              }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.meetingNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.meetingNotFound }
        }
      }
    })
  );
};