import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { MasterService } from "./master.service";
import { MasterController } from "./master.controller";
import { MasterRepository } from "./master.repository";
import { CoverService } from "../cover/cover.service";
import { CoverRepository } from "../cover/cover.repository";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  LookUp,
  FilterPreference,
  PolicyTypeSegregation,
} from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
@Module({
  imports: [
    TypeOrmModule.forFeature([LookUp, FilterPreference, PolicyTypeSegregation]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  providers: [
    MasterService,
    MasterRepository,
    CoverService,
    CoverRepository,
    AuthGuard,
    RolesGuard,
    EntityService,
  ],
  controllers: [MasterController],
})
export class MasterModule {}
