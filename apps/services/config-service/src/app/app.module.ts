import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { ENV } from "../../../service-lib/src/lib/environment";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { configTypeOrmConfig } from "./database/config-typeorm.config";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { CompanyConfigModule } from "./company-config/company-config.module";
import { AuthConfigModule } from "./auth-config/auth-config.module";
import { RevealModule } from "./reveal/reveal.module";


@Module({
  imports: [
    TypeOrmModule.forRoot(configTypeOrmConfig),
    HttpModule,
    JwtModule.register({
      global: true,
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: ENV.JWT_EXPIRATION },
    }),
    InsuranceWellnessHubServiceLibModule,
    CompanyConfigModule,
    AuthConfigModule,
    RevealModule,
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
      name: "config-service",
      url: `${ENV.URL_CONFIG_SERVICE}`,
      port: ENV.PORT_CONFIG_SERVICE,
      healthCheck: "/api/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
