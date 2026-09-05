import { Module } from "@nestjs/common";
import { NoteService } from "./note.service";
import { NoteController } from "./note.controller";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard"; // Import AuthGuard here
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard"; // Import RolesGuard here
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import {
  Company,
  Opportunity,
  FileUpload,
  OpportunityActivityMap,
  NoteDocumentMap,
  Note,
} from "../../../../service-lib/src/lib/entities";
import { NoteRepository } from "./note.repository";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Note,
      Company,
      Opportunity,
      FileUpload,
      OpportunityActivityMap,
      NoteDocumentMap,
    ]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [NoteController],
  providers: [
    NoteService,
    NoteRepository,
    AuthGuard,
    RolesGuard,
    EntityService,
    ScopeService,
  ],
  exports: [NoteService, NoteRepository],
})
export class NoteModule {}
