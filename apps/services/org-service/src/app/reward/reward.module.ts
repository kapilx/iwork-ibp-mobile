import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { Reward } from "../../../../service-lib/src/lib/entities/reward.entity";
import { RewardBusinessMonth } from "../../../../service-lib/src/lib/entities/reward-business-month.entity";
import { RewardDocMap } from "../../../../service-lib/src/lib/entities/reward-doc-map.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { LookUpModule } from "../look-up/look-up.module";
import { RewardController } from "./reward.controller";
import { RewardRepository } from "./reward.repository";
import { RewardService } from "./reward.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, RewardBusinessMonth, RewardDocMap]),
    LookUpModule,
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [RewardController],
  providers: [RewardService, RewardRepository, ScopeService, EntityService],
  exports: [RewardService, RewardRepository],
})
export class RewardModule {}
