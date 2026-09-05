import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ServiceTatAggregationService } from "../services/service-tat-aggregation.service";
import {
  SERVICE_TAT_CRON_EXPRESSION,
  SERVICE_TAT_LOG_CONTEXT,
} from "../constants/service-tat.constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { SCHEDULER_HANDLERS } from "../../../../../../libs/service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";
import { IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";

@Injectable()
export class ServiceTatScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly aggregationService: ServiceTatAggregationService,
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  async onModuleInit() {
    this.logger.log("Initializing ServiceTatScheduler...");
    const SERVICE_TAT_KEYS = ["SERVICE_TAT_AGGREGATION"];

    const handlers = new Map<string, () => Promise<void>>();

    for (const key of SERVICE_TAT_KEYS) {
      const methodName = SCHEDULER_HANDLERS[key];
      if (!methodName) {
        this.logger.warn(`No handler mapping found for key: ${key}`);
        continue;
      }
      const method = this[methodName as keyof ServiceTatScheduler];

      if (typeof method === "function") {
        handlers.set(key, (method as () => Promise<void>).bind(this));
        this.logger.log(`Registered handler: ${key} -> ${methodName}`);
      }
    }

    this.dynamicCronService.registerHandlers(handlers);
    this.logger.log("ServiceTatScheduler handler registered");
  }

  @Cron(SERVICE_TAT_CRON_EXPRESSION)
  async handleDailyAggregation(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "started",
        location: SERVICE_TAT_LOG_CONTEXT.SCHEDULER,
        method: "handleDailyAggregation",
        messageData: "Triggered nightly service TAT aggregation",
      }),
    });
    try {
      console.log("Service TAT aggregation started...");
      await this.aggregationService.aggregateDailyTat();
      
      this.logger.log({
        level: "log",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: SERVICE_TAT_LOG_CONTEXT.SCHEDULER,
          method: "handleDailyAggregation",
          messageData: "Service TAT aggregation completed successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: SERVICE_TAT_LOG_CONTEXT.SCHEDULER,
          method: "handleDailyAggregation",
          messageData: `Service TAT aggregation failed: ${
            error instanceof Error ? error.message : error
          }`,
        }),
      });
    }
  }
}
