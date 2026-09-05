import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ENV } from '../../../../service-lib/src/lib/environment';


@Injectable()
export class ServiceRegistrationService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    await this.registerService();
  }

  async onModuleDestroy() {
    await this.unregisterService();
  }

  private async registerService() {
    const serviceInfo = {
      name: 'policy-service',
      url: `http://localhost:${ENV.PORT_POLICY_SERVICE}`,
      port: ENV.PORT_POLICY_SERVICE,
      healthCheck: '/api/health'
    };

    try {
      await this.httpService.post(
        `http://localhost:${ENV.PORT_SERVICE_REGISTRY}/service-registry/registry/register`,
        serviceInfo
      ).toPromise();
      console.log('Policy Service registered:', serviceInfo);
    } catch (error) {
      console.error('Failed to register service:', error);
    }
  }

  private async unregisterService() {
    try {
      await this.httpService.delete(
        `http://localhost:${ENV.PORT_SERVICE_REGISTRY}/service-registry/registry/unregister/auth-service`
      ).toPromise();
    } catch (error) {
      console.error('Failed to unregister service:', error);
    }
  }
}