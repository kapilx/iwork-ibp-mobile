import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiProperty,
  ApiParam,
} from "@nestjs/swagger";

class FileUploadDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "The file to be uploaded.",
  })
  file: any;

  @ApiProperty({
    description: "The type of the company for which the file is being uploaded.",
    example: "policyFeature",
  })
  companyType: string;

  @ApiProperty({
    description: "The ID of the company for which the file is being uploaded.",
    example: 123,
    required: false,
    type: Number,
  })
  companyId?: number;

  @ApiProperty({
    description: "The type of document being uploaded.",
    example: "policy",
    required: false,
    type: Number,
  })
  documentTypeLid?: number;

  @ApiProperty({
    description: "Optional related opportunity ID.",
    example: 456,
    required: false,
    type: Number,
  })
  opportunityId?: number;

  @ApiProperty({
    description: "Optional related opportunity activity ID.",
    example: 789,
    required: false,
    type: Number,
  })
  opportunityActivityId?: number;

  @ApiProperty({
    description: "Optional related policy ID.",
    example: 321,
    required: false,
    type: Number,
  })
  policyId?: number;

  @ApiProperty({
    description: "Optional related claim ID.",
    example: 654,
    required: false,
    type: Number,
  })
  claimId?: number;

  @ApiProperty({
    description: "Optional related claim activity ID.",
    example: 987,
    required: false,
    type: Number,
  })
  claimActivityId?: number;

  @ApiProperty({
    description: "Optional related meeting ID.",
    example: 111,
    required: false,
    type: Number,
  })
  meetingId?: number;
}

class UpdateFileSizeDto {
  @ApiProperty({
    description: "Number of records to process for file size update.",
    example: 10,
    type: Number,
  })
  count: number;
}

export function uploadFileSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Upload a file",
      description:
        "Uploads a file to the server and processes it. For companyType=policyFeature, only PDF files up to 25MB are accepted.",
    }),
    ApiConsumes("multipart/form-data"),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload for uploading a file.",
      type: FileUploadDto,
    }),
    ApiResponse({
      status: 200,
      description: "File uploaded successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File uploaded successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 11 },
              fileName: { type: "string", example: "example_file.pdf" },
              fileUrl: {
                type: "string",
                example: "uploads/insurance/uploads/example_file.pdf",
              },
              fileBuffer: {
                type: "string",
                example: "Base64 encoded string of the file content",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "File is required or invalid file type. For companyType=policyFeature only PDF up to 25MB is allowed.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function replaceFileSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Replace a file",
      description: "Replaces an existing file with a new file by its ID.",
    }),
    ApiConsumes("multipart/form-data"),
    ApiQuery({
      name: "id",
      required: true,
      description: "The ID of the file to replace.",
      example: 1,
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload for replacing a file.",
      type: FileUploadDto,
    }),
    ApiResponse({
      status: 200,
      description: "File replaced successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File replaced successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              companyType: { type: "string", example: "insurance" },
              companyId: { type: "number", example: 123 },
              fileUrl: {
                type: "string",
                example: "uploads/insurance/uploads/updated_file.pdf",
              },
              fileName: { type: "string", example: "updated_file.pdf" },
              fileBuffer: {
                type: "string",
                example: "Base64 encoded string of the file content",
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "File ID or file is required.",
    }),
    ApiResponse({
      status: 404,
      description: "File not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function deleteFileSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Delete a file",
      description:
        "Deletes a file by its ID and moves it to the deleted folder.",
    }),
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "id",
      required: true,
      description: "The ID of the file to delete.",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "File deleted successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File deleted successfully" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "File ID is required.",
    }),
    ApiResponse({
      status: 404,
      description: "File not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function updateFileSizeSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update file sizes for records with null file_size",
      description:
        "Updates the file_size field for FileUpload records where file_size is null. Returns the number of records updated and a message.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Payload specifying the number of records to process.",
      type: UpdateFileSizeDto,
    }),
    ApiResponse({
      status: 200,
      description: "File sizes updated or no update needed.",
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 11 },
                fileKey: { type: "string", example: "uploads/example_file.pdf" },
                fileSize: { type: "string", example: "1.2 MB" },
              },
            },
          },
          message: {
            type: "string",
            example: "File sizes updated successfully",
          },
          effectedRecords: {
            type: "number",
            example: 2,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid request body or parameters.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

// Swagger metadata for DELETE upload/delete/:fileId endpoint
export function deleteUploadSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete Uploaded File",
      description: "Deletes a file from storage and database by its file ID.",
    }),
    ApiQuery({
      name: "fileId",
      required: true,
      type: Number,
      description: "The ID of the file to delete",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "File deleted successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File deleted successfully" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "File not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for GET :documentId/download endpoint
export function downloadFileSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download File",
      description: "Downloads a file from storage by its document ID. Returns the file as a downloadable response.",
    }),
    ApiQuery({
      name: "documentId",
      required: true,
      type: Number,
      description: "The ID of the document to download",
      example: 456,
    }),
    ApiQuery({
      name: "moduleKey",
      required: false,
      type: String,
      description:
        "Optional module key to override backend inference (e.g. company_documents, task_and_meetings).",
      example: "company_documents",
    }),
    ApiResponse({
      status: 200,
      description: "File downloaded successfully",
      content: {
        "application/octet-stream": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to download document",
    }),
    ApiResponse({
      status: 404,
      description: "Document not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

export function allFileDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get all file details with pagination",
      description: "Returns a paginated list of fileKey, createdAt, companyType, and companyId for all file uploads.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number (default: 1)",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Records per page (default: 10)",
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Paginated file details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File details retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fileKey: { type: "string", example: "uploads/insurance/example_file.pdf" },
                createdAt: { type: "string", format: "date-time", example: "2024-01-15T10:30:00.000Z" },
                entityType: { type: "string", example: "company_documents" },
                entityId: { type: "number", example: 123 },
              },
            },
          },
          count: { type: "number", example: 100 },
          totalPages: { type: "number", example: 10 },
          page: { type: "number", example: 1 },
          limit: { type: "number", example: 10 },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Invalid query parameters." }),
    ApiResponse({ status: 500, description: "Internal server error." })
  );
}

export function fileDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get file details",
      description: "Returns fileKey, createdAt, companyType, and companyId for the given document ID.",
    }),
    ApiParam({
      name: "documentId",
      required: true,
      type: Number,
      description: "The ID of the document to retrieve details for",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "File details retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "File details retrieved successfully" },
          data: {
            type: "object",
            properties: {
              fileKey: { type: "string", example: "uploads/insurance/example_file.pdf" },
              createdAt: { type: "string", format: "date-time", example: "2024-01-15T10:30:00.000Z" },
              entityType: { type: "string", example: "company_documents" },
              entityId: { type: "number", example: 123 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid document ID.",
    }),
    ApiResponse({
      status: 404,
      description: "File not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}
