import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyZohoIntegration } from "../../../../service-lib/src/lib/entities/company-zoho-integration.entity";
import { FieldEncryptionModule } from "../../../../service-lib/src/lib/field-encryption";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { ZohoIntegrationController } from "./zoho-integration.controller";
import { ZohoIntegrationService } from "./zoho-integration.service";
import { ZohoIntegrationRepository } from "./zoho-integration.repository";
import { ZohoPeopleApiService } from "./zoho-people-api.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyZohoIntegration]),
    FieldEncryptionModule,
  ],
  controllers: [ZohoIntegrationController],
  providers: [
    ZohoIntegrationService,
    ZohoIntegrationRepository,
    ZohoPeopleApiService,
    TraceIdService,
  ],
  exports: [ZohoIntegrationService],
})
export class ZohoIntegrationModule {}
