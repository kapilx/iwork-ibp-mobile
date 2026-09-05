export interface TestFormRef {
  handleEdit: (rowData: Record<string, any>) => void;
}

export interface Employee {
  employeeId?: number;
  firstName?: string;
  emailId?: string;
}

export interface ApiResponse {
  data?: {
    data?: Employee[];
  };
}

export interface Location {
  id: number;
  name: string;
}

export interface LocationApiResponse {
  data?: {
    data?: Location[];
  };
}

export interface RoleApiResponse {
  data?: {
    data?: Role[];
  };
}

export interface Role {
  id: number;
  name: string;
  roleKey?: string;
}

export interface Organisation {
  id: number;
  name: string;
  key?: string;
}

export interface OrganisationApiResponse {
  data?: {
    data?: Organisation[];
  };
}

export interface IEmployeeForm {
  salutationLid: string;
  firstName: string;
  lastName: string;
  emailId: string;
  mobile: string;
  designationId: string;
  organisationId: string;
  verticalId: string;
  departmentId: string;
  branchId: string;
  reportingManagerEmployeeId: string;
  statusLid: string;
  iirmEmpId: string;
  roles: number[];
  loginName: string;
  dateOfJoining?: string;
  dateOfBirth?: string;
}

export interface MasterData {
  id: number;
  name: string;
  firstName: string;
  value: string;
}

export interface MasterApiResponse {
  data: {
    data: MasterData[];
  };
}

export interface MasterUserResponse {
  data: {
    data: {
      userId: number;
      firstName: string;
      branch: {
        id: number;
        name: string;
      };
    }[];
  };
}
