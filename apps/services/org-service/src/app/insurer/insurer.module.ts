import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils"; // Import EntityService
import { LookUpValidationService } from "../../../../../services/service-lib/src/lib/utils/lookup-validation";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard"; // Import AuthGuard here
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard"; // Import RolesGuard here
import { InsurerAddress } from "../../../../service-lib/src/lib/entities/insurer-address.entity";
import { InsureContact } from "../../../../service-lib/src/lib/entities/insurer-contact.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { Endorsement } from "../../../../service-lib/src/lib/entities/endorsement.entity";
import { PolicyAssetEndorsement } from "../../../../service-lib/src/lib/entities/policy-asset-endorsement.entity";
import { PolicyInsurerMap } from "../../../../service-lib/src/lib/entities/policy-insurer-map.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { AddressModule } from "../address/address.module"; // Import AddressModule
import { ContactModule } from "../contact/contact.module"; // Import ContactModule
import { LookUpModule } from "../look-up/look-up.module";
import { LookUpRepository } from "../look-up/look-up.repository";
import { InsurerController } from "./insurer.controller";
import { InsurerRepository } from "./insurer.repository";
import { InsurerService } from "./insurer.service";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { CompanyModule } from "../company/comapny.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Insurer,
      InsurerAddress,
      InsureContact,
      LookUp,
      Policy,
      Endorsement,
      PolicyAssetEndorsement,
      PolicyInsurerMap,
      StateGstDetail,
    ]),
    AddressModule,
    CompanyModule,
    ContactModule,
    LookUpModule,
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [InsurerController],
  providers: [
    InsurerService,
    InsurerRepository,
    LookUpValidationService,
    EntityService,
    LookUpRepository,
    AuthGuard,
    RolesGuard,
    MasterValidationService,
    ScopeService,
  ],
  exports: [InsurerService, InsurerRepository],
})
export class InsurerModule {}
