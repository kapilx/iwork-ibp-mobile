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
  successMessage,
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";

// Swagger metadata for POST announcement endpoint
export function createAnnouncementSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create Announcement",
      description: "Creates a new announcement for the dashboard.",
    }),
    ApiBody({
      description: "Announcement creation payload",
      schema: {
        type: "object",
        properties: {
          title: { type: "string", example: "Welcome Message" },
          content: { type: "string", example: "Welcome to the new platform!" },
          expiryDate: { type: "string", format: "date", example: "2024-12-31" },
          targetAudience: { type: "string", example: "All Users" },
        },
        required: ["title", "content"],
      },
    }),
    ApiResponse({
      status: 201,
      description: "Announcement created successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.announcementCreation },
          data: {
            type: "object",
            properties: {
              announcementId: { type: "number", example: 1 },
              title: { type: "string", example: "Welcome Message" },
              content: { type: "string", example: "Welcome to the new platform!" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 403,
      description: infoMessages.forBidden,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.announcementCreationFailed,
    })
  );
}

// Swagger metadata for PUT announcement/:id endpoint
export function updateAnnouncementSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update Announcement",
      description: "Updates an existing announcement by its ID.",
    }),
    ApiParam({
      name: "id",
      description: "Announcement ID",
      type: Number,
      example: 1,
    }),
    ApiBody({
      description: "Announcement update payload",
      schema: {
        type: "object",
        properties: {
          title: { type: "string", example: "Updated Welcome Message" },
          content: { type: "string", example: "Updated welcome content!" },
          expiryDate: { type: "string", format: "date", example: "2024-12-31" },
          targetAudience: { type: "string", example: "All Users" },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Announcement updated successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.announcementUpdated },
          data: {
            type: "object",
            properties: {
              announcementId: { type: "number", example: 1 },
              title: { type: "string", example: "Updated Welcome Message" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: infoMessages.forBidden,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.announcementNotFound,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.announcementUpdateFailed,
    })
  );
}

// Swagger metadata for GET announcements endpoint
export function getAnnouncementsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Announcements",
      description: "Retrieves a paginated list of announcements with optional search and sorting.",
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
      description: "Search term for filtering announcements",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description: "Sort criteria (e.g., expiryDate:ASC)",
      example: "expiryDate:ASC",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Field to search by",
    }),
    ApiResponse({
      status: 200,
      description: "Announcements retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.announcementList },
          data: {
            type: "object",
            properties: {
              data: { type: "array" },
              count: { type: "number", example: 15 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: infoMessages.forBidden,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.announcementListRetrievalFailed,
    })
  );
}

// Swagger metadata for GET team-celebrations endpoint
export function getTeamCelebrationsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Team Celebrations",
      description: "Retrieves a paginated list of team celebrations (birthdays, anniversaries, etc.).",
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
    ApiResponse({
      status: 200,
      description: "Team celebrations retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.celebrationsList },
          data: {
            type: "object",
            properties: {
              data: { type: "array" },
              count: { type: "number", example: 5 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: infoMessages.forBidden,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.celebrationsListRetrievalFailed,
    })
  );
}

// Swagger metadata for GET announcement/:id endpoint
export function getAnnouncementByIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Announcement by ID",
      description: "Retrieves a specific announcement by its ID.",
    }),
    ApiParam({
      name: "id",
      description: "Announcement ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Announcement retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Announcement retrieved successfully" },
          data: {
            type: "object",
            properties: {
              announcementId: { type: "number", example: 1 },
              title: { type: "string", example: "Welcome Message" },
              content: { type: "string", example: "Welcome to the new platform!" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.announcementNotFound,
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for DELETE announcement/:id endpoint
export function deleteAnnouncementSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete Announcement",
      description: "Deletes an announcement by its ID.",
    }),
    ApiParam({
      name: "id",
      description: "Announcement ID",
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Announcement deleted successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Announcement deleted successfully" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: infoMessages.forBidden,
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.announcementNotFound,
    }),
    ApiResponse({
      status: 500,
      description: "Failed to delete announcement",
    })
  );
}
