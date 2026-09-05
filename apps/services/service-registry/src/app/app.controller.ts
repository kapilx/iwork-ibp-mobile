import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { AppService } from './app.service';
import {
  getDataSwaggerMetadata,
  registerServiceSwaggerMetadata,
  getAllServicesSwaggerMetadata,
  getServiceSwaggerMetadata,
  unregisterServiceSwaggerMetadata,
} from './swagger/registry.swagger';
@Controller('registry')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @getDataSwaggerMetadata()
  getData() {
    return this.appService.getData();
  }

  @Post('register')
  @registerServiceSwaggerMetadata()
  registerService(@Body() serviceInfo: {
    name: string;
    url: string;
    port: number;
    healthCheck: string;
  }) {
    return this.appService.registerService(serviceInfo);
  }

  @Get('services')
  @getAllServicesSwaggerMetadata()
  getAllServices() {
    return this.appService.getAllServices();
  }

  @Get('service/:name')
  @getServiceSwaggerMetadata()
  getService(@Param('name') name: string) {
    return this.appService.getService(name);
  }

  @Delete('unregister/:name')
  @unregisterServiceSwaggerMetadata()
  unregisterService(@Param('name') name: string) {
    return this.appService.unregisterService(name);
  }
}
