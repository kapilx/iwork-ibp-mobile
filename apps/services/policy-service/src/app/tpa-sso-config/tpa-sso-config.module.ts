import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TpaSsoConfig } from "../../../../service-lib/src/lib/entities/tpa-sso-config.entity";
import { TpaSsoFieldMapping } from "../../../../service-lib/src/lib/entities/tpa-sso-field-mapping.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { TpaSsoConfigController } from "./tpa-sso-config.controller";
import { TpaSsoConfigService } from "./tpa-sso-config.service";
import { TpaSsoConfigRepository } from "./tpa-sso-config.repository";

@Module({
  imports: [TypeOrmModule.forFeature([TpaSsoConfig, TpaSsoFieldMapping, TpaExternalFeatureConfig])],
  controllers: [TpaSsoConfigController],
  providers: [TpaSsoConfigService, TpaSsoConfigRepository],
  exports: [TpaSsoConfigService],
})
export class TpaSsoConfigModule {}
