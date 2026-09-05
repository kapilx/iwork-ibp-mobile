import { getSessionStorageData } from "@ui/ui-lib";

// Role gate for the Enhanced pages' org drilldown: leadership/superusers see
// the IIRM Holdings root summary and may change the Organisation level;
// everyone else has it locked to their own org. The session user's roles
// carry names only (no roleKey), so match by name — same heuristic as
// hasHighAccessRoleSelected in EmployeePage/EmployeeForm/addEmployee.
export const getOrgScopeAccess = (): {
  isPrivileged: boolean;
  userOrganisationId: number | null;
} => {
  const userData = getSessionStorageData("user");
  const roles: Array<{ name?: string }> = Array.isArray(userData?.roles)
    ? userData.roles
    : [];
  const isPrivileged = roles.some((role) => {
    const name = role?.name?.trim().toUpperCase() ?? "";
    return name.includes("LEADERSHIP") || name.includes("SUPER USER");
  });
  const orgId = Number(userData?.organisationId);
  return {
    isPrivileged,
    userOrganisationId: Number.isFinite(orgId) && orgId > 0 ? orgId : null,
  };
};
