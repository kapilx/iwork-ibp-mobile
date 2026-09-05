import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { GetNotificationDto } from "./dto/get-notification.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { GetNotificationInfoDto,NotificationInfoResponseDto } from "./dto/get-notification.dto";
import { successMessage, errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

// Swagger metadata for POST /notifications endpoint
export const sendNotificationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(SendNotificationDto),
    ApiOperation({
      summary: "Send Notification",
      description: "Sends a notification to specified users via email, SMS, or in-app notification based on event type and channel.",
    }),
    ApiBody({
      description: "Notification payload",
      schema: {
        $ref: getSchemaPath(SendNotificationDto),
      },
    }),
   ApiResponse({
  status: 200,
  description: successMessage.notificationRetrieved,
  schema: {
    type: "object",
    properties: {
      statusCode: {
        type: "number",
        example: 200,
      },
      message: {
        type: "string",
        example: successMessage.notificationRetrieved,
      },
      data: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "SUCCESS",
            enum: ["SUCCESS", "FAILED"],
          },
        },
      },
    },
  },
}),

    ApiResponse({
      status: 400,
      description: "Bad Request - User email or ID required",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: { type: "string", example: errorMessages.notificationUserRequired },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.notificationSendFailed,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: errorMessages.notificationSendFailed },
        },
      },
    })
  );

// Swagger metadata for GET /notifications endpoint
export const getNotificationsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetNotificationDto),
    ApiOperation({
      summary: "Get Notifications",
      description: "Retrieves a paginated list of notifications for the authenticated user with optional status filtering.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number for pagination",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of notifications per page",
      example: 10,
    }),
    ApiQuery({
      name: "status",
      required: false,
      type: String,
      description: "Filter by notification status",
      example: "NOTIFICATION_READ",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.notificationRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: {
            type: "number",
            example: 200,
          },
          message: {
            type: "string",
            example: successMessage.notificationRetrieved,
          },
          data: {
            type: "object",
            properties: {
              notification: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "number",
                      example: 2986852,
                    },
                    subject: {
                      type: "string",
                      example: "IIRM Opportunity Expiration",
                    },
                    statusLid: {
                      type: "number",
                      example: 7801,
                    },
                    userId: {
                      type: "number",
                      example: 2,
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2025-10-05T23:31:31.456Z",
                    },
                    deletedAt: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                      example: null,
                    },
                    body: {
                      type: "object",
                      properties: {
                        entityType: {
                          type: "string",
                          example: "opportunities",
                        },
                        entityId: {
                          type: "number",
                          example: 1010733,
                        },
                        content: {
                          type: "string",
                          example:
                            "An opportunity is close to expiry. Access it here: https://iwork.dev.indiainsure.com/opportunities/1010733",
                        },
                      },
                    },
                  },
                },
              },
              unreadCount: {
                type: "number",
                example: 10952,
              },
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.notificationRetrievalFailed,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: errorMessages.notificationRetrievalFailed },
        },
      },
    })
  );

// Swagger metadata for GET /notifications/check-latest-notification endpoint
export const checkLatestNotificationSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Check Latest Notification",
      description: "Checks for the latest notification based on notification ID and status.",
    }),
    ApiQuery({
      name: "notificationId",
      required: true,
      type: String,
      description: "Notification ID to check",
      example: "123",
    }),
    ApiQuery({
      name: "status",
      required: true,
      type: String,
      description: "Notification status to filter",
      example: "NOTIFICATION_READ",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.notificationRetrieved,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.notificationRetrieved },
          data: {
            type: "object",
            properties: {
              anyNewNotification: {
                type: "boolean",
                example: false,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.notificationRetrievalFailed,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: errorMessages.notificationRetrievalFailed },
        },
      },
    })
  );

// Swagger metadata for PUT /notifications/update-status endpoint
export const updateNotificationStatusSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateStatusDto),
    ApiOperation({
      summary: "Update Notification Status",
      description: "Updates the read/unread/delete status of a notification.",
    }),
    ApiBody({
      description: "Status update payload",
      schema: {
        $ref: getSchemaPath(UpdateStatusDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.notificationUpdated,
      schema: {
        type: "object",
         properties: {
          notification: {
            type: "object",
            nullable: true,
            example: null,
          },
          unreadCount: {
            type: "number",
            example: 10952,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    })
  );

// Swagger metadata for GET /notifications/info endpoint
export const getNotificationInfoSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetNotificationInfoDto, NotificationInfoResponseDto),
    ApiOperation({
      summary: "Get Notification Info",
      description: "Retrieves notification info (email/SMS) from notification_info table based on userId with pagination support.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number for pagination (default: 1)",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page (default: 10)",
      example: 10,
    }),
    ApiQuery({
      name: "status",
      required: false,
      type: String,
      description: "Filter by notification status",
      example: "sent",
    }),
    ApiResponse({
      status: 200,
      description: "Successfully retrieved notification info",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 200,
          },
          message: {
            type: "string",
            example: "Notification info retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  $ref: getSchemaPath(NotificationInfoResponseDto),
                },
              },
              total: { type: "number", example: 25 },
              page: { type: "number", example: 1 },
              limit: { type: "number", example: 10 },
              totalPages: { type: "number", example: 3 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: "Failed to retrieve notification info" },
          data: { type: "string", example: "Internal server error" },
        },
      },
    })
  );

// Swagger metadata for GET /notifications/info/:id endpoint
export const getNotificationInfoByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(NotificationInfoResponseDto),
    ApiOperation({
      summary: "Get Notification Info by ID",
      description: "Retrieves a specific notification info (email/SMS) from notification_info table by its ID.",
    }),
    ApiResponse({
      status: 200,
      description: "Successfully retrieved notification info",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 200,
          },
          message: {
            type: "string",
            example: "Notification info retrieved successfully",
          },
          data: {
            $ref: getSchemaPath(NotificationInfoResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid ID format",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid notification ID format" },
          data: { type: "null", example: null },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 404,
      description: "Notification info not found",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: { type: "string", example: "Notification info not found" },
          data: { type: "null", example: null },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: { type: "string", example: "Failed to retrieve notification info" },
          data: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
