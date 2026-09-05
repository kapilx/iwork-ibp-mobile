import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TpaModule } from "../../../org-service/src/app/tpa/tpa.module";
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { ENV } from "../../../service-lib/src/lib/environment";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { User, UserRole } from "../../../service-lib/src/lib/entities"; // Add entities for AuthVersionService
import { AddressModule } from "./address/address.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BrokerModule } from "./broker/broker.module";
import { CompanyModule } from "./company/comapny.module";
import { ContactModule } from "./contact/contact.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmployeeModule } from "./employee/employee.module";
import { FileUploadModule } from "./file-upload/file-upload.module";
import { InsurerModule } from "./insurer/insurer.module";
import { RewardModule } from "./reward/reward.module";
import { LocalizationModule } from "./localization/localization.module";
import { LookUpModule } from "./look-up/look-up.module";
import { MasterModule } from "./master/master.module";
import { FilePasswordConfigModule } from "./file-password-config/file-password-config.module";
import { FilePasswordConfig } from "./file-password-config/file-password-config.entity";

// Extend typeOrmConfig to include org-service specific entities
const orgServiceTypeOrmConfig = {
  ...typeOrmConfig,
  entities: [...(typeOrmConfig.entities || []), FilePasswordConfig],
};

@Module({
  imports: [
    TypeOrmModule.forRoot(orgServiceTypeOrmConfig),
    TypeOrmModule.forFeature([User, UserRole]), // Add entities for AuthVersionService
    ContactModule,
    AddressModule,
    TpaModule,
    InsurerModule,
    RewardModule,
    EmployeeModule,
    CompanyModule,
    MasterModule,
    LookUpModule,
    FileUploadModule,
    BrokerModule,
    DashboardModule,
    InsuranceWellnessHubServiceLibModule,
    LocalizationModule,
    FilePasswordConfigModule,
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
      name: "org-service",
      url: `${ENV.URL_ORG_SERVICE}`,
      port: ENV.PORT_ORG_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
