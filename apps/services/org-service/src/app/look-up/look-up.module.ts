import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { JwtModule } from "@nestjs/jwt";
import { LookUpService } from "./look-up.service";
import { LookUpController } from "./look-up.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { LookUpRepository } from "./look-up.repository";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";
@Module({
  imports: [
    TypeOrmModule.forFeature([LookUp]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  providers: [LookUpService, LookUpRepository, AuthGuard, RolesGuard],
  controllers: [LookUpController],
  exports: [LookUpService, LookUpRepository],
})
export class LookUpModule {}
