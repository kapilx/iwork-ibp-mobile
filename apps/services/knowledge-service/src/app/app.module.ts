import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../../../service-lib/src/lib/database/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ServiceRegistrationService } from '../../../service-lib/src/lib/service-communication';
import { ENV } from '../../../service-lib/src/lib/environment';
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), KnowledgeModule, InsuranceWellnessHubServiceLibModule],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "knowledge-service",
      url: `${ENV.URL_KNOWLEDGE_SERVICE}`,
      port: ENV.PORT_KNOWLEDGE_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
