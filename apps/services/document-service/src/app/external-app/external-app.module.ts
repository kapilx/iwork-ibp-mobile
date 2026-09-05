import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ExternalAppController } from "./external-app.controller";
import { ExternalAppService } from "./external-app.service";
import { ExternalAppRepository } from "./external-app.repository";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([MstrExtApplicationRef, MstrExtAppResponseMapping]),
        InsuranceWellnessHubServiceLibModule,
        JwtModule,
    ],
    controllers: [ExternalAppController],
    providers: [ExternalAppService, ExternalAppRepository],
    exports: [ExternalAppService, ExternalAppRepository],
})
export class ExternalAppModule {}
