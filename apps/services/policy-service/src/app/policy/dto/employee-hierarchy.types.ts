export interface EmployeeHierarchyNode {
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
