import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { AclCategoryActionApiMap } from "./entities/acl-category-action-api-map.entity";
import { AclCategoryActionMap } from "./entities/acl-category-action-map.entity";
import { RoleAclCategoryActionMap } from "./entities/role-acl-category-action-map.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AclService {
  constructor(
    @InjectRepository(AclCategoryActionApiMap)
    private readonly aclCategoryActionApiMapRepository: Repository<AclCategoryActionApiMap>
  ) {}

  async hasAccess(
    roleIds: number[],
    method: string,
    path: string
  ): Promise<boolean> {
    try {
      let result = await this.aclCategoryActionApiMapRepository
        .createQueryBuilder("aclCategoryActionApiMap")
        .innerJoin(
          AclCategoryActionMap,
          "aclCategoryActionMap",
          "aclCategoryActionApiMap.acl_category_action_id = aclCategoryActionMap.id"
        )
        .innerJoin(
          RoleAclCategoryActionMap,
          "roleAclCategoryActionMap",
          "aclCategoryActionMap.id = roleAclCategoryActionMap.acl_category_action_id"
        )
        .where("roleAclCategoryActionMap.role_id IN (:...roleIds)", { roleIds })
        .andWhere("aclCategoryActionApiMap.method = :method", { method })
        .andWhere("aclCategoryActionApiMap.api = :path", { path })
        .getMany();

      return result.length > 0;
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }
}
