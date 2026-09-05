import { Module } from "@nestjs/common";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { HclIntegrationController } from "./hcl-integration.controller";
import { HclIntegrationService } from "./hcl-integration.service";
import { HclIntegrationRepository } from "./hcl-integration.repository";

@Module({
  controllers: [HclIntegrationController],
  providers: [HclIntegrationService, HclIntegrationRepository, TraceIdService],
  exports: [HclIntegrationService],
})
export class HclIntegrationModule {}
