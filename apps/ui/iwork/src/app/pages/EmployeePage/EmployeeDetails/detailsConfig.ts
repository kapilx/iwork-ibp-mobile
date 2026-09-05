import {
  Employee,
  EmployeeHiracy,
  EmployeeNode,
} from "../EmployeeListing/types";

export const generateEmployeeReporteeFields = (reportees: Employee[] = []) => [
  { headerName: "First name", field: "firstName" },
  { headerName: "Last name", field: "lastName" },
  { headerName: "Email", field: "emailId" },
  { headerName: "Mobile", field: "mobile" },
  {
    headerName: "Employee id",
    field: "iirmEmpId",
    valueGetter: (params: any) => params.data?.employeeId || "--",
  },
  {
    headerName: "Organization",
    field: "organization.name",
    valueGetter: (params: any) => params.data?.organisation?.name || "--",
  },
  {
    headerName: "Department",
    field: "department.name",
    valueGetter: (params: any) => params.data?.department?.name || "--",
  },
  {
    headerName: "Designation",
    field: "designation.name",
    valueGetter: (params: any) => params.data?.designation?.name || "--",
  },
  {
    headerName: "Branch",
    field: "branch.name",
    valueGetter: (params: any) => params.data?.branch?.name || "--",
  },
  {
    headerName: "Role",
    field: "role",
    valueGetter: (params: any) => params.data?.roles || "--",
  },
  {
    headerName: "Location",
    field: "location.name",
    valueGetter: (params: any) => params.data?.location?.name || "--",
  },
  {
    headerName: "Status",
    field: "status.lookUpValue",
    valueGetter: (params: any) => params.data?.status?.lookUpValue || "--",
  },
  {
    headerName: "Iwork role",
    field: "iworkRole.lookUpValue",
    valueGetter: (params: any) => params.data?.iworkRole?.lookUpValue || "--",
  },
  {
    headerName: "SBU",
    field: "sbu.name",
    valueGetter: (params: any) => params.data?.sbu?.name || "--",
  },
  {
    headerName: "Vertical",
    field: "vertical.name",
    valueGetter: (params: any) => params.data?.vertical?.name || "--",
  },
];

export const employeeInfoFieldGroup = [
  {
    sectionTitle: "Employee info",
    fields: [
      { label: "First name", key: "firstName" },
      { label: "Last name", key: "lastName" },
      { label: "Email", key: "emailId" },
      { label: "Mobile", key: "mobile" },
      { label: "Employee id", key: "iirmEmpId" },
      { label: "User id", key: "userId" },
      { label: "Organization", key: "organisation.name" },
      { label: "Department", key: "department.name" },
      { label: "Designation", key: "designation.name" },
      { label: "Iwork role", key: "iworkRole.lookUpValue" },
      { label: "Branch", key: "branch.name" },
      { label: "Role", key: "role" },
      { label: "Location", key: "location.name" },
      { label: "Status", key: "status.lookUpValue" },
      { label: "SBU", key: "sbu.name" },
      { label: "Vertical", key: "vertical.name" },
    ],
  },
  {
    sectionTitle: "Reporting to",
    fields: [
      { label: "First name", key: "reportingTo.firstName" },
      { label: "Last name", key: "reportingTo.lastName" },
      { label: "Email", key: "reportingTo.emailId" },
      { label: "Mobile", key: "reportingTo.mobile" },
      { label: "Employee id", key: "reportingTo.employeeId" },
      { label: "Organization", key: "reportingTo.organisation.name" },
      { label: "Designation", key: "reportingTo.designation.name" },
      { label: "Department", key: "reportingTo.department.name" },
      { label: "Iwork role", key: "reportingTo.iworkRole.lookUpValue" },
      { label: "Branch", key: "reportingTo.branch.name" },
      { label: "Role", key: "role" },
      // { label: "Iwork role", key: "reportingTo.iworkRole.lookUpValue" },
      { label: "Location", key: "reportingTo.location.name" },
      { label: "Status", key: "reportingTo.status.lookUpValue" },
      { label: "SBU", key: "reportingTo.sbu.name" },
      { label: "Vertical", key: "reportingTo.vertical.name" },
    ],
  },
];
export const companyBreadcrumbs = (firstName?: string, employeeData?: any) => [
  {
    label: "Manage employee",
    path: "/employee",
    state: { filters: employeeData },
  },
  { label: firstName || "Employee details" },
];

export const employeeSummaryCard = [
  {
    fields: [
      // { label: "Employee name", key: "employeeName" },
      { label: "Employee id", key: "employeeID" },
      { label: "User id", key: "userId" },
      {
        label: "Department",
        key: "department",
        renderAsChip: true,
      },
      { label: "Designation", key: "designation" },
      { label: "role", key: "role" },
    ],
    itemStyles: {
      display: "flex",
    },
    customStyles: {
      marginTop: 0,
    },
  },
];

export const buildEmployeeTree = (
  flatData: EmployeeHiracy[]
): EmployeeNode[] => {
  const lookup: { [key: number]: EmployeeNode } = {};
  const tree: EmployeeNode[] = [];

  // Initialize the lookup map
  flatData.forEach((emp) => {
    lookup[emp.userId] = {
      label: `${emp.firstName} ${emp.lastName}`,
      id: emp.userId.toString(),
      children: [],
    };
  });

  flatData.forEach((emp) => {
    const node = lookup[emp.userId];
    if (emp.reportingUserId === null) {
      tree.push(node);
    } else {
      const parent = lookup[emp.reportingUserId];
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return tree;
};
