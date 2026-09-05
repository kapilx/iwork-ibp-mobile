import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { TpaAddress } from "../../../../service-lib/src/lib/entities/tpa-address.entity";
import { TpaContact } from "../../../../service-lib/src/lib/entities/tpa-contact.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { AddressModule } from "../address/address.module";
import { ContactModule } from "../contact/contact.module";
import { TpaController } from "./tpa.controller";
import { TpaRepository } from "./tpa.repository";
import { TpaService } from "./tpa.service";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { CompanyModule } from "../company/comapny.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tpa, TpaAddress, TpaContact, LookUp]),
    AddressModule,
    CompanyModule,
    ContactModule,
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  providers: [
    TpaService,
    TpaRepository,
    EntityService,
    AuthGuard,
    RolesGuard,
    LookUpValidationService,
    MasterValidationService,
    ScopeService,
  ],
  controllers: [TpaController],
})
export class TpaModule {}
