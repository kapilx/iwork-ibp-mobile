import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { ENV } from "../../../service-lib/src/lib/environment";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { PolicyModule } from "./policy/policy.module";
import { ClaimModule } from "./claim/claim.module";
import { NonGroupClaimModule } from "./non-group-claim/non-group-claim.module";
import { ServiceTatModule } from "./service-tat/service-tat.module";
import { TraceIdService } from "../../../service-lib/src/lib/trace-id.service"; // Importing TraceIdService from service-lib
import { PortalConfigurationModule } from "./portal-configuration/portal-configuration.module";
import { TpaExternalFeatureModule } from "./tpa-external-feature/tpa-external-feature.module";
import { TpaSsoConfigModule } from "./tpa-sso-config/tpa-sso-config.module";
@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    InsuranceWellnessHubServiceLibModule,
    PolicyModule,
    ClaimModule,
    NonGroupClaimModule,
    ServiceTatModule,
    PortalConfigurationModule,
    TpaExternalFeatureModule,
    TpaSsoConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService, TraceIdService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "policy-service",
      url: `${ENV.URL_POLICY_SERVICE}`,
      port: ENV.PORT_POLICY_SERVICE,
      healthCheck: "/api/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
