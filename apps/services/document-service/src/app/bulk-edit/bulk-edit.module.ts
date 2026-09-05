import { Module } from "@nestjs/common";
import { BulkEditController } from "./controllers/bulk-edit.controller";
import { BulkEditService } from "./services/bulk-edit.service";
import { BulkEditRepository } from "./services/bulk-edit.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../../../service-lib/src/lib/entities";
import { Role } from "../../../../service-lib/src/lib/entities/roles.entity";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
/**
 * Module for bulk edit functionality
 * Provides endpoints and services for bulk editing entities
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [BulkEditController],
  providers: [
    BulkEditService,
    BulkEditRepository,
    TraceIdService,
    NotificationUtils,
  ],
  exports: [BulkEditService, BulkEditRepository],
})
export class BulkEditModule {}
