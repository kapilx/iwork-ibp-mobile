import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";
import { Contact } from "../../../../service-lib/src/lib/entities/contact.entity";
import { ContactRepository } from "./contact.repository";
import { AddressRepository } from "../address/address.repository";
import { CompanyRepository } from "../company/company.repository";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { ContactAddress } from "../../../../service-lib/src/lib/entities/contact-address.entity";
import { CompanyContactMap } from "../../../../service-lib/src/lib/entities/company-contact.entity";
import { ContactDetails } from "../../../../service-lib/src/lib/entities/contact-details.entity";
import { ProfessionalExperience } from "../../../../service-lib/src/lib/entities/professional-experience.entity";
import { QualificationExperience } from "../../../../service-lib/src/lib/entities/qualification-experience.entity";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard"; // Import AuthGuard here
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard"; // Import RolesGuard here
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { LookUpRepository } from "../look-up/look-up.repository";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity";
import { JwtModule } from "@nestjs/jwt";
import { ContactDocMap } from "../../../../service-lib/src/lib/entities/contact-document-map.entity";
import { ContactCommunicationDetails } from "../../../../service-lib/src/lib/entities/contact-communication-details.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { InsureContact } from "../../../../service-lib/src/lib/entities/insurer-contact.entity";
import { InsurerAddress } from "../../../../service-lib/src/lib/entities/insurer-address.entity";
import { InsurerRepository } from "../insurer/insurer.repository";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { TpaAddress } from "../../../../service-lib/src/lib/entities/tpa-address.entity";
import { TpaContact } from "../../../../service-lib/src/lib/entities/tpa-contact.entity";
import { TpaRepository } from "../tpa/tpa.repository";
import { ChildDetails } from "../../../../service-lib/src/lib/entities/child-details.entity";
import { BrokerRepository } from "../broker/broker.repository";
import { Broker } from "../../../../service-lib/src/lib/entities/broker.entity";
import { BrokerAddress } from "../../../../service-lib/src/lib/entities/broker-address.entity";
import { BrokerContact } from "../../../../service-lib/src/lib/entities/broker-contact.entity";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import {
  Opportunity,
  Policy,
  PolicyClaim,
  GroupCompanyMap,
} from "../../../../service-lib/src/lib/entities";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { EmployeeModule } from "../employee/employee.module";

/**
 * Module for managing contacts.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contact,
      Address,
      ContactAddress, // Ensure ContactAddress is included here
      CompanyContactMap,
      ContactDetails,
      ChildDetails,
      ProfessionalExperience,
      QualificationExperience,
      CompanyAddress,
      Company,
      LookUp,
      ContactDocMap,
      ContactCommunicationDetails,
      Insurer,
      InsureContact,
      InsurerAddress,
      Tpa,
      TpaAddress,
      TpaContact,
      Broker,
      BrokerAddress,
      BrokerContact,
      Opportunity,
      Policy,
      PolicyClaim,
      GroupCompanyMap,
      StateGstDetail,
    ]),
    JwtModule,
    EmployeeModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactRepository,
    AddressRepository,
    CompanyRepository,
    EntityService,
    InsurerRepository,
    TpaRepository,
    BrokerRepository,
    LookUpRepository,
    LookUpValidationService,
    AuthGuard,
    RolesGuard,
    ScopeService,
  ],
  exports: [ContactService],
})
export class ContactModule {}
