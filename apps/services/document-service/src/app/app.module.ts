import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from ".././../../service-lib/src/lib/database/typeorm.config";
import { ENV } from "../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../service-lib/src/lib/trace-id.service"; // Importing TraceIdService from service-lib
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { ExcelModule } from "./excel/excel.module";
import { PdfModule } from "./pdf/pdf.module";
import { BulkEditModule } from "./bulk-edit/bulk-edit.module";
import { PoppinsModule } from "./poppins/poppins.module";
import { ExternalAppModule } from "./external-app/external-app.module";
import { EntityFieldsModule } from "./entity-fields/entity-fields.module";
import { MappingTemplateModule } from "./mapping-template/mapping-template.module";
import { JwtModule } from "@nestjs/jwt";
import { PasswordProtectionConfigModule } from "./password-protection-config/password-protection-config.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    InsuranceWellnessHubServiceLibModule,
    ExcelModule,
    PdfModule,
    BulkEditModule,
    PoppinsModule,
    ExternalAppModule,
    EntityFieldsModule,
    MappingTemplateModule,
    PasswordProtectionConfigModule,
    JwtModule
  ],
  controllers: [AppController],
  providers: [AppService, TraceIdService, ServiceRegistrationService],
  exports: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "document-service",
      url: `${ENV.URL_DOCUMENT_SERVICE}`,
      port: ENV.PORT_DOCUMENT_SERVICE,
      healthCheck: "/api/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
