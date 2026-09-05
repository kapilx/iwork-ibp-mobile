import { Module } from "@nestjs/common";
import { AccessControlListService } from "./access-control-list.service";
import { AccessControlListController } from "./access-control-list.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { AclAction } from "../../../../service-lib/src/lib/entities/acl-actions.entity";
import { AclCategory } from "../../../../service-lib/src/lib/entities/acl-categories.entity";
import { AclCategoryActionMap } from "../../../../service-lib/src/lib/entities/acl-category-action-map.entity";
import { RoleAclCategoryActionMap } from "../../../../service-lib/src/lib/entities/role-acl-category-action-map.entity";
import { ConfigModule } from "@nestjs/config";
import { AccessControlListRepository } from "./access-control-list.repository";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRole,
      AclAction,
      AclCategory,
      AclCategoryActionMap,
      RoleAclCategoryActionMap,
    ]),
    ConfigModule,
    InsuranceWellnessHubServiceLibModule
  ],
  providers: [AccessControlListService, AccessControlListRepository],
  controllers: [AccessControlListController],
})
export class AccessControlModule {}
