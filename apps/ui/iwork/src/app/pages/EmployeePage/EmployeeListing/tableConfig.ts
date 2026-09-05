import { ColDef, ValueGetterParams } from "ag-grid-community";
import {
  FormFieldConfig,
  endPoints,
  masterDataUtilitySearchFunction,
} from "@ui/ui-lib";
import { Employee } from "./types";
import RevealCellRenderer from "./RevealCellRenderer";
import DeactivateCellRenderer from "./DeactivateCellRenderer";
import ReportingHierarchyCellRenderer from "./ReportingHierarchyCellRenderer";

/**
 * Returns the employee table columns, with the deactivate action bound to
 * the provided callback so the cell renderer can invoke it.
 */
export const getColumns = (
  onDeactivateClick: (rowData: any) => void,
  onActivateClick: (rowData: any) => void
): ColDef<Employee>[] => [
  {
    headerName: "Employee id",
    field: "iirmEmpId",
    cellClass: "clickable-cell",
    tooltipField: "iirmEmpId",
    headerTooltip: "Employee id",
  },
  {
    headerName: "User id",
    field: "userId",
    tooltipField: "userId",
    headerTooltip: "User id",
  },
  {
    headerName: "First name",
    field: "firstName",
    tooltipField: "firstName",
    headerTooltip: "First name",
  },
  {
    headerName: "Last name",
    field: "lastName",
    tooltipField: "lastName",
    headerTooltip: "Last name",
  },
  {
    headerName: "Reporting Hierarchy",
    field: "reportingChain",
    colId: "reportingHierarchy",
    // Wide enough for up to 10 avatars (the full-chain-inline threshold in
    // ReportingHierarchyCellRenderer) plus their arrow separators.
    minWidth: 420,
    sortable: false,
    filter: false,
    cellRenderer: ReportingHierarchyCellRenderer,
    headerTooltip: "Reporting Hierarchy",
    tooltipValueGetter: () => null,
  },
  {
    headerName: "Email",
    field: "emailId",
    headerTooltip: "Email",
    cellRenderer: RevealCellRenderer,
    minWidth: 200,
  },
  {
    headerName: "Mobile",
    field: "mobile",
    headerTooltip: "Mobile",
    cellRenderer: RevealCellRenderer,
    minWidth: 160,
  },
  {
    headerName: "Designation",
    tooltipField: "designation.name",
    headerTooltip: "Designation",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.designation?.name || "—",
    colId: "designation",
  },
  {
    headerName: "Organisation",
    tooltipField: "organisation.name",
    headerTooltip: "Organisation",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.organisation?.name || "—",
    colId: "organisation",
  },
  {
    headerName: "SBU",
    tooltipField: "sbu.name",
    headerTooltip: "SBU",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.sbu?.name || "—",
    colId: "sbu",
  },
  {
    headerName: "Vertical",
    tooltipField: "vertical.name",
    headerTooltip: "Vertical",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.vertical?.name || "—",
    colId: "vertical",
  },
  {
    headerName: "Department",
    tooltipField: "department.name",
    headerTooltip: "Department",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.department?.name || "—",
    colId: "department",
  },
  {
    headerName: "Branch",
    tooltipField: "branch.name",
    headerTooltip: "Branch",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.branch?.name || "—",
    colId: "branch",
  },
  {
    headerName: "Status",
    tooltipField: "status.lookUpValue",
    headerTooltip: "Status",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.status?.lookUpValue || "—",
    colId: "status",
  },
  {
    headerName: "Role(s)",
    tooltipField: "userRoles",
    headerTooltip: "Role(s)",
    valueGetter: (params: ValueGetterParams<Employee>) =>
      params.data?.userRoles?.map((role) => role.roleName).join(", ") || "—",
    colId: "roles",
    disableSort: true,
  },
  {
    headerName: "Actions",
    field: "actions",   // required so reorderColumnsByDesiredConfig doesn't drop this column
    colId: "actions",
    cellRenderer: DeactivateCellRenderer,
    cellRendererParams: { onDeactivateClick, onActivateClick },
    width: 90,
    minWidth: 80,
    sortable: false,
    filter: false,
    headerTooltip: "Actions",
    tooltipValueGetter: () => null,
  },
];

/** @deprecated Use getColumns() instead */
export const columns: ColDef<Employee>[] = getColumns(() => {}, () => {});

export const employeeSearchConfig: FormFieldConfig[] = [
  {
    key: "employeeDesignation",
    name: "employeeDesignation",
    label: "Designation",
    type: "select",
    gridColumn: 2.9,
    componentProps: { fullWidth: true, placeholder: "Enter designation" },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_designation"),
      utilityFunction: masterDataUtilitySearchFunction,
      defaultValue: "",
    },
    placeholder: "Search",
  },
  {
    key: "employeeOrganisation",
    name: "employeeOrganisation",
    label: "Organization",
    type: "select",
    gridColumn: 2.9,
    componentProps: { fullWidth: true, placeholder: "Enter organization" },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("organisation"),
      utilityFunction: masterDataUtilitySearchFunction,
      defaultValue: "",
    },
    placeholder: "Search",
  },
  {
    key: "employeeStatus",
    name: "employeeStatus",
    label: "Status",
    type: "select",
    gridColumn: 2.9,
    componentProps: { fullWidth: true, placeholder: "Select status" },
    options: [
      { label: "Active", value: "EMPLOYEE_STATUS_ACTIVE" },
      { label: "Inactive", value: "EMPLOYEE_STATUS_INACTIVE" },
    ],
    placeholder: "Status",
  },
];

export const employeeTableSearchDefaultValues = {
  employeeDesignation: "",
  employeeOrganisation: "",
  employeeStatus: "",
};
