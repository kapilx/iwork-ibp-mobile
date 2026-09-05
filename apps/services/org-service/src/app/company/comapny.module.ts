import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FieldEncryptionModule } from "../../../../service-lib/src/lib/field-encryption/field-encryption.module";
import { FieldEncryptionSubscriber } from "../../../../service-lib/src/lib/field-encryption/subscribers/field-encryption.subscriber";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import { AddressModule } from "../address/address.module";
import { ContactModule } from "../contact/contact.module";
import { CompanyDetail } from "../../../../service-lib/src/lib/entities/company-detail.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { CompanyPolicyConfigurationLocation } from "../../../../service-lib/src/lib/entities/company-policy-configuration-location.entity";
import {
  Company,
  CompanyContactMap,
  PolicyClaim,
  GroupCompanyMap,
} from "../../../../service-lib/src/lib/entities";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { LookUpRepository } from "../look-up/look-up.repository";
import { CompanyService } from "./comapny.service";
import { CompanyController } from "./company.controller";
import { CompanyRepository } from "./company.repository";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { EmployeeModule } from "../employee/employee.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyDetail,
      StateGstDetail,
      CompanyPolicyConfigurationLocation,
      Policy,
      PolicyClaim,
      LookUp,
      Opportunity,
      CompanyContactMap,
      GroupCompanyMap,
    ]),
    JwtModule,
    AddressModule,
    ContactModule,
    EmployeeModule,
    InsuranceWellnessHubServiceLibModule,
    FieldEncryptionModule,
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    AuthGuard,
    RolesGuard,
    EntityService,
    LookUpRepository,
    LookUpValidationService,
    MasterValidationService,
    ScopeService,
    NotificationUtils,
    FieldEncryptionSubscriber,
  ],
  exports: [CompanyService, CompanyRepository],
})
export class CompanyModule {}
