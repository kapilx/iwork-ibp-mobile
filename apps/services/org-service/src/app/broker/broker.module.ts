import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { BrokerController } from "./broker.controller";
import { BrokerService } from "./broker.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Broker } from "../../../../service-lib/src/lib/entities/broker.entity";
import { BrokerAddress } from "../../../../service-lib/src/lib/entities/broker-address.entity";
import { AddressModule } from "../address/address.module";
import { ContactModule } from "../contact/contact.module";
import { LookUpModule } from "../look-up/look-up.module";
import { JwtModule } from "@nestjs/jwt";
import { LookUpRepository } from "../look-up/look-up.repository";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import { BrokerRepository } from "./broker.repository";
import { BrokerContact } from "../../../../service-lib/src/lib/entities/broker-contact.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { CompanyModule } from "../company/comapny.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Broker, BrokerAddress, BrokerContact, LookUp]),
    AddressModule,
    CompanyModule,
    ContactModule,
    LookUpModule,
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [BrokerController],
  providers: [
    BrokerService,
    BrokerRepository,
    EntityService,
    AuthGuard,
    LookUpRepository,
    RolesGuard,
    LookUpValidationService,
    MasterValidationService,
    ScopeService,
  ],
})
export class BrokerModule {}
