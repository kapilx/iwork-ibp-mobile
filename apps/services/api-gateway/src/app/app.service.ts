import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ENV } from '../../../service-lib/src/lib/environment';
import { createLogger } from '../../../service-lib/src/lib/logger';
import { buildLogMessage } from '../../../service-lib/src/lib/utils/logger.util';
import { TraceIdService } from '../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../service-lib/src/lib/constants';

interface ServiceInfo {
  name: string;
  url: string;
  port: number;
  healthCheck: string;
  lastHeartbeat?: Date;
  status?: string;
}

@Injectable()
export class AppService {
  private services: ServiceInfo[] = [];
  private readonly registryUrl = `${ENV.URL_SERVICE_REGISTRY}/service-registry/registry`;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly httpService: HttpService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.API_GATEWAY);
  }

  getData(): { message: string } {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getData',
        messageData: 'method invoked',
      }),
    });

    const response = { message: 'API Gate way running successfully..' };

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getData',
        payload: {},
        messageData: 'API info returned',
      }),
    });

    return response;
  }
  /* 
    Commented out the onModuleInit method to avoid loading services at startup 
    Using serive-registry to find the services
    Date: 2025-05-21 5:00 PM 
  */ 
  
  // async onModuleInit() {
  //   await this.loadServices();
  //   console.log("Services loaded:", this.services);
  //   // Refresh services every 30 seconds
  //   setInterval(() => this.loadServices(), 30000);
  // }

  // private async loadServices() {
  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService.get<ServiceInfo[]>(`${this.registryUrl}/services`)
  //     );
  //     this.services = response.data;
  //   } catch (error) {
  //     console.error("Failed to load services from registry:", error);
  //   }
  // }

  async getServiceUrl(serviceName: string) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getServiceUrl',
        payload: { serviceName },
        messageData: 'method invoked',
      }),
    });

    const response = await firstValueFrom(
      this.httpService.get<ServiceInfo>(`${this.registryUrl}/service/${serviceName}`),
    );
    const service = response.data;
    if (!service) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AppService',
          method: 'getServiceUrl',
          payload: { serviceName },
          messageData: `Service ${serviceName} not found`,
        }),
      });
      throw new Error(`Service ${serviceName} not found`);
    } else if (service.status !== 'active') {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AppService',
          method: 'getServiceUrl',
          payload: { serviceName },
          messageData: `Service ${serviceName} is down`,
        }),
      });
      throw new Error(`Service ${serviceName} is down`);
    }

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getServiceUrl',
        payload: { serviceName },
        messageData: 'Service URL fetched',
      }),
    });

    return service.url;
  }

  async registerService(serviceData: any) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'registerService',
        payload: serviceData,
        messageData: 'method invoked',
      }),
    });

    try {
      this.services = [...this.services, serviceData];
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AppService',
          method: 'registerService',
          payload: serviceData,
          messageData: 'Service registered successfully',
        }),
      });
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AppService',
          method: 'registerService',
          payload: serviceData,
          messageData: error.message || 'Service unavailable',
        }),
      });
      throw new HttpException(
        error.message || 'Service unavailable',
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
