import { Module } from "@nestjs/common";
import { PoppinsController } from "./poppins.controller";
import { PoppinsService } from "./poppins.service";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    InsuranceWellnessHubServiceLibModule,
    JwtModule
  ],
  controllers: [PoppinsController],
  providers: [PoppinsService],
  exports: [PoppinsService],
})
export class PoppinsModule {}
