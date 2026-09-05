import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { ENV } from "../../../service-lib/src/lib/environment";
import { TypeOrmConfigModule } from "../../../service-lib/src/lib/database/typeorm.module";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { HclIntegrationModule } from "./hcl-integration/hcl-integration.module";

// Home for inbound integrations initiated by external systems (a TPA/client
// HR system pushing data to us, as opposed to the outbound-only generic TPA
// framework in docs/specs/tpa-external-integration-spec.md). HCL's employee
// interface is the first tenant; when another such integration comes along
// it gets its own module here (e.g. src/app/<partner>-integration/), not a
// new service — see docs/HCL-Employee-Interface-Sync/ for the design this
// module implements.
@Module({
  imports: [
    TypeOrmConfigModule,
    InsuranceWellnessHubServiceLibModule,
    HclIntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly serviceRegistrationService: ServiceRegistrationService) {}

  async onModuleInit() {
    const serviceInfo = {
      name: "external-integration-service",
      url: `${ENV.URL_EXTERNAL_INTEGRATION_SERVICE}`,
      port: ENV.PORT_EXTERNAL_INTEGRATION_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
