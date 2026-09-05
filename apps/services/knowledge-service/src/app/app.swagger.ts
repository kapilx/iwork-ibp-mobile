import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

export const healthCheckSwaggerMetadata = () =>
  applyDecorators(
    ApiOperation({
      summary: "Health check endpoint",
      description:
        "Check the health status of the knowledge service. Returns service status, version, and uptime information. Used for monitoring and load balancer health checks.",
    }),
    ApiResponse({
      status: 200,
      description: "Service is healthy and operational",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "ok",
            description: "Service health status",
          },
          service: {
            type: "string",
            example: "knowledge-service",
            description: "Service name",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-01-19T10:30:00.000Z",
            description: "Current server timestamp",
          },
          uptime: {
            type: "number",
            example: 86400,
            description: "Service uptime in seconds",
          },
          version: {
            type: "string",
            example: "1.0.0",
            description: "Service version",
          },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: "Service unavailable or unhealthy",
    })
  );
