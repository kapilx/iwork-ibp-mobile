import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard"; // Import AuthGuard here
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard"; // Import RolesGuard here
import {
  Company,
  FileUpload,
  LookUp,
  Opportunity,
  OpportunityActivityMap,
  Task,
  TaskDocumentMap,
} from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskRepository } from "./task.repository";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import { LookUpModule } from "../../../../org-service/src/app/look-up/look-up.module";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Company,
      Opportunity,
      TaskDocumentMap,
      FileUpload,
      LookUp,
      OpportunityActivityMap,
    ]),
    JwtModule,
    LookUpModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    AuthGuard,
    RolesGuard,
    EntityService,
    LookUpValidationService,
    MasterValidationService,
    LookUpService,
    ScopeService,
  ],
  exports: [TaskService, TaskRepository],
})
export class TaskModule {}
