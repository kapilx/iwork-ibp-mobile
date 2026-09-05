import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AdminReport,
  AdminReportParameter,
  Policy,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  User,
} from "../../../../service-lib/src/lib/entities";
import { HrController } from "./hr.controller";
import { HrRepository } from "./hr.repository";
import { HrService } from "./hr.service";
import { ExternalHrPolicyMap } from "../../../../service-lib/src/lib/entities/external-hr-policy-map.entity";
import { ExternalHrLocationMap } from "../../../../service-lib/src/lib/entities/external-hr-location-map.entity";
import { TpaClaimData } from "../../../../service-lib/src/lib/entities/tpa-claim-data.entity";

@Module({
  imports: [TypeOrmModule.forFeature([
    AdminReport, AdminReportParameter,
    ExternalHrPolicyMap, ExternalHrLocationMap,
    User, TpaClaimData,
    Policy, PolicyClaim, PolicyClaimSettlement, PolicyEnrollmentEmployee, PolicyEnrollmentEmployeePolicyMap,
  ])],
  controllers: [HrController],
  providers: [HrService, HrRepository],
  exports: [HrService, HrRepository],
})
export class HrModule {}
