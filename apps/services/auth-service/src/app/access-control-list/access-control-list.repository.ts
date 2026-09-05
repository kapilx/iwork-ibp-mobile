import { HttpStatus, Injectable } from "@nestjs/common";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { RoleAclCategoryActionMap } from "../../../../service-lib/src/lib/entities/role-acl-category-action-map.entity";
import { AclCategoryActionMap } from "../../../../service-lib/src/lib/entities/acl-category-action-map.entity";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { AuthVersionService } from "../../../../service-lib/src/lib/auth-version/auth-version.service";
import { ENV } from "../../../../service-lib/src/lib/environment";

@Injectable()
export class AccessControlListRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(RoleAclCategoryActionMap)
    private readonly roleAclMapRepository: Repository<RoleAclCategoryActionMap>,

    @InjectRepository(AclCategoryActionMap)
    private readonly aclCategoryActionMapRepository: Repository<AclCategoryActionMap>,
    private readonly traceIdService: TraceIdService,
    private readonly authVersionService: AuthVersionService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  /**
   * Retrieves the permissions for a specific user based on their roles and access control mappings.
   */
  async getUserPermissions(userId: number,categoryKey:string) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'AccessControlListRepository',
        method: 'getUserPermissions',
        payload: { categoryKey },
        messageData: 'method invoked',
      }),
    });
    try {
      const userRoles = await this.userRoleRepository
        .createQueryBuilder("userRole")
        .leftJoinAndSelect("userRole.role", "role")
        .leftJoin("userRole.user", "user")
        .where("user.id = :userId", { userId })
        .getMany();

      if (!userRoles.length) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          "No roles found for the user"
        );
      }

      const permissions: any = {
        roleId: userRoles[0].role.id,
        roleName: userRoles[0].role.name,
        access: {},
      };

      for (const userRole of userRoles) {
        try {
          let query = this.roleAclMapRepository
            .createQueryBuilder("roleAcl")
            .leftJoinAndSelect("roleAcl.aclCategoryActionMap", "map")
            .leftJoinAndSelect("map.aclCategory", "category")
            .leftJoinAndSelect("map.aclAction", "action")
            .leftJoin("roleAcl.role", "role")
            .where("role.id = :roleId", { roleId: userRole.role.id })
          if (categoryKey) {
            query = query.andWhere("category.categoryKey = :categoryKey",{ categoryKey });
          }
          const rolePermissions = await query.getMany();
          for (const rolePermission of rolePermissions) {
            try {
              const category = rolePermission.aclCategoryActionMap.aclCategory;
              const action = rolePermission.aclCategoryActionMap.aclAction;

              // Build the nested structure
              if (!permissions.access[category.applicationScope]) {
                permissions.access[category.applicationScope] = {};
              }

              if (
                !permissions.access[category.applicationScope][
                  category.categoryKey
                ]
              ) {
                permissions.access[category.applicationScope][
                  category.categoryKey
                ] = {};
              }
              if (!permissions.access[category.applicationScope][category.categoryKey]['parent']) {
                permissions.access[category.applicationScope][category.categoryKey]['parent'] = category.parent;
              }
              permissions.access[category.applicationScope][
                category.categoryKey
              ][action.actionKey] = true;
            } catch (error) {
              console.error(
                "Error processing role permission:",
                rolePermission,
                error
              );
              return createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                error instanceof Error
                  ? error.message
                  : "Error processing role permission"
              );
            }
          }
        } catch (error) {
          console.error(
            "Error fetching role permissions for role:",
            userRole.role.id,
            error
          );
          return createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Error fetching role permissions"
          );
        }
      }

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'success',
          location: 'AccessControlListRepository',
          method: 'getUserPermissions',
          payload: { categoryKey },
          messageData: 'Permissions retrieved',
        }),
      });
      return permissions;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'AccessControlListRepository',
          method: 'getUserPermissions',
          payload: { categoryKey },
          messageData: error,
        }),
      });
      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Internal server error',
      );
    }
    return true;
  }

  async getAclMetadata() {
    const maps = await this.aclCategoryActionMapRepository.find({
      relations: { aclCategory: true, aclAction: true },
    });
    const grouped = new Map<number, { category: any; actions: any[] }>();
    for (const map of maps) {
      const category = map.aclCategory;
      if (!grouped.has(category.id)) {
        grouped.set(category.id, { category, actions: [] });
      }
      grouped.get(category.id)!.actions.push({
        id: map.id,
        name: map.aclAction.name,
        actionKey: map.aclAction.actionKey,
      });
    }
    return Array.from(grouped.values());
  }

  async getRoleAcl(roleId: number) {
    const records = await this.roleAclMapRepository.find({
      where: { role: { id: roleId } },
      relations: { 
        aclCategoryActionMap: {
          aclCategory: true,
          aclAction: true
        },
      },
    });

    const categoryActionMap = [];
    records.forEach(element => {
      const map = categoryActionMap.find(map => 
        map.aclCategoryId === element.aclCategoryActionMap.aclCategory.id
      );
      if (map) {
        map.aclCatActionMapIds.push(element.aclCategoryActionMap.id);
      } else {
        categoryActionMap.push({
          aclCategoryId: element.aclCategoryActionMap.aclCategory.id,
          aclCatActionMapIds: [element.aclCategoryActionMap.id]
        });
      }
    });
    return categoryActionMap;
  }

  async updateRoleAcl(roleId: number, aclIds: number[]) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AccessControlListRepository",
        method: "updateRoleAcl",
        payload: { roleId, aclIds },
        messageData: "method invoked",
      }),
    });

    // Get existing ACL mappings for the role
    const existingMappings = await this.roleAclMapRepository.find({
      where: { role: { id: roleId } },
      select: ["id", "aclCategoryActionMap"],
      relations: ["aclCategoryActionMap"],
    });

    const existingAclIds = existingMappings.map(
      (m) => m.aclCategoryActionMap.id,
    );
    const newAclIds = aclIds || [];

    // Find IDs to create (exist in payload but not in DB)
    const toCreate = newAclIds.filter((id) => !existingAclIds.includes(id));

    // Find IDs to delete (exist in DB but not in payload)
    const toDelete = existingMappings.filter(
      (m) => !newAclIds.includes(m.aclCategoryActionMap.id),
    );

    // Delete mappings that should be removed
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map((m) => m.id);
      await this.roleAclMapRepository.delete(idsToDelete);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AccessControlListRepository",
          method: "updateRoleAcl",
          payload: { roleId, deletedCount: toDelete.length },
          messageData: "Deleted obsolete ACL mappings",
        }),
      });
    }

    // Create new mappings
    if (toCreate.length > 0) {
      const entities = toCreate.map((id) =>
        this.roleAclMapRepository.create({
          role: { id: roleId } as any,
          aclCategoryActionMap: { id } as any,
          createdBy: "system",
          updatedBy: "system",
        }),
      );
      await this.roleAclMapRepository.save(entities);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AccessControlListRepository",
          method: "updateRoleAcl",
          payload: { roleId, createdCount: toCreate.length },
          messageData: "Created new ACL mappings",
        }),
      });
    }
    
    // Check feature flag before triggering force logout on role permission changes
    const forceLogoutEnabled = (ENV.IWORK_FORCE_LOGOUT_ON_ROLE_PERMISSION_CHANGE || "").toLowerCase() === 'true';
    
    // Manually increment auth version for all users with this role (if feature enabled)
    if ((toCreate.length > 0 || toDelete.length > 0) && forceLogoutEnabled) {
      try {
        await this.authVersionService.handleRolePermissionChange(
          roleId,
          toCreate.length > 0 ? "added" : "removed",
        );

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "AccessControlListRepository",
            method: "updateRoleAcl",
            payload: { roleId },
            messageData:
              "Auth versions incremented for users with updated role permissions",
          }),
        });
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "AccessControlListRepository",
            method: "updateRoleAcl",
            payload: { roleId, error: error },
            messageData:
              "Failed to increment auth versions, but role permissions were updated",
          }),
        });
      }
    } else if (toCreate.length > 0 || toDelete.length > 0) {
      // Log that role permissions were updated but force logout is disabled
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AccessControlListRepository",
          method: "updateRoleAcl",
          payload: { roleId, forceLogoutEnabled },
          messageData:
            "Role permissions updated but force logout is disabled by feature flag",
        }),
      });
    }
    return true;
  }
}
