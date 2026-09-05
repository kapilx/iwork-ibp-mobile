import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

// Reusable helper for authenticated file upload endpoints
export function ProxyFileUploadSwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Upload file to downstream service',
      description:
        'JWT authentication + ACL authorization required. Proxies multipart file upload to the target microservice via streaming passthrough. Request body is streamed directly without buffering.',
    }),
    ApiParam({
      name: 'serviceData',
      required: true,
      type: String,
      description: 'Target microservice name to proxy the upload request to',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'File uploaded successfully - response from downstream service',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'File uploaded successfully' },
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Reusable helper for authenticated file download endpoints
export function ProxyFileDownloadSwagger(paramName = 'documentId') {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Download file from downstream service',
      description:
        'JWT authentication + ACL authorization required. Proxies file download request to the target microservice via streaming response. File is streamed directly to the client without buffering.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name to proxy the download request to',
    }),
    ApiParam({
      name: paramName,
      required: true,
      type: String,
      description: 'Document identifier for the file to download',
    }),
    ApiProduces(
      'application/octet-stream',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ),
    ApiResponse({
      status: 200,
      description: 'File stream response from downstream service',
      content: {
        'application/octet-stream': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 404,
      description: 'File not found',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Swagger for getData endpoint
export function GetDataSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get API Gateway status',
      description: 'Returns basic status information from the API Gateway service.',
    }),
    ApiResponse({
      status: 200,
      description: 'Success response',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Hello API' },
        },
      },
    })
  );
}

// Swagger for registerService endpoint
export function RegisterServiceSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register microservice with service registry',
      description:
        'Registers a microservice instance with the service registry for discovery and load balancing. Service data is forwarded to the service registry.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Service registered successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Service registered' },
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Service registry unavailable',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          message: { type: 'string' },
        },
      },
    })
  );
}

// Swagger for swaggerDocs proxy endpoint
export function SwaggerDocsProxySwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Proxy Swagger documentation from downstream service',
      description:
        'Proxies Swagger UI and OpenAPI specification from the target microservice. Modifies CSS references to work through the API Gateway. Uses Basic authentication to access downstream Swagger endpoints.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name to fetch Swagger documentation from',
    }),
    ApiResponse({
      status: 200,
      description: 'Swagger HTML or JSON response from downstream service',
      content: {
        'text/html': {
          schema: { type: 'string' },
        },
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
        },
      },
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service unavailable',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          message: { type: 'string' },
        },
      },
    })
  );
}

// Swagger for FAQ template download
export function DownloadFaqTemplateSwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Download FAQ template file for policy',
      description:
        'JWT authentication + ACL authorization required. Proxies FAQ template download request to the portal configuration service. Returns an Excel template file as a stream.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name (portal-configuration service)',
    }),
    ApiParam({
      name: 'policyId',
      required: true,
      type: Number,
      description: 'Policy identifier for the FAQ template',
    }),
    ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ),
    ApiResponse({
      status: 200,
      description: 'FAQ template file stream from downstream service',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 404,
      description: 'Template not found',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Swagger for FAQ export
export function ExportFaqsSwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Export FAQs for policy',
      description:
        'JWT authentication + ACL authorization required. Proxies FAQ export request to the portal configuration service. Returns an Excel file containing all FAQs for the specified policy as a stream.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name (portal-configuration service)',
    }),
    ApiParam({
      name: 'policyId',
      required: true,
      type: Number,
      description: 'Policy identifier for FAQ export',
    }),
    ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ),
    ApiResponse({
      status: 200,
      description: 'FAQ export file stream from downstream service',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 404,
      description: 'FAQs not found',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Swagger for hospital export
export function ProxyHospitalExportSwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Export hospital list for policy',
      description:
        'JWT authentication + ACL authorization required. Proxies hospital export request to the portal configuration service. Returns an Excel file containing hospital network data for the specified policy as a stream.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name (portal-configuration service)',
    }),
    ApiParam({
      name: 'policyId',
      required: true,
      type: String,
      description: 'Policy identifier for hospital export',
    }),
    ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ),
    ApiResponse({
      status: 200,
      description: 'Hospital export file stream from downstream service',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 404,
      description: 'Hospitals not found',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Swagger for hospital template
export function ProxyHospitalTemplateSwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Download hospital template file',
      description:
        'JWT authentication + ACL authorization required. Proxies hospital template download request to the portal configuration service. Returns an Excel template file for hospital data upload as a stream.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name (portal-configuration service)',
    }),
    ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ),
    ApiResponse({
      status: 200,
      description: 'Hospital template file stream from downstream service',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
    })
  );
}

// Swagger for generic proxy endpoint
export function GenericProxySwagger() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Generic proxy to downstream service',
      description:
        'JWT authentication + ACL authorization required. Proxies any HTTP request to the target microservice. Request body and headers are forwarded. Returns JSON response from the downstream service.',
    }),
    ApiParam({
      name: 'service',
      required: true,
      type: String,
      description: 'Target microservice name to proxy the request to',
    }),
    ApiBody({
      required: false,
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Success response from downstream service',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Success' },
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 502,
      description: 'Bad Gateway / Downstream service error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          message: { type: 'string' },
        },
      },
    })
  );
}
