import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class ServiceRegistrationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private readonly httpService: HttpService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  async onModuleInit() {
    await this.registerService();
  }

  async onModuleDestroy() {
    await this.unregisterService();
  }

  private async registerService() {
    const serviceInfo = {
      name: "scheduler-service",
      url: `${ENV.URL_SCHEDULER_SERVICE}`,
      port: ENV.PORT_SCHEDULER_SERVICE,
      healthCheck: "/health",
    };

    try {
      await this.httpService
        .post(
          `${ENV.URL_SERVICE_REGISTRY}/service-registry/registry/register`,
          serviceInfo
        )
        .toPromise();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ServiceRegistrationService",
          method: "registerService",
          messageData: `Policy Service registered: ${serviceInfo}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceRegistrationService",
          method: "registerService",
          messageData: `Failed to register service: ${error}`,
        }),
      });
    }
  }

  private async unregisterService() {
    try {
      await this.httpService
        .delete(
          `${ENV.URL_SERVICE_REGISTRY}/service-registry/registry/unregister/auth-service`
        )
        .toPromise();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ServiceRegistrationService",
          method: "unregisterService",
          messageData: `Policy Service unregistered successfully`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceRegistrationService",
          method: "unregisterService",
          messageData: `Failed to unregister service: ${error}`,
        }),
      });
    }
  }
}
