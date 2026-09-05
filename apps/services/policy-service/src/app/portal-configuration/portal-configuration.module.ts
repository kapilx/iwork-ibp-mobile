import { Module } from "@nestjs/common";
import { PortalConfigurationService } from "./portal-configuration.service";
import { PortalConfigurationController } from "./portal-configuration.controller";
import { PortalConfigurationRepository } from "./portal-configuration.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import {
  Policy,
  LookUp,
  User,
  AuditHistoryLog,
  AuditHistoryLogDetail,
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  HospitalFileUploadTracking,
  State,
  City,
  FileUpload,
  PolicyFaq,
  PolicyFaqUpload,
  PolicyFeatureDocument,
  PolicyContactMetric,
  Contact,
  TpaContact,
  InsureContact,
  PolicyTpaMap,
  PolicyInsurerMap,
} from "../../../../service-lib/src/lib/entities";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { PolicyModule } from "../policy/policy.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Policy,
      LookUp,
      User,
      AuditHistoryLog,
      AuditHistoryLogDetail,
      MstrHospital,
      MstrHospitalAddress,
      MstrPolicyHospitalMap,
      HospitalFileUploadTracking,
      State,
      City,
      FileUpload,
      PolicyFaq,
      PolicyFaqUpload,
      PolicyFeatureDocument,
      PolicyContactMetric,
      Contact,
      TpaContact,
      InsureContact,
      PolicyTpaMap,
      PolicyInsurerMap,
    ]),
    InsuranceWellnessHubServiceLibModule,
    JwtModule,
    PolicyModule,
  ],
  providers: [
    PortalConfigurationService,
    PortalConfigurationRepository,
    TraceIdService,
  ],
  exports: [PortalConfigurationService, PortalConfigurationRepository],
  controllers: [PortalConfigurationController],
})
export class PortalConfigurationModule {}
