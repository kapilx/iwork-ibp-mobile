import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

export function getDataSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get service registry data",
      description: "Retrieves basic information about the service registry.",
    }),
    ApiResponse({
      status: 200,
      description: "Service registry data retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Hello API" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function registerServiceSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Register a new service",
      description: "Registers a new microservice with the service registry.",
    }),
    ApiBody({
      description: "Service registration payload.",
      schema: {
        type: "object",
        required: ["name", "url", "port", "healthCheck"],
        properties: {
          name: { type: "string", example: "auth-service" },
          url: { type: "string", example: "http://localhost" },
          port: { type: "number", example: 3000 },
          healthCheck: { type: "string", example: "/health" },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Service registered successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Service registered successfully" },
          data: {
            type: "object",
            properties: {
              name: { type: "string", example: "auth-service" },
              url: { type: "string", example: "http://localhost" },
              port: { type: "number", example: 3000 },
              healthCheck: { type: "string", example: "/health" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - Invalid service information.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getAllServicesSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve all registered services",
      description: "Fetches a list of all services registered in the service registry.",
    }),
    ApiResponse({
      status: 200,
      description: "Services retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Services retrieved successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", example: "auth-service" },
                url: { type: "string", example: "http://localhost" },
                port: { type: "number", example: 3000 },
                healthCheck: { type: "string", example: "/health" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function getServiceSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a service by name",
      description: "Fetches details of a specific registered service by its name.",
    }),
    ApiParam({
      name: "name",
      required: true,
      description: "The name of the service to retrieve.",
      example: "auth-service",
    }),
    ApiResponse({
      status: 200,
      description: "Service retrieved successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Service retrieved successfully" },
          data: {
            type: "object",
            properties: {
              name: { type: "string", example: "auth-service" },
              url: { type: "string", example: "http://localhost" },
              port: { type: "number", example: 3000 },
              healthCheck: { type: "string", example: "/health" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Service not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}

export function unregisterServiceSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Unregister a service",
      description: "Removes a service from the service registry by its name.",
    }),
    ApiParam({
      name: "name",
      required: true,
      description: "The name of the service to unregister.",
      example: "auth-service",
    }),
    ApiResponse({
      status: 200,
      description: "Service unregistered successfully.",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Service unregistered successfully" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Service not found.",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
}
