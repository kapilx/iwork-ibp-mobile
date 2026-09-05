import { NestFactory } from "@nestjs/core";
import { setupSwagger } from "./swagger";
import { ValidationPipe } from "@nestjs/common";
import { createLogger } from "./logger"; // <-- added
import { buildLogMessage } from "./utils/logger.util"; // <-- added
import { TraceIdService } from "./trace-id.service";
import type { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "express"; // Import express body parsers
import { TimeoutInterceptor } from "./interceptors/timeout.interceptor";

export class CommonBootstrap {
  async bootstrap(
    portNumber: number,
    moduleObject: any,
    moduleName: string,
    gatewayUrl: string,
    serviceName: string,
  ) {
    const app = await NestFactory.create(moduleObject);
    const traceIdService = app.get(TraceIdService);
    const logger = createLogger(traceIdService, serviceName); // <-- added
    app.useLogger(logger); // <-- added

    // Trace + request logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      const incoming = req.header("X-Trace-Id");
      const start = Date.now();
      traceIdService.runWithId(
        () => {
          logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: traceIdService.traceId,
              status: "success",
              location: "CommonBootstrap",
              method: "incomingRequest",
              payload: {
                service: serviceName,
                module: moduleName,
                method: req.method,
                url: req.originalUrl,
              },
              messageData: "request received",
            }),
          });

          res.on("finish", () => {
            logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: traceIdService.traceId,
                status: res.statusCode < 400 ? "success" : "failure",
                location: "CommonBootstrap",
                method: "requestCompleted",
                payload: {
                  service: serviceName,
                  module: moduleName,
                  method: req.method,
                  url: req.originalUrl,
                  statusCode: res.statusCode,
                  durationMs: Date.now() - start,
                },
                messageData: "request completed",
              }),
            });
          });
          next();
        },
        incoming, // reuse incoming trace id if provided
      );
    });

    app.use(json({ limit: "20mb" }));
    app.use(urlencoded({ extended: true, limit: "20mb" }));
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    const port = portNumber;
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
      : null;
    app.enableCors({
      // No allowlist configured (local dev): reflect the request origin so
      // credentialed cross-subdomain requests (e.g. <tenant>.localhost:4201)
      // work. When ALLOWED_ORIGINS is set, an origin matches if it equals an
      // entry exactly OR matches a wildcard entry where "*" stands in for the
      // tenant subdomain label, e.g. "http://*.localhost:4201" or
      // "https://*.example.com". `*` cannot be combined with credentials, so
      // explicit reflection/matching is required.
      origin: allowedOrigins
        ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
            if (!origin) return cb(null, true); // non-browser / same-origin requests
            const isAllowed = allowedOrigins.some((entry) => {
              if (entry === origin) return true;
              const star = entry.indexOf("*");
              if (star === -1) return false;
              // Split "http://*.localhost:4201" into prefix "http://" and
              // suffix ".localhost:4201"; the wildcard fills the middle.
              const prefix = entry.slice(0, star);
              const suffix = entry.slice(star + 1);
              return (
                origin.startsWith(prefix) &&
                origin.endsWith(suffix) &&
                origin.length >= prefix.length + suffix.length
              );
            });
            cb(null, isAllowed);
          }
        : true,
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Apply global timeout interceptor
    const requestTimeout = process.env.REQUEST_TIMEOUT_MS
      ? Number.parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
      : 10000; // Default 10 seconds
    app.useGlobalInterceptors(new TimeoutInterceptor(requestTimeout));

    app.getHttpServer().setTimeout(7 * 60 * 1000); // 7 minutes
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: "CommonBootstrap",
        method: "bootstrap",
        payload: { service: serviceName, module: moduleName, port },
        messageData: "service starting",
      }),
    });
    setupSwagger(app, `${moduleName}`, serviceName, gatewayUrl);
    await app.listen(port);
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: "CommonBootstrap",
        method: "bootstrap",
        payload: { service: serviceName, module: moduleName, port },
        messageData: "service listening",
      }),
    });
  }
}
