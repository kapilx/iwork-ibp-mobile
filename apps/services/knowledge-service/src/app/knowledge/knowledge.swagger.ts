import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateKnowledgeFileDto } from "./dto/create-knowledge-file.dto";
import { CreateKnowledgeUrlDto } from "./dto/create-knowledge-url.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";

export const uploadFileSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiConsumes("multipart/form-data"),
    ApiOperation({
      summary: "Upload knowledge document file",
      description:
        "Upload a file (PDF, DOC, DOCX, etc.) to the knowledge base with metadata including title, document type, category, summary, and tags. The file is stored securely and indexed for search.",
    }),
    ApiBody({
      description: "File upload with metadata",
      schema: {
        type: "object",
        required: ["file", "title", "docTypeId", "categoryId"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Document file to upload (PDF, DOC, DOCX, XLS, etc.)",
          },
          title: {
            type: "string",
            description: "Document title",
            example: "Employee Benefits Guide 2026",
          },
          docTypeId: {
            type: "integer",
            description: "Document type ID from master data",
            example: 1,
          },
          categoryId: {
            type: "integer",
            description: "Category ID from knowledge categories",
            example: 5,
          },
          summary: {
            type: "string",
            description: "Brief summary of the document content",
            example: "Comprehensive guide covering all employee benefits",
          },
          tags: {
            type: "string",
            description:
              "Comma-separated tags or array of tags for categorization",
            example: "benefits,HR,employees,2026",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "File uploaded successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 201 },
          message: {
            type: "string",
            example: "Knowledge document created successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 123 },
              title: { type: "string", example: "Employee Benefits Guide 2026" },
              fileName: { type: "string", example: "benefits-guide-2026.pdf" },
              docTypeId: { type: "integer", example: 1 },
              categoryId: { type: "integer", example: 5 },
              summary: {
                type: "string",
                example: "Comprehensive guide covering all employee benefits",
              },
              tags: { type: "array", items: { type: "string" } },
              relativePath: { type: "string", example: "/uploads/2026/01/..." },
              fileSize: { type: "integer", example: 1048576 },
              mimeType: { type: "string", example: "application/pdf" },
              createdAt: { type: "string", format: "date-time" },
              createdBy: { type: "integer", example: 1001 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid file or metadata",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const createUrlSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateKnowledgeUrlDto),
    ApiOperation({
      summary: "Create knowledge document from URL",
      description:
        "Add an external URL as a knowledge document. This allows linking to external resources, websites, or cloud documents without uploading files.",
    }),
    ApiBody({
      type: CreateKnowledgeUrlDto,
      description: "URL document metadata",
      examples: {
        example1: {
          summary: "External policy document",
          value: {
            title: "Insurance Policy Terms 2026",
            docTypeId: 2,
            categoryId: 3,
            url: "https://example.com/documents/policy-terms-2026.pdf",
            summary: "Latest insurance policy terms and conditions",
            tags: ["policy", "terms", "2026"],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "URL document created successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 201 },
          message: {
            type: "string",
            example: "Knowledge URL document created successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 124 },
              title: { type: "string", example: "Insurance Policy Terms 2026" },
              docTypeId: { type: "integer", example: 2 },
              categoryId: { type: "integer", example: 3 },
              url: {
                type: "string",
                example: "https://example.com/documents/policy-terms-2026.pdf",
              },
              summary: {
                type: "string",
                example: "Latest insurance policy terms and conditions",
              },
              tags: { type: "array", items: { type: "string" } },
              relativePath: {
                type: "string",
                example: "https://example.com/documents/policy-terms-2026.pdf",
              },
              createdAt: { type: "string", format: "date-time" },
              createdBy: { type: "integer", example: 1001 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid URL or metadata",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const replaceFileSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiConsumes("multipart/form-data"),
    ApiOperation({
      summary: "Replace existing knowledge document file",
      description:
        "Replace an existing document's file with a new version. Optionally update metadata. The old file is archived and the new file takes its place while maintaining the same document ID.",
    }),
    ApiParam({
      name: "documentId",
      description: "ID of the document to replace",
      type: "string",
      example: "123",
    }),
    ApiBody({
      description: "New file with optional metadata updates",
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "New document file to replace the existing one",
          },
          title: {
            type: "string",
            description: "Updated document title (optional)",
            example: "Employee Benefits Guide 2026 - Updated",
          },
          docTypeId: {
            type: "integer",
            description: "Updated document type ID (optional)",
            example: 1,
          },
          categoryId: {
            type: "integer",
            description: "Updated category ID (optional)",
            example: 5,
          },
          summary: {
            type: "string",
            description: "Updated summary (optional)",
            example: "Updated comprehensive guide with new benefits",
          },
          tags: {
            type: "string",
            description: "Updated tags (optional)",
            example: "benefits,HR,employees,2026,updated",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "File replaced successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge document file replaced successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 123 },
              title: {
                type: "string",
                example: "Employee Benefits Guide 2026 - Updated",
              },
              fileName: {
                type: "string",
                example: "benefits-guide-2026-v2.pdf",
              },
              docTypeId: { type: "integer", example: 1 },
              categoryId: { type: "integer", example: 5 },
              relativePath: { type: "string", example: "/uploads/2026/01/..." },
              fileSize: { type: "integer", example: 1248576 },
              mimeType: { type: "string", example: "application/pdf" },
              updatedAt: { type: "string", format: "date-time" },
              updatedBy: { type: "integer", example: 1001 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid file or document ID",
    }),
    ApiResponse({
      status: 404,
      description: "Document not found",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const replaceUrlSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateKnowledgeDto),
    ApiOperation({
      summary: "Replace URL of existing knowledge document",
      description:
        "Update the URL of an existing URL-based knowledge document. Optionally update other metadata fields like title, category, summary, and tags.",
    }),
    ApiParam({
      name: "documentId",
      description: "ID of the document to update",
      type: "string",
      example: "124",
    }),
    ApiBody({
      description: "Updated URL and optional metadata",
      schema: {
        type: "object",
        required: ["url"],
        properties: {
          documentId: {
            type: "integer",
            description: "Document ID (can be in body or path)",
            example: 124,
          },
          url: {
            type: "string",
            description: "New URL for the document",
            example: "https://example.com/documents/policy-terms-2026-v2.pdf",
          },
          title: {
            type: "string",
            description: "Updated document title (optional)",
            example: "Insurance Policy Terms 2026 - Revised",
          },
          docTypeId: {
            type: "integer",
            description: "Updated document type ID (optional)",
            example: 2,
          },
          categoryId: {
            type: "integer",
            description: "Updated category ID (optional)",
            example: 3,
          },
          summary: {
            type: "string",
            description: "Updated summary (optional)",
            example: "Revised insurance policy terms and conditions",
          },
          tags: {
            type: "string",
            description: "Updated tags (optional)",
            example: "policy,terms,2026,revised",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "URL replaced successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge document URL replaced successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 124 },
              title: {
                type: "string",
                example: "Insurance Policy Terms 2026 - Revised",
              },
              url: {
                type: "string",
                example:
                  "https://example.com/documents/policy-terms-2026-v2.pdf",
              },
              docTypeId: { type: "integer", example: 2 },
              categoryId: { type: "integer", example: 3 },
              relativePath: {
                type: "string",
                example:
                  "https://example.com/documents/policy-terms-2026-v2.pdf",
              },
              updatedAt: { type: "string", format: "date-time" },
              updatedBy: { type: "integer", example: 1001 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid URL or document ID",
    }),
    ApiResponse({
      status: 404,
      description: "Document not found",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const updateMetaSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateKnowledgeDto),

    ApiOperation({
      summary: "Update knowledge document metadata",
      description:
        "Update metadata fields of an existing knowledge document. The documentId is provided as a path parameter.",
    }),

    ApiParam({
      name: "documentId",
      description: "ID of the document to update",
      type: "number",
      example: 123,
    }),

    ApiBody({
    //   type: UpdateKnowledgeDto,
      description: "Metadata fields to update",
      example: {
        title: "Employee Benefits Guide 2026 - Final",
        docTypeId: 1,
        documentId:123,
        categoryId: 6,
        summary:
          "Comprehensive guide covering all employee benefits with Q1 updates",
        tags: ["benefits", "HR", "employees", "2026"],
      },
    }),

    ApiResponse({
      status: 200,
      description: "Metadata updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge document metadata updated successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 123 },
              title: { type: "string" },
              docTypeId: { type: "integer" },
              categoryId: { type: "integer" },
              summary: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" },
              },
              updatedAt: {
                type: "string",
                format: "date-time",
              },
              updatedBy: {
                type: "integer",
                example: 1001,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Metadata updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge document metadata updated successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 123 },
              title: {
                type: "string",
                example: "Employee Benefits Guide 2026 - Final",
              },
              docTypeId: { type: "integer", example: 1 },
              categoryId: { type: "integer", example: 6 },
              summary: {
                type: "string",
                example:
                  "Comprehensive guide covering all employee benefits with Q1 updates",
              },
              tags: { type: "array", items: { type: "string" } },
              updatedAt: { type: "string", format: "date-time" },
              updatedBy: { type: "integer", example: 1001 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid metadata or document ID",
    }),
    ApiResponse({
      status: 404,
      description: "Document not found",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const deleteDocumentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete knowledge document",
      description:
        "Soft delete a knowledge document. The document is marked as deleted but not physically removed, allowing for potential recovery. It will no longer appear in listings or search results.",
    }),
    ApiParam({
      name: "documentId",
      description: "ID of the document to delete",
      type: "string",
      example: "123",
    }),
    ApiResponse({
      status: 200,
      description: "Document deleted successfully",
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Document deleted successfully",
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const listDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "List knowledge documents with filtering",
      description:
        "Retrieve paginated list of knowledge documents. Optionally filter by category. Returns document metadata including title, type, category, tags, file info, and access statistics.",
    }),
    ApiQuery({
      name: "categoryId",
      required: false,
      type: Number,
      description: "Filter by category ID. Omit to get documents from all categories",
      example: 5,
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
      description: "Number of documents per page",
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Documents retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge documents retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              documents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 123 },
                    title: {
                      type: "string",
                      example: "Employee Benefits Guide 2026",
                    },
                    fileName: {
                      type: "string",
                      example: "benefits-guide-2026.pdf",
                      nullable: true,
                    },
                    docTypeId: { type: "integer", example: 1 },
                    docTypeName: { type: "string", example: "Policy Document" },
                    categoryId: { type: "integer", example: 5 },
                    categoryName: { type: "string", example: "HR Documents" },
                    summary: {
                      type: "string",
                      example: "Comprehensive guide covering all employee benefits",
                    },
                    tags: { type: "array", items: { type: "string" } },
                    fileSize: { type: "integer", example: 1048576, nullable: true },
                    mimeType: {
                      type: "string",
                      example: "application/pdf",
                      nullable: true,
                    },
                    url: { type: "string", nullable: true },
                    accessCount: { type: "integer", example: 45 },
                    createdAt: { type: "string", format: "date-time" },
                    createdBy: { type: "integer", example: 1001 },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  limit: { type: "integer", example: 10 },
                  total: { type: "integer", example: 145 },
                  totalPages: { type: "integer", example: 15 },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid query parameters",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const listCatalogSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "List knowledge catalog across all categories",
      description:
        "Retrieve knowledge documents grouped by categories. Returns a comprehensive catalog view with documents from all categories, useful for browsing the entire knowledge base.",
    }),
    ApiQuery({
      name: "start",
      required: false,
      type: Number,
      description: "Starting offset for pagination",
      example: 0,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of documents per category to return",
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: "Knowledge catalog retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Knowledge catalog retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    categoryId: { type: "integer", example: 5 },
                    categoryName: { type: "string", example: "HR Documents" },
                    categoryDescription: {
                      type: "string",
                      example: "Human resources policies and procedures",
                    },
                    documentCount: { type: "integer", example: 23 },
                    documents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 123 },
                          title: {
                            type: "string",
                            example: "Employee Benefits Guide 2026",
                          },
                          fileName: {
                            type: "string",
                            example: "benefits-guide-2026.pdf",
                            nullable: true,
                          },
                          docTypeId: { type: "integer", example: 1 },
                          docTypeName: {
                            type: "string",
                            example: "Policy Document",
                          },
                          summary: {
                            type: "string",
                            example:
                              "Comprehensive guide covering all employee benefits",
                          },
                          tags: { type: "array", items: { type: "string" } },
                          fileSize: {
                            type: "integer",
                            example: 1048576,
                            nullable: true,
                          },
                          mimeType: {
                            type: "string",
                            example: "application/pdf",
                            nullable: true,
                          },
                          url: { type: "string", nullable: true },
                          accessCount: { type: "integer", example: 45 },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  start: { type: "integer", example: 0 },
                  limit: { type: "integer", example: 10 },
                  totalCategories: { type: "integer", example: 8 },
                  totalDocuments: { type: "integer", example: 145 },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const downloadDocumentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download knowledge document file",
      description:
        "Download the actual file of a knowledge document. Automatically increments the access count for analytics. Streams the file directly to the browser with appropriate headers for download. Works for both S3 and local storage.",
    }),
    ApiParam({
      name: "documentId",
      description: "ID of the document to download",
      type: "string",
      example: "123",
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
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
      headers: {
        "Content-Disposition": {
          description: "Attachment header with original filename",
          schema: {
            type: "string",
            example: 'attachment; filename="benefits-guide-2026.pdf"',
          },
        },
        "Content-Type": {
          description: "MIME type of the file",
          schema: { type: "string", example: "application/pdf" },
        },
        "Content-Length": {
          description: "File size in bytes",
          schema: { type: "integer", example: 1048576 },
        },
        "Access-Control-Expose-Headers": {
          description: "Exposed headers for CORS",
          schema: { type: "string", example: "Content-Disposition" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );

export const incrementAccessSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Increment document access count",
      description:
        "Manually increment the access counter for a knowledge document. Used for tracking views or interactions when the document is accessed but not downloaded. Helps in analytics and popularity metrics.",
    }),
    ApiParam({
      name: "documentId",
      description: "ID of the document to track access for",
      type: "number",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Access count incremented successfully",
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Access count incremented successfully",
          },
        },
      },
    }),
   ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    })
  );
