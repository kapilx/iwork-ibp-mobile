import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import {
  FileUpload,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEmployeeEnrollment,
  Policy,
  DocumentProcessingFile,
  User,
  MstrServicePolicyTemplateField,
  PolicyTpaMap,
} from "../../../../service-lib/src/lib/entities";
import { MappingTemplateVersion } from "../../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { ClaimController } from "./claim.controller";
import { ClaimService } from "./claim.service";
import { ClaimRepository } from "./claim.repository";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyClaim,
      PolicyClaimSettlement,
      FileUpload,
      PolicyEnrollmentEmployeePolicyMap,
      PolicyEnrollmentDependent,
      PolicyEmployeeEnrollment,
      PolicyEnrollmentEmployee,
      Policy,
      DocumentProcessingFile,
      User,
      MappingTemplateVersion,
      MstrServicePolicyTemplateField,
      PolicyTpaMap,
    ]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [ClaimController],
  providers: [
    ClaimService,
    ClaimRepository,
    EntityService,
    TraceIdService,
    ScopeService,
  ],
  exports: [ClaimService],
})
export class ClaimModule {}
