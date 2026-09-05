import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigCompany } from "../../../../service-lib/src/lib/entities/config-company.entity";
import { CompanyAuthenticationMapping } from "../../../../service-lib/src/lib/entities/company-authentication-mapping.entity";
import { CompanyAuthenticationConfig } from "../../../../service-lib/src/lib/entities/company-authentication-config.entity";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";
import { CompanyPortalConfigurationDetail } from "../../../../service-lib/src/lib/entities/company-portal-configuration-detail.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Task } from "../../../../service-lib/src/lib/entities/task.entity";
import { AuditHistoryLog } from "../../../../service-lib/src/lib/entities/audit-history-log.entity";
import { AuditHistoryLogDetail } from "../../../../service-lib/src/lib/entities/audit-history-log-detail.entity";
import { AuthenticationMethod } from "../../../../service-lib/src/lib/entities/authentication-method.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { CompanyConfigController } from "./company-config.controller";
import { CompanyConfigService } from "./company-config.service";
import { CompanyConfigRepository } from "./company-config.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConfigCompany,
      CompanyAuthenticationMapping,
      CompanyAuthenticationConfig,
      CompanyPortalConfigScope,
      CompanyPortalConfigurationDetail,
      LookUp,
      Task,
      AuditHistoryLog,
      AuditHistoryLogDetail,
      AuthenticationMethod,
      Company,
      FileUpload,
    ]),
  ],
  controllers: [CompanyConfigController],
  providers: [CompanyConfigService, CompanyConfigRepository],
  exports: [CompanyConfigService],
})
export class CompanyConfigModule {}
