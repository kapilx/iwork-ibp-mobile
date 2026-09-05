import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
import {
  Announcement,
  Employee,
  LookUp,
  User,
} from "../../../../service-lib/src/lib/entities";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardService } from "./dashboard.service";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, Employee, LookUp, User]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardRepository,
    MasterValidationService,
    AuthGuard,
    RolesGuard,
    EntityService,
  ],
  exports: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
