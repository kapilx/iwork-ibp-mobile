import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  OrgServiceTatSummary,
  OrgServiceWeightage,
  ServiceMaster,
  ServiceTatScoreMap,
  TatBucket,
  Company,
  Endorsement,
  PolicyClaim,
  MirReport,
  Meeting,
  OpportunityActivityMap,
  Policy,
  PolicyAssetEndorsement,
} from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { ServiceTatService } from "./service-tat.service";
import { ServiceTatController } from "./service-tat.controller";
import { ServiceTatRepository } from "./service-tat.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrgServiceTatSummary,
      ServiceMaster,
      OrgServiceWeightage,
      ServiceTatScoreMap,
      TatBucket,
      Company,
      Endorsement,
      PolicyClaim,
      MirReport,
      Meeting,
      OpportunityActivityMap,
      Policy,
      PolicyAssetEndorsement,
    ]),
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [ServiceTatController],
  providers: [
    ServiceTatService,
    ServiceTatRepository,
    EntityService,
    ScopeService,
  ],
  exports: [ServiceTatService],
})
export class ServiceTatModule {}
