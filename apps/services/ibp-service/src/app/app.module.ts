import { HttpModule } from "@nestjs/axios";
import { Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthProtectionInterceptor, AuthProtectionModule } from "../../../service-lib/src/lib/auth-protection";
import { ENV } from "../../../service-lib/src/lib/environment";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CompanyEmployeeModule } from "./company-employee/company-employee.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { HrModule } from "./hr-module/hr.module";
import { ZohoIntegrationModule } from "./zoho-integration/zoho-integration.module";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      global: true,
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: ENV.JWT_EXPIRATION },
    }),
    InsuranceWellnessHubServiceLibModule,
    AuthProtectionModule,
    CompanyEmployeeModule,
    OnboardingModule,
    HrModule,
    ZohoIntegrationModule
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    ServiceRegistrationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthProtectionInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "ibp-service",
      url: `${ENV.URL_IBP_SERVICE}`,
      port: ENV.PORT_IBP_SERVICE,
      healthCheck: "/api/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
