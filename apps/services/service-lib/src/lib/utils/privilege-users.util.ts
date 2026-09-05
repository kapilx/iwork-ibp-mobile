import { DataSource } from "typeorm";

export const getAllUsersWithPrivilege = async (
  dataSource: Pick<DataSource, "query">,
  aclCategoryKey: string,
  aclActionKey: string,
  page: number,
  limit: number,
  ignoreSuperUser: boolean = false,
  organisationId?: number
): Promise<any[]> => {
  const superUserCondition = ignoreSuperUser
    ? "AND r.role_key <> 'ROLE_SUPER_USER'"
    : "";
  const organisationCondition = organisationId
    ? `AND u.organisation_id = ${organisationId}`
    : "";
  const rawQuery = `
      SELECT DISTINCT ur.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.reporting_user_id AS reportingUserId,
        u.organisation_id AS organisationId,
        u.sbu_id AS sbuId,
        u.vertical_id AS verticalId,
        u.department_id AS departmentId,
        u.branch_id AS branchId,
        dg.name AS designationName,
        dg.grade_level as gradeLevel
      FROM user_role ur
      JOIN users u ON ur.user_id = u.id
      JOIN org_designation dg ON u.designation_id = dg.id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_acl_category_action_map racam ON r.id = racam.role_id
      JOIN acl_category_action_map acam ON racam.acl_category_action_id = acam.id
      JOIN acl_categories ac ON acam.acl_category_id = ac.id
      JOIN acl_actions aa ON acam.acl_action_id = aa.id
      WHERE ac.category_key = '${aclCategoryKey}'
        AND aa.action_key = '${aclActionKey}'
        AND u.status_lid = (
        SELECT id FROM lookup_data WHERE lookup_key = 'USER_STATUS_ACTIVE'
        )
        ${organisationCondition}
        ${superUserCondition}
      ORDER BY dg.grade_level ASC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
  const usersWithPrivilege = await dataSource.query(rawQuery);
  return usersWithPrivilege && usersWithPrivilege.length > 0
    ? usersWithPrivilege
    : [];
};

/**
 * Check if a single user has a specific privilege
 * @param dataSource - TypeORM DataSource for executing queries
 * @param userId - The user ID to check
 * @param aclCategoryKey - The ACL category key
 * @param aclActionKey - The ACL action key
 * @returns boolean - true if user has the privilege, false otherwise
 */
export const checkUserHasPrivilege = async (
  dataSource: Pick<DataSource, "query">,
  userId: number,
  aclCategoryKey: string,
  aclActionKey: string
): Promise<boolean> => {
  const rawQuery = `
    SELECT DISTINCT ur.user_id AS userId
    FROM user_role ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_acl_category_action_map racam ON r.id = racam.role_id
    JOIN acl_category_action_map acam ON racam.acl_category_action_id = acam.id
    JOIN acl_categories ac ON acam.acl_category_id = ac.id
    JOIN acl_actions aa ON acam.acl_action_id = aa.id
    WHERE ur.user_id = ${userId}
      AND ac.category_key = '${aclCategoryKey}'
      AND aa.action_key = '${aclActionKey}'
    LIMIT 1
  `;
  const result = await dataSource.query(rawQuery);
  return result && result.length > 0;
};
