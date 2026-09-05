import { HttpStatus, Injectable } from "@nestjs/common";
import {
  Brackets,
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  In,
  ObjectLiteral,
} from "typeorm";
import { EmployeeHierarchy } from "../../../../../apps/services/service-lib/src/lib/entities/employee_hierarchy.entity";
import { User } from "../../../../../apps/services/service-lib/src/lib/entities/user";
import { Employee } from "../../../../../apps/services/service-lib/src/lib/entities/employee.entity";
import {
  LookUp,
  OpportunityActivityMap,
  OpportunityActivityParticipants,
  Organisation,
  Task,
} from "../../../../../apps/services/service-lib/src/lib/entities";
import { RoleAclCategoryActionMap } from "../../../../../apps/services/service-lib/src/lib/entities/role-acl-category-action-map.entity";
import { EntityService } from "./entity-service.utils";
import { OWNER_TYPES, ROLE_KEY, ENTITY_NAME } from "../constants";
import { CONTACT_RECORD_TYPE_MAP, ENTITY_TYPE_WITH_ORG_LINK } from "../../../../../apps/services/service-lib/src/lib/constants";

// Super User and its read-only counterpart both get unrestricted (org/branch-unscoped) visibility.
const isSuperUserRole = (roleKey: string | null | undefined): boolean =>
  roleKey === ROLE_KEY.ROLE_SUPER_USER ||
  roleKey === ROLE_KEY.ROLE_SUPER_USER_READ_ONLY;

export interface fetchEntityListType<T> {
  entity: EntityTarget<T>;
  // Omit both to fetch every matching row unpaginated — see EntityService.fetchEntityList.
  page?: number;
  limit?: number;
  sort?: { field: string; order: "ASC" | "DESC" }[];
  relations?: string | string[];
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  select?: string[];
  searchArray?: {
    searchBy: string;
    searchValue: string | number | Date | Array<string | number | Date>;
  }[];
  userFilter?: {
    userId: number;
    reporteeUserIds?: number[];
    org?: { key: string; value: number[] };
    branch?: { key: string; value: number[] };
    lob?: { key: string; value: number[] };
    custom?: number[];
    tagged?: number[];
  };
  searchString?: string;
  searchOn?: string[];
  dateFilter?: { field: string; from: Date; to?: Date };
  secondDateFilter?: { field: string; from: Date; to?: Date };
  period?: { field: string; from: Date; to?: Date };
  preserveCreatedAt?: boolean;
  entityIds?: number[];
  customWhereCondition?: Brackets;
  debugOptions?: {
    logQuery?: boolean;
  };
  funnel?: boolean;
}

interface UserHierarchyItem {
  userId: number;
  firstName: string;
  lastName: string;
  reportingUserId: number | null;
  level: number;
  organisationId: number | null;
  sbuId: number | null;
  verticalId: number | null;
  departmentId: number | null;
  branchId: number | null;
}

@Injectable()
export class ScopeService {
  private readonly dataSource: DataSource;

  constructor(
    dataSource: DataSource,
    private readonly entityService: EntityService
  ) {
    this.dataSource = dataSource;
  }

  async hasLeadershipRole(userId: number): Promise<boolean> {
    if (!userId) return false;
    
    const user = await this.getUserWithRoles(userId);
    const roles = (user?.userRoles || [])
      .filter((userRole) => userRole?.role) // Filter out undefined roles
      .map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));

    if (
      user &&
      Array.isArray(roles)
    ) {
      return roles.some(
        (role: any) =>
          role.roleKey === ROLE_KEY.ROLE_LEADERSHIP ||
          isSuperUserRole(role.roleKey),
      );
    }
    return false;
  }

  /**
   * Resolves which opportunity-activity team(s) a user may view, from the
   * "BD/ISG activities read" ACL capabilities (BD_READ_001 / ISG_READ_001). The
   * SPECIFIC read action is used (not the broad BD/ISG category): a BD manager may
   * hold ISG approve/assign ACL but must NOT carry ISG read, so they stay BD-only.
   * Mirrors the frontend `useActivityRoleVisibility` hook.
   *
   *   - BD read only  -> { canViewBD: true,  canViewISG: false }
   *   - ISG read only -> { canViewBD: false, canViewISG: true }
   *   - both reads, or neither (leadership/super/CS) -> both true (unrestricted)
   */
  async getActivityRoleVisibility(
    userId: number
  ): Promise<{ canViewBD: boolean; canViewISG: boolean }> {
    if (!userId) return { canViewBD: true, canViewISG: true };

    const user = await this.getUserWithRoles(userId);
    const roleIds = (user?.userRoles || [])
      .map((userRole) => userRole?.role?.id)
      .filter(Boolean);

    if (roleIds.length === 0) {
      return { canViewBD: true, canViewISG: true };
    }

    const hasReadAction = async (actionKey: string): Promise<boolean> => {
      const count = await this.dataSource
        .getRepository(RoleAclCategoryActionMap)
        .createQueryBuilder("roleAcl")
        .innerJoin("roleAcl.role", "role")
        .innerJoin("roleAcl.aclCategoryActionMap", "cam")
        .innerJoin("cam.aclAction", "act")
        .where("role.id IN (:...roleIds)", { roleIds })
        .andWhere("act.actionKey = :actionKey", { actionKey })
        .getCount();
      return count > 0;
    };

    const [canReadBD, canReadISG] = await Promise.all([
      hasReadAction("BD_READ_001"),
      hasReadAction("ISG_READ_001"),
    ]);

    // Both reads, or neither (leadership/super/CS), means unrestricted.
    if (canReadBD === canReadISG) {
      return { canViewBD: true, canViewISG: true };
    }

    return { canViewBD: canReadBD, canViewISG: canReadISG };
  }

  /**
   * Retrieves data to define scope.
   */
  async validateScope<T extends ObjectLiteral>(
    fetchEntityData: fetchEntityListType<T> | undefined,
    userId: number,
    entity: string
  ): Promise<{ data: T[]; count: number }> {
    console.log("validateScope called with entity:", entity);
    const employeeDetails = await this.dataSource
      .getRepository(Employee)
      .findOne({
        where: { userId: userId },
      });
    if (!employeeDetails) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "User not found",
      };
    }

    const user = await this.dataSource.getRepository<User>(User).findOne({
      where: [{ userId: userId }],
      relations: ["userRoles", "userRoles.role"],
    });
    const roles = (user?.userRoles || [])
      .filter((userRole) => userRole?.role) // Filter out undefined roles
      .map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));
    if (!fetchEntityData) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid fetch entity data",
      };
    }
    const additionalUserIds: number[] = [];
    const taggedResourceIds: number[] = [];
    // let countryId: number | null = null,
    //   contactIds: number[] = [];
    if (
      roles.some(
        (r) =>
          r.roleKey === ROLE_KEY.ROLE_LEADERSHIP ||
          isSuperUserRole(r.roleKey),
      )
    ) {
      fetchEntityData.where = undefined;
    }
    for (const role of roles) {
      if (entity !== "opportunity") {
        const orgUsersId = await this.fetchOrgUserIds(
          employeeDetails.organisationId
        );
        additionalUserIds.push(...orgUsersId);
        // const organisationDetails = await this.dataSource
        //   .getRepository(Organisation)
        //   .findOne({
        //     where: { id: employeeDetails.organisationId },
        //   });
        // if (!organisationDetails) {
        //   return {
        //     status: HttpStatus.BAD_REQUEST,
        //     message: "Invalid organisation data",
        //   };
        // }

        // if (entity === "policy") {
        //   const orgUsersId = await this.fetchOrgUserIds(
        //     employeeDetails.organisationId
        //   );
        //   additionalUserIds.push(...orgUsersId);
        // } else if (entity == "contact") {
        //   // contact entity
        //   if (fetchEntityData.where) {
        //     contactIds = await this.fetchContactIdsByOrganisation(
        //       organisationDetails.countryId,
        //       fetchEntityData.where.contactRecordTypeLid
        //     );
        //   }
        // } else {
        //   // Not contact
        //   countryId = organisationDetails.countryId;
        // }
      } else {
        if (["AM", "ISG"].includes(role.name)) {
          const branchUsersId = await this.fetchBranchUserIds(
            employeeDetails.branchId
          );
          additionalUserIds.push(...branchUsersId);
        } else {
          const reporteeUserIds = await this.fetchReporteeUserIds(userId);
          additionalUserIds.push(...reporteeUserIds);
        }
        const resourceIds = await this.fetchTaggedOprty([
          ...additionalUserIds,
          userId,
        ]);
        const ownerResourceIds = await this.fetchOpportunitiesByOwner([
          ...additionalUserIds,
          userId,
        ]);

        const taskOwnerIds = await this.fetchOpportunitiesByTask([userId]);

        console.log("ownerResourceIds", ownerResourceIds);
        console.log("taskOwnerIds", taskOwnerIds);

        taggedResourceIds.push(
          ...resourceIds,
          ...ownerResourceIds,
          ...taskOwnerIds
        );
      }
    }
    fetchEntityData.userFilter = { userId: userId, reporteeUserIds: [] };
    // if (countryId != null) {
    //   fetchEntityData.userFilter.org = {
    //     key: "countryId",
    //     value: [countryId],
    //   };
    // }
    // if (entity === "contact") {
    //   fetchEntityData.userFilter.org = {
    //     key: "id",
    //     value: contactIds,
    //   };
    // }
    fetchEntityData.userFilter?.reporteeUserIds?.push(...additionalUserIds);
    if (taggedResourceIds.length > 0) {
      fetchEntityData.userFilter.tagged = [];
      fetchEntityData.userFilter?.tagged?.push(...taggedResourceIds);
    }
    return await this.entityService.fetchEntityList(
      fetchEntityData.entity,
      fetchEntityData.page,
      fetchEntityData.limit,
      fetchEntityData.sort,
      fetchEntityData.relations,
      fetchEntityData.where,
      fetchEntityData.select,
      fetchEntityData.searchArray,
      fetchEntityData.userFilter,
      fetchEntityData.searchString,
      fetchEntityData.searchOn,
      fetchEntityData.dateFilter,
      fetchEntityData.period,
      fetchEntityData.preserveCreatedAt,
      fetchEntityData.entityIds,
      fetchEntityData.customWhereCondition,
      fetchEntityData.secondDateFilter,
      fetchEntityData.debugOptions
    );
  }

  async getEmployeeDetails(userId: number): Promise<Employee | null> {
    try {
      const employeeDetails = await this.dataSource
        .getRepository(Employee)
        .findOne({
          where: { userId: userId },
        });
      return employeeDetails || null;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      return null;
    }
  }

  async getUserWithRoles(userId: number): Promise<User | null> {
    try {
      const user = await this.dataSource.getRepository<User>(User).findOne({
        where: { userId: userId },
        relations: ["userRoles", "userRoles.role"],
      });
      return user || null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }

  async getOrganisationDetails(
    organisationId: number
  ): Promise<Organisation | null> {
    try {
      const organisationDetails = await this.dataSource
        .getRepository(Organisation)
        .findOne({
          where: { id: organisationId },
        });
      return organisationDetails || null;
    } catch (error) {
      console.error("Error fetching organisation details:", error);
      return null;
    }
  }

  async validateMasterScope<T extends ObjectLiteral>(
    fetchEntityData: fetchEntityListType<T> | undefined,
    userId: number,
    entity: string
  ): Promise<{ data: T[]; count: number }> {
    console.log("validateMasterScope called with entity:", entity);
    const employeeDetails = await this.getEmployeeDetails(userId);
    if (!employeeDetails) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "User not found",
      };
    }

    const user = await this.getUserWithRoles(userId);
    const roles = (user?.userRoles || [])
      .filter((userRole) => userRole?.role) // Filter out undefined roles
      .map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));
    if (!fetchEntityData) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid fetch entity data",
      };
    }
    /**
    const additionalUserIds: Set<number> = new Set();
    const taggedResourceIds: number[] = [];
    let countryId: number | null = null,
      contactIds: number[] = [],
      isLeadership = false,
      isOrg = false;
    fetchEntityData.userFilter = { userId: userId, reporteeUserIds: [] };
    const organisationPromises = [];
    let hasLeadershipRole = false;
    // for (const role of roles) {
    //   if (
    //     role.roleKey !== null &&
    //     role.roleKey?.includes(ROLE_KEY.ROLE_LEADERSHIP)
    //   ) {
    //     console.log("check", fetchEntityData.where);
    //     console.log("Leadership role detected, full access granted");
    //     // fetchEntityData.where = undefined;
    //     isLeadership = true;
    //     break;
    //   }

    //   const organisationDetails = await this.getOrganisationDetails(
    //     employeeDetails.organisationId
    //   );
    //   if (!organisationDetails) {
    //     return {
    //       status: HttpStatus.BAD_REQUEST,
    //       message: "Invalid organisation data",
    //     };
    //   }
    //   if (entity == "contact") {
    //     // contact entity only
    //     if (fetchEntityData.where) {
    //       contactIds = await this.fetchContactIdsByOrganisation(
    //         organisationDetails.countryId,
    //         fetchEntityData.where.contactRecordTypeLid
    //       );
    //       if (contactIds.length > 0) {
    //         fetchEntityData.userFilter.org = {
    //           key: "id",
    //           value: contactIds,
    //         };
    //       }
    //     }
    //   } else {
    //     // Not contact, other entity
    //     countryId = organisationDetails.countryId;
    //     fetchEntityData.userFilter.org = {
    //       key: "countryId",
    //       value: [countryId],
    //     };
    //   }
    // }
    /**
    for (const role of roles) {
      if (
        role.roleKey !== null &&
        role.roleKey?.includes(ROLE_KEY.ROLE_LEADERSHIP)
      ) {
        isLeadership = true;
        hasLeadershipRole = true;
      } else if(role.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) || role.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE)) {
        isOrg = true;
      }

      // For all roles (including leadership), we need organisation details for contact entities
      if (entity === "contact") {
        organisationPromises.push(
          this.getOrganisationDetails(employeeDetails.organisationId)
        );
      }
    }
    */

    const isLeadership = roles.some(
      (r) =>
        r.roleKey !== null &&
        (r.roleKey?.includes(ROLE_KEY.ROLE_LEADERSHIP) ||
          isSuperUserRole(r.roleKey)),
    );
    const isOrg = roles.some(
      (r) =>
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) ||
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE),
    );

    /**
    // For contact entities, we need organisation details
    if (entity === "contact") {
      organisationPromises.push(
        this.getOrganisationDetails(employeeDetails.organisationId)
      );
    }

    // if (isOrg) {
    //   const orgUsersId = await this.fetchOrgUserIds(
    //     employeeDetails.organisationId
    //   );
    //   orgUsersId.forEach((id) => additionalUserIds.add(id));
    // }

    if (entity === "contact" && organisationPromises.length > 0) {
      try {
        const organisationDetailsArray = await Promise.all(
          organisationPromises
        );

        for (const organisationDetails of organisationDetailsArray) {
          if (!organisationDetails) {
            return {
              status: HttpStatus.BAD_REQUEST,
              message: "Invalid organisation data",
            };
          }
          if (fetchEntityData.where) {
            contactIds = await this.fetchContactIdsByOrganisation(
              organisationDetails.countryId,
              fetchEntityData.where.contactRecordTypeLid
            );
            if (contactIds.length > 0) {
              fetchEntityData.userFilter.org = {
                key: "id",
                value: contactIds,
              };
            }
          }

          // If leadership role, we only need to process one organisation
          if (hasLeadershipRole) {
            break;
          }
        }
      } catch (error) {
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Error fetching organisation details",
        };
      }
    } else if (entity !== "contact" && !hasLeadershipRole) {
      // Original logic for non-contact entities and non-leadership roles
      const organisationDetails = await this.getOrganisationDetails(
        employeeDetails.organisationId
      );

      if (!organisationDetails) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Invalid organisation data",
        };
      }

      countryId = organisationDetails.countryId;
      fetchEntityData.userFilter.org = {
        key: "countryId",
        value: [countryId],
      };
    }
    */  
    let hasViewAllCompanies = false;
    if (entity === "Company") {
      const roleIds = roles.map((r) => r.id).filter(Boolean);
      if (roleIds.length > 0) {
        const count = await this.dataSource
          .getRepository(RoleAclCategoryActionMap)
          .createQueryBuilder("roleAcl")
          .innerJoin("roleAcl.role", "role")
          .innerJoin("roleAcl.aclCategoryActionMap", "cam")
          .innerJoin("cam.aclCategory", "cat")
          .innerJoin("cam.aclAction", "act")
          .where("role.id IN (:...roleIds)", { roleIds })
          .andWhere("cat.categoryKey = :categoryKey", { categoryKey: "COMPANY" })
          .andWhere("act.actionKey = :actionKey", { actionKey: "VIEW_ALL_001" })
          .getCount();
        hasViewAllCompanies = count > 0;
      }
    }

    if (isLeadership || hasViewAllCompanies) {
      if (fetchEntityData.searchArray) {
        fetchEntityData.searchArray = fetchEntityData.searchArray.filter(
          (item) => item.searchBy !== "owner.userId"
        );
      }
      if (entity === "Company") {
        fetchEntityData.customWhereCondition = undefined;
      }
    }
    /** 
    fetchEntityData.userFilter?.reporteeUserIds?.push(...additionalUserIds);
    if (taggedResourceIds.length > 0) {
      fetchEntityData.userFilter.tagged = [];
      fetchEntityData.userFilter?.tagged?.push(...taggedResourceIds);
    }
    */
    return await this.entityService.fetchEntityList(
      fetchEntityData.entity,
      fetchEntityData.page,
      fetchEntityData.limit,
      fetchEntityData.sort,
      fetchEntityData.relations,
      fetchEntityData.where,
      fetchEntityData.select,
      fetchEntityData.searchArray,
      fetchEntityData.userFilter,
      fetchEntityData.searchString,
      fetchEntityData.searchOn,
      fetchEntityData.dateFilter,
      fetchEntityData.period,
      fetchEntityData.preserveCreatedAt,
      fetchEntityData.entityIds,
      fetchEntityData.customWhereCondition,
      fetchEntityData.secondDateFilter,
      fetchEntityData.debugOptions
    );
  }

  async validateOpportunityScope<T extends ObjectLiteral>(
    fetchEntityData: fetchEntityListType<T> | undefined,
    userId: number,
    entity: string,
    // Opt-in per call site; omitted everywhere except the Client Portfolio
    // aggregate, so existing scoping behaviour is byte-for-byte unchanged.
    // recursiveReportees: expand "Manager + Team" to the whole reporting
    // subtree instead of direct reports only (see fetchReporteeUserIds).
    options?: { recursiveReportees?: boolean }
  ): Promise<{ data: T[]; count: number }> {
    console.log("validateOpportunityScope called with entity:", entity);
    const employeeDetails = await this.getEmployeeDetails(userId);
    if (!employeeDetails) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "User not found",
      };
    }

    const user = await this.getUserWithRoles(userId);
    const roles = (user?.userRoles || [])
      .filter((userRole) => userRole?.role) // Filter out undefined roles
      .map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));

    if (!fetchEntityData) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid fetch entity data",
      };
    }
    const additionalUserIds: Set<number> = new Set();
    let taggedResourceIds: number[] = [];

    const isLeadership = roles.some(
      (r) =>
        r.roleKey !== null &&
        (r.roleKey?.includes(ROLE_KEY.ROLE_LEADERSHIP) ||
          isSuperUserRole(r.roleKey)),
    );
    // An explicit owner selection keeps its scope even when the selected user
    // holds a leadership role — the leadership bypass applies only to the
    // unfiltered org-wide view. Mirrors the dashboard controllers. Detection
    // differs per entity: policy pushes owner.userId only on a real pick, but
    // opportunity pushes it on EVERY request (defaulting to the viewer), so
    // its listing marks a real pick with the "explicitOwner" search entry —
    // consumed and stripped here, never reaching column mapping.
    const hasExplicitOpportunityOwner = !!fetchEntityData.searchArray?.some(
      (item) => item.searchBy === "explicitOwner"
    );
    if (hasExplicitOpportunityOwner) {
      fetchEntityData.searchArray = fetchEntityData.searchArray?.filter(
        (item) => item.searchBy !== "explicitOwner"
      );
    }
    const hasExplicitOwnerSelection =
      hasExplicitOpportunityOwner ||
      (entity === "policy" &&
        !!fetchEntityData.searchArray?.some(
          (item) => item.searchBy === "owner.userId"
        ));
    const effectiveLeadership = isLeadership && !hasExplicitOwnerSelection;
    const isOrg = roles.some(
      (r) =>
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) ||
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE),
    );
    const isBranch = roles.some((r) => ["AM", "ISG"].includes(r.name));
    // An explicit owner pick shows the PICKED owner's own book (their reporting
    // hierarchy), so ignore the CS->org and AM/ISG->branch visibility expansion
    // on a pick and fall through to the reportee scope instead. Keeps the
    // drilldown in parity with the dashboard summary (resolvePolicyOwnerScope),
    // which scopes an explicit pick the same way. Default (non-pick) scoping is
    // unchanged.
    const effectiveIsOrg = isOrg && !hasExplicitOwnerSelection;
    const effectiveIsBranch = isBranch && !hasExplicitOwnerSelection;
    const isReportee =
      !effectiveLeadership && !effectiveIsOrg && !effectiveIsBranch;

    if (!effectiveLeadership) {
      if (effectiveIsBranch) {
        const branchUsersId = await this.fetchBranchUserIds(
          employeeDetails.branchId
        );
        branchUsersId.forEach((id) => additionalUserIds.add(id));
      }
      if (isReportee) {
        const reporteeUserIds = await this.fetchReporteeUserIds(
          userId,
          options?.recursiveReportees
        );
        reporteeUserIds.forEach((id) => additionalUserIds.add(id));
      }
    }
    if (effectiveIsOrg) {
      const orgUsersId = await this.fetchOrgUserIds(
        employeeDetails.organisationId
      );
      console.log("Org User IDs---:", orgUsersId);
      orgUsersId.forEach((id) => additionalUserIds.add(id));
    }

    if (entity === "opportunity") {
      // const resourceIds = await this.fetchTaggedOprty([
      //   ...additionalUserIds,
      //   userId,
      // ]);
      // const ownerResourceIds = await this.fetchOpportunitiesByOwner([
      //   ...additionalUserIds,
      //   userId,
      // ]);
      // const taskOwnerIds = await this.fetchOpportunitiesByTask([userId]);
      // const uniqueIds = new Set(taggedResourceIds);
      // // Add new IDs to the Set
      // [...resourceIds, ...taskOwnerIds].forEach((id) => uniqueIds.add(id));
      // Update the original array
      // taggedResourceIds.length = 0; // Clear existing
      // taggedResourceIds.push(...uniqueIds);
      const { mode, cleanedSearchArray } =
        await this.extractOwnerUserIdAndCleanSearchArray(
          fetchEntityData.searchArray
        );
      fetchEntityData.searchArray = cleanedSearchArray;
      taggedResourceIds = [
        effectiveLeadership == false ? (isBranch === true ? 1 : 0) : 0,
        employeeDetails.branchId,
        effectiveLeadership == false ? (isReportee === true ? 1 : 0) : 0,
        userId,
        mode == OWNER_TYPES.TEAM ? 1 : 0,
        effectiveLeadership == true ? 1 : 0,
      ];
    } else if (entity === "policy") {
      // entity = policy
      const { mode, cleanedSearchArray } =
        await this.extractOwnerUserIdAndCleanSearchArray(
          fetchEntityData.searchArray
        );
      fetchEntityData.searchArray = cleanedSearchArray;
      taggedResourceIds = [
        effectiveLeadership == false ? (isBranch === true ? 1 : 0) : 0,
        employeeDetails.branchId,
        effectiveLeadership == false
          ? isReportee === true && (mode === OWNER_TYPES.TEAM || !mode)
            ? 1
            : 0
          : 0,
        userId,
        mode == OWNER_TYPES.MANAGER ? 0 : 1,
        effectiveLeadership == true ? 1 : 0,
      ];
    } else {
      const orgUsersId = await this.fetchOrgUserIds(
        employeeDetails.organisationId
      );
      orgUsersId.forEach((id) => additionalUserIds.add(id));
    }
    if (effectiveLeadership == false) {
      fetchEntityData.userFilter = { userId: userId, reporteeUserIds: [] };
      fetchEntityData.userFilter?.reporteeUserIds?.push(...additionalUserIds);
    } else {
      fetchEntityData.userFilter = { userId: null, reporteeUserIds: [] };
      // Remove any "owner.userId" entry from searchArray if present
      if (fetchEntityData.searchArray) {
        fetchEntityData.searchArray = fetchEntityData.searchArray.filter(
          (item) => item.searchBy !== "owner.userId"
        );
      }
    }
    if (taggedResourceIds.length > 0) {
      fetchEntityData.userFilter.tagged = taggedResourceIds;
    }

    if (entity === ENTITY_TYPE_WITH_ORG_LINK.OPPORTUNITY || entity === ENTITY_TYPE_WITH_ORG_LINK.POLICY) {
      // Strip org/branch/lob so dimension IDs never filter against owner/user
      // properties — comparison happens only via entity's own columns in searchArray
      if (fetchEntityData.userFilter) {
        delete fetchEntityData.userFilter.org;
        delete fetchEntityData.userFilter.branch;
        delete fetchEntityData.userFilter.lob;
      }

      const ownerToEntityMap: Record<string, string> = {
        "owner.organisationId": "organisationId",
        "owner.sbuId": "sbuId",
        "owner.verticalId": "verticalId",
        "owner.departmentId": "departmentId",
        "owner.branchId": "branchId",
      };
      fetchEntityData.searchArray = fetchEntityData.searchArray?.map((item) =>
        ownerToEntityMap[item.searchBy]
          ? { ...item, searchBy: ownerToEntityMap[item.searchBy] }
          : item
      );
    }

    return await this.entityService.fetchEntityList(
      fetchEntityData.entity,
      fetchEntityData.page,
      fetchEntityData.limit,
      fetchEntityData.sort,
      fetchEntityData.relations,
      fetchEntityData.where,
      fetchEntityData.select,
      fetchEntityData.searchArray,
      fetchEntityData.userFilter,
      fetchEntityData.searchString,
      fetchEntityData.searchOn,
      fetchEntityData.dateFilter,
      fetchEntityData.period,
      fetchEntityData.preserveCreatedAt,
      fetchEntityData.entityIds,
      fetchEntityData.customWhereCondition,
      fetchEntityData.secondDateFilter,
      fetchEntityData.debugOptions,
      fetchEntityData.funnel
    );
  }

  async extractOwnerUserIdAndCleanSearchArray(
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[]
  ): Promise<{
    mode: typeof OWNER_TYPES.MANAGER | typeof OWNER_TYPES.TEAM | null;
    cleanedSearchArray: typeof searchArray;
  }> {
    if (!searchArray) return { mode: null, cleanedSearchArray: searchArray };

    const ownerEntry = searchArray.find(
      (item) => item.searchBy === "owner.userId"
    );
    if (!ownerEntry) return { mode: null, cleanedSearchArray: searchArray };

    let userIds: number[] = [];
    if (Array.isArray(ownerEntry.searchValue)) {
      userIds = ownerEntry.searchValue.map(Number);
    } else {
      userIds = [Number(ownerEntry.searchValue)];
    }
    let mode = userIds.length === 1 ? OWNER_TYPES.MANAGER : OWNER_TYPES.TEAM;

    const teamViewBy = searchArray.find(
      (item) => item.searchBy === "viewByTeam"
    );
    let cleanedSearchArray;
    if (teamViewBy) {
      mode =
        teamViewBy.searchValue === OWNER_TYPES.MANAGER
          ? OWNER_TYPES.MANAGER
          : OWNER_TYPES.TEAM;
      cleanedSearchArray = searchArray.filter(
        (item) => item.searchBy !== "owner.userId"
      );
      cleanedSearchArray = cleanedSearchArray.filter(
        (item) => item.searchBy !== "viewByTeam"
      );
    } else {
      cleanedSearchArray = searchArray;
    }
    return { mode, cleanedSearchArray };
  }

  async validateResourceScope<T extends ObjectLiteral>(
    userId: number,
    entity: EntityTarget<T>,
    mode: string,
    resourceId: number
  ) {
    const entityInString = entity.toString().toLowerCase();
    const user = await this.dataSource.getRepository<User>(User).findOne({
      where: [{ userId: userId }],
      relations: ["userRoles", "userRoles.role"],
    });
    const employeeDetails = await this.dataSource
      .getRepository(Employee)
      .findOne({
        where: { userId: userId },
      });
    if (!employeeDetails) {
      return false;
    }
    const roles = (user?.userRoles || [])
      .filter((userRole) => userRole?.role) // Filter out undefined roles
      .map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey
      }));

    if (
      roles.some(
        (r) =>
          r.roleKey === ROLE_KEY.ROLE_LEADERSHIP ||
          isSuperUserRole(r.roleKey),
      )
    ) {
      return true;
    }

    // Access to the full Company Details PAGE is restricted to the company's
    // own Lead CRM (and that Lead CRM's reportee hierarchy), Associate CRM,
    // and Account Manager - not everyone in the requester's organisation
    // (the org-wide `fetchOrgUserIds` branch below, kept for the plain
    // "view" mode used by lighter-weight lookups such as
    // getCompanyBasicDetails that auto-populate company info in unrelated
    // entities' forms, e.g. Contact/Opportunity creation).
    if (
      mode === "view-company-details-page" &&
      entityInString === ENTITY_NAME.COMPANY
    ) {
      return this.validateCompanyViewAccess(resourceId, userId);
    }

    for (const role of roles) {
      let additionalUserIds: number[] = [];
      let taggedResourceIds: number[] = [];
      if (mode === "view") {
        if (entityInString !== "opportunity") {
          additionalUserIds = await this.fetchOrgUserIds(
            employeeDetails.organisationId
          );
        } else {
          if (["AM", "ISG"].includes(role.name)) {
            additionalUserIds = await this.fetchBranchUserIds(
              employeeDetails.branchId
            );
          } else if(role.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) || role.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE)) {
            additionalUserIds = await this.fetchOrgUserIds(employeeDetails.organisationId);
          } else {
            additionalUserIds = await this.fetchReporteeUserIds(userId);
          }
          const resourceIds = await this.fetchTaggedOprty([
            ...additionalUserIds,
            userId,
          ]);

          const ownerResourceIds = await this.fetchOpportunitiesByOwner([
            ...additionalUserIds,
            userId,
          ]);

          const taskOwnerIds = await this.fetchOpportunitiesByTask([userId]);
          console.log("resourceIds", resourceIds.length);
          console.log("ownerResourceIds", ownerResourceIds.length);
          console.log("taskOwnerIds", taskOwnerIds.length);
          ownerResourceIds.push(...resourceIds, ...taskOwnerIds);
          taggedResourceIds = ownerResourceIds;
          // taggedResourceIds.push(
          //   ...resourceIds,
          //   ...ownerResourceIds,
          //   ...taskOwnerIds
          // );
        }
      } else {
        if (entityInString === "opportunity") {
          
          if (role.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) || role.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE)) {
            additionalUserIds = await this.fetchOrgUserIds(employeeDetails.organisationId);
          } else {
            additionalUserIds = await this.fetchReporteeUserIds(userId);
          }

          const resourceIds = await this.fetchTaggedOprty([
            ...additionalUserIds,
            userId,
          ]);

          const ownerResourceIds = await this.fetchOpportunitiesByOwner([
            ...additionalUserIds,
            userId,
          ]);

          const taskOwnerIds = await this.fetchOpportunitiesByTask([userId]);

          console.log("resourceIds", resourceIds);
          console.log("ownerResourceIds", ownerResourceIds);
          console.log("taskOwnerIds", taskOwnerIds);
          ownerResourceIds.push(...resourceIds, ...taskOwnerIds);
          taggedResourceIds = ownerResourceIds;
          // taggedResourceIds.push(
          //   ...resourceIds,
          //   ...ownerResourceIds,
          //   ...taskOwnerIds
          // );
        } else if (["broker", "insurer", "tpa"].includes(entityInString)) {
          additionalUserIds = await this.fetchOrgUserIds(
            employeeDetails.organisationId
          );
        } else {
          if (["AM", "ISG"].includes(role.name)) {
            additionalUserIds = await this.fetchBranchUserIds(
              employeeDetails.branchId
            );
          } else {
            additionalUserIds = await this.fetchReporteeUserIds(userId);
          }
        }
      }
      if (
        taggedResourceIds.length > 0 &&
        taggedResourceIds.includes(resourceId)
      ) {
        return true;
      }
      let access = 0,
        allUsersList: number[] = [userId, ...additionalUserIds];
      const queryBuilder = this.dataSource
        .getRepository(entity)
        .createQueryBuilder("main")
        .where("main.id = :resourceId", { resourceId })
        .andWhere("main.createdBy IN (:...userIds)", {
          userIds: allUsersList,
        });

      if (entity.toString().toLowerCase() === ENTITY_NAME.COMPANY) {
        queryBuilder.orWhere("main.leadCrm IN (:...userIdsData)", {
          userIdsData: allUsersList,
        });
        queryBuilder.orWhere(
          "main.accountManager = :assignedUserId OR main.associateCrmId = :assignedUserId",
          { assignedUserId: userId }
        );
      }
      if (entity.toString().toLowerCase() === ENTITY_NAME.POLICY) {
        queryBuilder.orWhere("main.ownerId IN (:...bdUserIdsData)", {
          bdUserIdsData: allUsersList,
        });
        queryBuilder.orWhere("main.isgId IN (:...isgUserIdsData)", {
          isgUserIdsData: allUsersList,
        });
        queryBuilder.orWhere("main.amId IN (:...amUserIdsData)", {
          amUserIdsData: allUsersList,
        });
      }
      access = await queryBuilder.getCount();
      if (access > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Fetches user IDs based on reporting hierarchy.
   * @param userId - The ID of the user whose reportees are to be fetched.
   * @returns An array of user IDs that report to the specified user.
   **/
  async fetchReporteeUserIds(
    userId: number,
    recursive = false
  ): Promise<number[]> {
    // Opt-in whole-subtree mode. `employee_hierarchy` holds only DIRECT edges
    // (user_id -> reporting_user_id), so the default read below returns a
    // user's immediate reports and nothing deeper. That is the historical
    // meaning of "Manager + Team" for every caller, so it stays the default.
    //
    // Client Portfolio Enhanced needs the full downline instead: its Owner
    // cards enumerate the recursive tree (getNewEmployeeHierarchyByUserId),
    // and a senior manager who personally owns nothing would otherwise show an
    // empty card while their whole organisation's book sat one level below.
    // This walks users.reporting_user_id — the SAME source and the same
    // user_type_key filter as getNewEmployeeHierarchyByUserId in
    // policy.repository.ts, which is the canonical copy of this traversal — so
    // the cards and the listing cannot disagree on who is in a team.
    if (recursive) {
      const rows = await this.dataSource.query(
        `WITH RECURSIVE downline AS (
           SELECT id FROM users WHERE id = $1
           UNION ALL
           SELECT t.id
           FROM users t
           JOIN downline d ON t.reporting_user_id = d.id
           AND t.user_type_key IN (
             'USER_TYPE_IIRM_EMPLOYEE',
             'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'
           )
         )
         SELECT id FROM downline WHERE id <> $1`,
        [userId]
      );
      return (rows ?? [])
        .map((row: { id: number }) => Number(row.id))
        .filter((id: number) => Number.isFinite(id));
    }
    const repository = this.dataSource.getRepository(EmployeeHierarchy);
    const userDetails = await repository.find({
      where: { reportingUserId: userId },
      select: ["userId"],
    });
    const userIds = userDetails.map((user) => {
      return user.userId;
    });
    return userIds;
  }

  private async validateCompanyViewAccess(
    companyId: number,
    userId: number
  ): Promise<boolean> {
    const company = await this.dataSource
      .getRepository(ENTITY_NAME.COMPANY)
      .createQueryBuilder("main")
      .select([
        "main.id",
        "main.leadCrm",
        "main.accountManager",
        "main.associateCrmId",
      ])
      .where("main.id = :companyId", { companyId })
      .getOne();

    if (!company) {
      return false;
    }

    if (company.accountManager != null && userId === company.accountManager) {
      return true;
    }
    if (company.associateCrmId != null && userId === company.associateCrmId) {
      return true;
    }
    if (company.leadCrm != null) {
      const leadCrmManagerChain = await this.getNewEmployeeHierarchyByUserId(
        company.leadCrm,
        true
      );
      if (leadCrmManagerChain.some((manager) => manager.userId === userId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves the same owner scope the policy LISTING applies for an explicit
   * owner selection (owner.userId + viewByTeam in validateOpportunityScope /
   * applyCommonfilterForPolicy), so aggregate endpoints (dashboard widgets)
   * can filter policies identically to getAllPolicies:
   *   - memberIds: users matched against policy.createdBy / policy.ownerId
   *     (selected user, plus their scope members in team mode);
   *   - participantScope: inputs for the policy_participant_map subquery.
   * Leadership users are scoped like any other owner here — an explicit
   * selection always overrides the leadership org-wide bypass.
   */
  async resolvePolicyOwnerScope(
    userId: number,
    mode: string = OWNER_TYPES.TEAM,
    // When true (a specific owner was explicitly picked), scope to what the
    // picked owner OWNS — themselves plus their reporting hierarchy in team mode
    // — ignoring the role-based visibility expansion. A CS role can SEE the whole
    // org, but when inspecting a picked owner we want only the policies
    // attributed to them, not everything they can view.
    ownershipOnly = false
  ): Promise<{
    memberIds: number[];
    participantScope: {
      isBranch: boolean;
      branchId: number | null;
      isReportee: boolean;
      reportingUserId: number;
    };
  }> {
    if (ownershipOnly) {
      // Manager view: only the picked owner's own book. Team view: the picked
      // owner plus their reportees — resolved with the SAME method the drilldown
      // listing uses for an explicit pick (validateOpportunityScope's reportee
      // scope -> fetchReporteeUserIds), so the dashboard summary and the listing
      // scope to an identical member set.
      if (mode === OWNER_TYPES.MANAGER) {
        return {
          memberIds: [userId],
          participantScope: {
            isBranch: false,
            branchId: null,
            isReportee: false,
            reportingUserId: userId,
          },
        };
      }
      const reporteeUserIds = await this.fetchReporteeUserIds(userId);
      const memberIds = [...new Set([userId, ...reporteeUserIds])];
      return {
        memberIds,
        participantScope: {
          isBranch: false,
          branchId: null,
          isReportee: true,
          reportingUserId: userId,
        },
      };
    }

    const employeeDetails = await this.getEmployeeDetails(userId);
    const user = await this.getUserWithRoles(userId);
    const roles = (user?.userRoles || [])
      .filter((userRole: any) => userRole?.role)
      .map((userRole: any) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));

    const isOrg = roles.some(
      (r: any) =>
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) ||
        r.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE)
    );
    const isBranch = roles.some((r: any) => ["AM", "ISG"].includes(r.name));
    const isReportee = !isOrg && !isBranch;

    const additionalUserIds: Set<number> = new Set();
    if (isBranch && employeeDetails?.branchId != null) {
      const branchUserIds = await this.fetchBranchUserIds(
        employeeDetails.branchId
      );
      branchUserIds.forEach((id) => additionalUserIds.add(id));
    }
    if (isReportee) {
      const reporteeUserIds = await this.fetchReporteeUserIds(userId);
      reporteeUserIds.forEach((id) => additionalUserIds.add(id));
    }
    if (isOrg && employeeDetails?.organisationId != null) {
      const orgUserIds = await this.fetchOrgUserIds(
        employeeDetails.organisationId
      );
      orgUserIds.forEach((id) => additionalUserIds.add(id));
    }

    const memberIds =
      mode === OWNER_TYPES.MANAGER
        ? [userId]
        : [...new Set([userId, ...additionalUserIds])];

    return {
      memberIds,
      participantScope: {
        isBranch,
        branchId: employeeDetails?.branchId ?? null,
        isReportee: isReportee && mode !== OWNER_TYPES.MANAGER,
        reportingUserId: userId,
      },
    };
  }

    /**
   * Fetches user IDs based on direct reporting.
   * @param userId - The ID of the user whose direct reportees are to be fetched.
   * @returns An array of user IDs that directly report to the specified user.
   **/

  async fetchDirectReporteeUserIds(userId: number): Promise<number[]> {
    const repository = this.dataSource.getRepository(Employee);
    const userDetails = await repository.find({
      where: { reportingUserId: userId },
      select: ["userId"],
    });
    let userIds = userDetails.map((user) => {
      return user.userId;
    });

    userIds.push(userId); // Including self userId
    userIds = [...new Set(userIds)]; // Ensure uniqueness after adding self
    return userIds;
  }


  /**
   * Retrieves hierarchical user details for a manager and their reportees.
   * @param userId - The ID of the manager or employee.
   * @param parentFlag - If true, fetches parent hierarchy instead of children.
   * @returns Array of users within the hierarchy with metadata.
   */
  async getNewEmployeeHierarchyByUserId(
    userId: number,
    parentFlag = false
  ): Promise<UserHierarchyItem[]> {
    const joinString = parentFlag
      ? "t.id = h.reporting_user_id"
      : "t.reporting_user_id = h.id";
    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, first_name, last_name, 0 AS Level,
          organisation_id, sbu_id, vertical_id, department_id, branch_id
        FROM users WHERE id = ${userId}

        UNION ALL

        SELECT t.id, t.reporting_user_id, t.first_name, t.last_name, h.Level + 1,
          t.organisation_id, t.sbu_id, t.vertical_id, t.department_id, t.branch_id
        FROM users t
        JOIN HierarchyCTE h ON ${joinString}
        AND t.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
      )
      SELECT id, reporting_user_id, first_name, last_name, Level,
        organisation_id, sbu_id, vertical_id, department_id, branch_id
      FROM HierarchyCTE
      ORDER BY Level, id
    `;
    const dataRows = await this.dataSource.query(rawSqlString);
    if (!dataRows || dataRows.length === 0) {
      return [];
    }
    return dataRows.map((row: any) => ({
      userId: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      reportingUserId: row.reporting_user_id,
      level: row.level,
      organisationId: row.organisation_id,
      sbuId: row.sbu_id,
      verticalId: row.vertical_id,
      departmentId: row.department_id,
      branchId: row.branch_id,
    }));
  }

  /**
   * Get the closest parent user who has the specified privilege.
   */
  async getParentUserWithPrivilege(
    userId: number,
    aclCategoryKey: string,
    aclActionKey: string
  ): Promise<UserHierarchyItem | null> {
    // First get the parent hierarchy for this user.
    const parentHierarchy = await this.getNewEmployeeHierarchyByUserId(
      userId,
      true
    );
    if (!parentHierarchy || parentHierarchy.length === 0) {
      // No parent hierarchy found, so no parents can have the privilege
      return null;
    }

    const parentIds = parentHierarchy
      .filter((u) => u.userId !== userId)
      .map((u) => u.userId);
    if (parentIds.length === 0) {
      return null;
    }
    const parentIdStr = parentIds.join(",");

    // Find users with the given privilege from within parentIds -
    // those users who have the corresponding roles that are in turn mapped to aclCategory & aclAction
    const rawQuery = `
      SELECT DISTINCT ur.user_id AS "userId"
      FROM user_role ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_acl_category_action_map racam ON r.id = racam.role_id
      JOIN acl_category_action_map acam ON racam.acl_category_action_id = acam.id
      JOIN acl_categories ac ON acam.acl_category_id = ac.id
      JOIN acl_actions aa ON acam.acl_action_id = aa.id
      WHERE ur.user_id IN (${parentIdStr})
      AND ac.category_key = '${aclCategoryKey}'
      AND aa.action_key = '${aclActionKey}'
    `;
    const usersWithPrivilege = await this.dataSource.query(rawQuery);
    if (!usersWithPrivilege || usersWithPrivilege.length === 0) {
      return null;
    }

    // Lets process the usersWithPrivilege and find the user at the lowest level
    // with the privilege. The original user's level is 0 and can be skipped
    // const privilegedUserIdsSet = new Set(usersWithPrivilege.map(row => row.userId));

    const parentObj = parentHierarchy.find((user) =>
      usersWithPrivilege.find((parentUser) => parentUser.userId === user.userId)
    );
    return parentObj || null;
  }

  /**
   * Fetches user IDs based on branch ID.
   * @param branchId - The ID of the branch whose users are to be fetched.
   * @returns An array of user IDs that belong to the specified branch.
   **/
  async fetchBranchUserIds(branchId: number): Promise<number[]> {
    const repository = this.dataSource.getRepository(User);
    const userDetails = await repository.find({
      where: { branchId: branchId },
      select: ["userId"],
    });
    const userIds = userDetails.map((user) => {
      return user.userId;
    });
    return userIds as number[];
  }

  /**
   * Fetches user IDs based on organization ID.
   * @param orgId - The ID of the organization whose users are to be fetched.
   * @returns An array of user IDs that belong to the specified organization.
   **/
  async fetchOrgUserIds(orgId: number): Promise<number[]> {
    const repository = this.dataSource.getRepository(Employee);
    const userDetails = await repository.find({
      where: { organisationId: orgId },
      select: ["userId"],
    });
    const userIds = userDetails.map((user) => {
      return user.userId;
    });
    return userIds;
  }

  /**
   * Fetches opportunity IDs based on tagged user IDs.
   * @param userIds - An array of user IDs that are tagged in opportunities.
   * @returns An array of opportunity IDs that the specified users are tagged in.
   **/
  async fetchTaggedOprty(userIds: number[]): Promise<number[]> {
    const repository = this.dataSource.getRepository(
      OpportunityActivityParticipants
    );
    const userDetails = await repository.find({
      where: { participantId: In(userIds) },
      select: ["opportunityId"],
    });
    const opportunityIds = userDetails.map((user) => {
      return user.opportunityId;
    });
    return opportunityIds;
  }

  /**
   * Fetches distinct opportunity IDs based on owner IDs.
   * @param ownerIds - An array of owner IDs that are associated with opportunities.
   * @returns An array of distinct opportunity IDs that the specified owners are associated with.
   **/
  async fetchOpportunitiesByOwner(ownerIds: number[]): Promise<number[]> {
    const repository = this.dataSource.getRepository(OpportunityActivityMap);

    const ownerDetails = await repository
      .createQueryBuilder("opportunityActivityMap")
      .select("DISTINCT opportunityActivityMap.opportunityId", "opportunityId")
      .where("opportunityActivityMap.ownerId IN (:...ownerIds)", { ownerIds })
      .getRawMany();

    const opportunityIds = ownerDetails.map((owner) => owner.opportunityId);
    return opportunityIds;
  }

  async fetchOpportunitiesByTask(ownerIds: number[]): Promise<number[]> {
    const repository = this.dataSource.getRepository(Task);

    const ownerDetails = await repository
      .createQueryBuilder("task")
      .select("DISTINCT task.opportunityId", "opportunityId")
      .where("task.assigneeId IN (:...ownerIds)", { ownerIds })
      .getRawMany();

    const opportunityIds = ownerDetails.map((owner) => owner.opportunityId);
    return opportunityIds;
  }
  async fetchContactIdsByOrganisation(
    countryId: number,
    contactRecordTypeLid: number
  ): Promise<number[]> {
    const lookupRepository = this.dataSource.getRepository(LookUp);
    const contactRecordTypeLookup = await lookupRepository.findOne({
      where: { id: contactRecordTypeLid } as any,
      select: ["id", "lookUpKey"],
    });
    if (!contactRecordTypeLookup) {
      return [];
    }
    const recordType =
      CONTACT_RECORD_TYPE_MAP[
        contactRecordTypeLookup.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
      ];
    let contactIds: number[] = [];
    if (recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE) {
      const contactMapRepository = await this.dataSource.getRepository(
        "company_contact_map"
      );
      const contactMaps = await contactMapRepository
        .createQueryBuilder("ccm")
        .leftJoin("company", "company", "company.id = ccm.company_id")
        .leftJoin("contact", "contact", "contact.id = ccm.contact_id")
        .where("contact.contact_record_type_lid = :contactRecordTypeLid", {
          contactRecordTypeLid,
        })
        .andWhere("company.country_id = :countryId", { countryId })
        .orderBy("ccm.contact_id")
        .select("ccm.contact_id", "contact_id")
        .getRawMany();

      contactIds = contactMaps.map((row) => row.contact_id);
    } else if (
      recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
    ) {
      const insurerContactRepository = await this.dataSource.getRepository(
        "insurer_contact"
      );
      const insurerContactMaps = await insurerContactRepository
        .createQueryBuilder("ic")
        .leftJoin("insurer", "insurer", "insurer.id = ic.insurer_id")
        .leftJoin("contact", "contact", "contact.id = ic.contact_id")
        .where("contact.contact_record_type_lid = :contactRecordTypeLid", {
          contactRecordTypeLid,
        })
        .andWhere("insurer.country_id = :countryId", { countryId })
        .orderBy("ic.contact_id")
        .select("ic.contact_id", "contact_id")
        .getRawMany();

      contactIds = insurerContactMaps.map((row) => row.contact_id);
    } else if (
      recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
    ) {
      const brokerContactRepository = await this.dataSource.getRepository(
        "broker_contact"
      );
      const brokerContactMaps = await brokerContactRepository
        .createQueryBuilder("bc")
        .leftJoin("broker", "broker", "broker.id = bc.broker_id")
        .leftJoin("contact", "contact", "contact.id = bc.contact_id")
        .where("contact.contact_record_type_lid = :contactRecordTypeLid", {
          contactRecordTypeLid,
        })
        .andWhere("broker.country_id = :countryId", { countryId })
        .orderBy("bc.contact_id")
        .select("bc.contact_id", "contact_id")
        .getRawMany();

      contactIds = brokerContactMaps.map((row) => row.contact_id);
    } else if (recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE) {
      const tpaContactRepository = await this.dataSource.getRepository(
        "tpa_contact"
      );
      const tpaContactMaps = await tpaContactRepository
        .createQueryBuilder("tc")
        .leftJoin("tpa", "tpa", "tpa.id = tc.tpa_id")
        .leftJoin("contact", "contact", "contact.id = tc.contact_id")
        .where("contact.contact_record_type_lid = :contactRecordTypeLid", {
          contactRecordTypeLid,
        })
        .andWhere("tpa.country_id = :countryId", { countryId })
        .orderBy("tc.contact_id")
        .select("tc.contact_id", "contact_id")
        .getRawMany();

      contactIds = tpaContactMaps.map((row) => row.contact_id);
    }
    return contactIds;
  }
}
