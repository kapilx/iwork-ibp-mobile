import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard"; // Import AuthGuard here
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard"; // Import RolesGuard here
import { LookUpModule } from "../../../../org-service/src/app/look-up/look-up.module";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import {
  BrokerContact,
  Company,
  CompanyContactMap,
  Contact,
  Employee,
  FileUpload,
  InsureContact,
  LookUp,
  Meeting,
  MeetingChallengesMap,
  MeetingDocumentMap,
  MeetingNextStepsMap,
  MeetingOutcomesMap,
  MeetingParticipantMap,
  Opportunity,
  OpportunityActivityMap,
  TpaContact,
  User,
} from "../../../../service-lib/src/lib/entities";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { MeetingController } from "./meeting.controller";
import { MeetingRepository } from "./meeting.repository";
import { MeetingService } from "./meeting.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      MeetingParticipantMap,
      LookUp,
      OpportunityActivityMap,
      Company,
      Contact,
      CompanyContactMap,
      TpaContact,
      InsureContact,
      BrokerContact,
      Employee,
      Opportunity,
      MeetingDocumentMap,
      MeetingOutcomesMap,
      MeetingChallengesMap,
      MeetingNextStepsMap,
      FileUpload,
      User,
    ]),
    JwtModule,
    LookUpModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  providers: [
    MeetingService,
    MeetingRepository,
    AuthGuard,
    RolesGuard,
    EntityService,
    LookUpService,
    LookUpValidationService,
    MasterValidationService,
    ScopeService,
  ],
  controllers: [MeetingController],
  exports: [MeetingService, MeetingRepository],
})
export class MeetingModule {}
