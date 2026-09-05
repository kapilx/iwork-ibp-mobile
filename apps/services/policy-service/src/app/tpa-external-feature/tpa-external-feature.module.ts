import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { MstrTpaFeatureType } from "../../../../service-lib/src/lib/entities/mstr-tpa-feature-type.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { TpaPayloadFieldMapping } from "../../../../service-lib/src/lib/entities/tpa-payload-field-mapping.entity";
import { TpaExternalFeatureController } from "./tpa-external-feature.controller";
import { TpaExternalFeatureService } from "./tpa-external-feature.service";
import { TpaExternalFeatureRepository } from "./tpa-external-feature.repository";
import { TpaSsoConfigModule } from "../tpa-sso-config/tpa-sso-config.module";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstrTpaFeatureType,
      TpaExternalFeatureConfig,
      TpaPayloadFieldMapping,
      MstrExtApplicationRef,
      MstrExtAppResponseMapping,
    ]),
    // Only for the combined app-refs-and-sso-configs endpoint below — pulls from
    // tpa_sso_config (a separate table/module) and merges the two result sets in
    // the API response only. Does not touch how either table stores its data.
    TpaSsoConfigModule,
  ],
  controllers: [TpaExternalFeatureController],
  providers: [TpaExternalFeatureService, TpaExternalFeatureRepository, TraceIdService],
  exports: [TpaExternalFeatureService],
})
export class TpaExternalFeatureModule {}
