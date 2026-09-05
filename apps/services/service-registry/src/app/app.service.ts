import { Injectable } from "@nestjs/common";
import { ENV } from "../../../service-lib/src/lib/environment";
import axios from "axios";
import { Cron } from "@nestjs/schedule";
import Redis from "ioredis";
import { TraceIdService } from "../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../service-lib/src/lib/utils/logger.util";
import { createRedisClient } from "../../../service-lib/src/lib/utils/redis.util";

interface ServiceInfo {
  name: string;
  url: string;
  port: number;
  healthCheck: string;
  lastHeartbeat: Date;
  status: string;
}
@Injectable()
export class AppService {
  private readonly redis!: Redis;
  private readonly servicesKey = "servicesInfo";
  private readonly services: ServiceInfo[] = [];
  private storageType;
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SERVICE_REGISTRY
    );
    this.storageType = ENV.STORAGE_TYPE || "local"; // Default to 'local' if not set
    if (this.storageType === "valkey") {
      this.redis = createRedisClient({
        logger: this.logger,
        traceId: this.traceIdService.traceId,
        location: "SERVICE-REGISTRY AppService",
        method: "constructor",
      })!;
    }
  }

  getData(): { message: string } {
    return { message: "Service registry running successfully.." };
  }

  private async getStoredServices(): Promise<ServiceInfo[]> {
    const data = await this.redis.get(this.servicesKey);
    return data ? (JSON.parse(data) as ServiceInfo[]) : [];
  }

  private async storeServices(services: ServiceInfo[]): Promise<void> {
    await this.redis.set(this.servicesKey, JSON.stringify(services), "EX", 86400);
  }

  async registerService(serviceInfo: ServiceInfo) {
    if (this.storageType === "valkey") {
      const services = await this.getStoredServices();
      const existingIndex = services.findIndex(
        (service) => service.name === serviceInfo.name
      );
      if (existingIndex === -1) {
        services.push(serviceInfo);
      } else {
        services[existingIndex] = {
          ...services[existingIndex],
          ...serviceInfo,
        };
      }
      await this.storeServices(services);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "registerService",
          messageData: `valkey service List ${services}`,
        }),
      });
      return {
        success: true,
        message: `Service ${serviceInfo.name} registered to valkey`,
      };
    } else {
      const serviceExists = this.services.find(
        (service) => service.name === serviceInfo.name
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "registerService",
          messageData: `${serviceInfo.name} status : ${serviceExists}`,
        }),
      });
      if (!serviceExists) {
        this.services.push(serviceInfo);
      } else {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "SERVICE-REGISTRY AppService",
            method: "registerService",
            messageData: "Service already registered, updating status",
          }),
        });
        const existingService = this.services.find(
          (service) => service.name === serviceInfo.name
        );
        if (existingService) {
          existingService.status = serviceInfo.status;
        }
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "registerService",
          messageData: `local service List: ${this.services}`,
        }),
      });
      return {
        success: true,
        message: `Service ${serviceInfo.name} registered`,
      };
    }
  }

  async getAllServices() {
    if (this.storageType === "valkey") {
      return await this.getStoredServices();
    } else {
      return Array.from(this.services);
    }
  }

  async getService(name: string) {
    if (this.storageType === "valkey") {
      const services = await this.getStoredServices();
      return services.find((service) => service.name === name);
    } else {
      return this.services.find((service) => service.name === name);
    }
  }

  async unregisterService(name: string) {
    if (this.storageType === "valkey") {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "unregisterService",
          messageData: `Unregistering service : ${name}`,
        }),
      });
      const services = await this.getStoredServices();
      const serviceIndex = services.findIndex(
        (service) => service.name === name
      );
      if (serviceIndex !== -1) {
        services.splice(serviceIndex, 1);
        await this.storeServices(services);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "unregisterService",
          messageData: `valkey service List: ${services}`,
        }),
      });
      return { success: true, message: `Service ${name} unregistered` };
    } else {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "unregisterService",
          messageData: `Unregistering service : ${name}`,
        }),
      });
      const serviceIndex = this.services.findIndex(
        (service) => service.name === name
      );
      this.services.splice(serviceIndex, 1);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "unregisterService",
          messageData: `local service List: ${this.services}`,
        }),
      });
      return { success: true, message: `Service ${name} unregistered` };
    }
  }

  //@Cron('*/20 * * * * *') // Every 20 seconds
  @Cron(
    (function () {
      const healthCheckInterval = ENV.HEALTH_CHECK_DURATION || 20; // Default to 20 seconds if not set
      return `*/${healthCheckInterval} * * * * *`;
    })()
  ) // Every 20 seconds
  //@Cron(this.healtCheckInterval) // Every 20 seconds
  async checkServicesHealth() {
    if (this.storageType === "valkey") {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "checkServicesHealth",
          messageData: `Checking services health...`,
        }),
      });
      const services = await this.getStoredServices();
      for (const service of services) {
        try {
          const res = await axios.get(service.url + service.healthCheck);
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "SERVICE-REGISTRY AppService",
              method: "checkServicesHealth",
              messageData: `Service ${service.name} Health is: ${res.status}`,
            }),
          });
          service.status = "active";
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "SERVICE-REGISTRY AppService",
              method: "checkServicesHealth",
              messageData: `Service ${service.name} is down ${err}`,
            }),
          });
          service.status = "inactive";
        }
      }
      await this.storeServices(services);
    } else {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SERVICE-REGISTRY AppService",
          method: "checkServicesHealth",
          messageData: `Checking services health...`,
        }),
      });
      for (const service of [...this.services]) {
        // Use a copy of the array to avoid mutation issues
        try {
          const res = await axios.get(service.url + service.healthCheck);
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "SERVICE-REGISTRY AppService",
              method: "checkServicesHealth",
              messageData: `Service ${service.name} Health is: ${res.status}`,
            }),
          });
          service.status = "active";
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "SERVICE-REGISTRY AppService",
              method: "checkServicesHealth",
              messageData: `Service ${service.name} is down ${err}`,
            }),
          });
          service.status = "inactive"; // Update the service status to inactive
          //this.services.splice(this.services.indexOf(service), 1); // Remove the service
        }
      }
    }
  }
}
