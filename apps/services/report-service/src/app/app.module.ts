import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { ENV } from "../../../service-lib/src/lib/environment";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}

  async onModuleInit() {
    const serviceInfo = {
      name: "report-service",
      url: `${ENV.URL_REPORT_SERVICE}`,
      port: ENV.PORT_REPORT_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
