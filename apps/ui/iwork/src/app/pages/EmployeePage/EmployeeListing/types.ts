export interface LookUp {
  id: number;
  lookUpValue: string;
}

export interface CommonMasterData {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  roleId: number;
  roleName: string;
}

interface RevealMeta {
  table: string;
  field: string;
  id: number;
}

export interface Employee {
  employeeId: number;
  iirmEmpId: number;
  firstName: string;
  lastName: string;
  emailId: string;
  emailId_reveal?: RevealMeta;
  mobile: string;
  mobile_reveal?: RevealMeta;
  userId: number;
  salutation: LookUp;
  status: LookUp;
  designation?: CommonMasterData | null;
  department?: CommonMasterData | null;
  organisation?: CommonMasterData | null;
  branch?: CommonMasterData | null;
  vertical?: CommonMasterData | null;
  reportingManager?: LookUp | null;
  userRoles?: Role[] | null;
  loginName?: string | null;
  password?: string | null;
  sbu?: CommonMasterData | null;
}

export interface EmployeeWithReporting extends Employee {
  reportingTo: Employee | null;
  reportees: Employee[];
}

export interface EmployeeHiracy {
  userId: number;
  firstName: string;
  lastName: string;
  reportingUserId: number | null;
  level: number;
  organisationId: number | null;
  verticalId: number | null;
  departmentId: number;
  branchId: number;
}

export interface EmployeeNode {
  label: string;
  id: string;
  children: EmployeeNode[];
}

// One entry in an employee's ordered reporting chain (root manager -> ... ->
// the employee), as returned by GET/POST /employee/reporting-chain.
export interface ReportingChainEntry {
  userId: number;
  firstName: string;
  lastName: string;
}
