import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import basicAuth from "express-basic-auth";
import { iirm } from "./constants";
import { ENV } from "./environment";

/**
 * Sets up Swagger documentation for a NestJS application.
 */
const gatewayUrlFromEnv = ENV.URL_API_GATEWAY as string;
export function setupSwagger(
  app: INestApplication,
  serviceName: string,
  moduleName: string,
  gatewayUrl: string
): void {
  // Configure Swagger document metadata
  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API`) // Title of the API documentation
    .setDescription(`API documentation for ${serviceName}`) // Description of the API
    .setVersion("1.0") // Version of the API
    .addBearerAuth(
      // ✅ This enables the Authorization header
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "access-token" // This name must match the `@ApiBearerAuth()` decorator
    )
    .addServer(`${gatewayUrl ?? gatewayUrlFromEnv}/${iirm}/${moduleName}`)
    .build();

  // Create the Swagger document
  const document = SwaggerModule.createDocument(app, config);

  app.getHttpAdapter().get("/swagger-json", (req, res) => {
    res.json(document);
  });

  // Protect Swagger UI with basic authentication
  app.use(
    "/api/docs",
    basicAuth({
      users: { admin: "password123" }, // Replace with your desired username and password
      challenge: true, // Enables the browser's built-in authentication dialog
    })
  );

  // Set up the Swagger UI at the specified endpoint
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .information-container .info .description p a {
        color: #4990e2;
        font-weight: 600;
      }
    `,
    customSiteTitle: `${serviceName} API Documentation`,
  });
}
