import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ENV } from './environment';
export * from './service-communication/file-password-config-client';

export class ServiceRegistrationService {
  httpService = new HttpService(); 
   async registerService(service:any) {
    const serviceInfo = {
      name: `${service.name}`,
      url: `${service.url}`,
      port: `${service.port}`,
      healthCheck: '/health',
      status: service.status,
    };
    try {
      await this.httpService.post(
        `${ENV.URL_SERVICE_REGISTRY}/service-registry/registry/register`,
        serviceInfo
      ).toPromise();
      console.log('Service registered:', serviceInfo);
    } catch (error) {
      console.error('Failed to register service:', error);
    }
  }

   async unregisterService() {
    try {
      await this.httpService.delete(
        `${ENV.URL_SERVICE_REGISTRY}/service-registry/registry/unregister/auth-service`
      ).toPromise();
    } catch (error) {
      console.error('Failed to unregister service:', error);
    }
  }


}