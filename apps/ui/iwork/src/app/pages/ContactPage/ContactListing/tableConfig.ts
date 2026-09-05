import { ColDef } from "ag-grid-community";
import { TOTAL_COMPANIES, TOTAL_CONTACTS } from "../../../constants";
import {
  FormFieldConfig,
  CompanyNameRenderer,
  convertToTreeData,
  endPoints,
  theme,
  masterDataUtilitySearchFunction,
  masterDataUtilityCitySearchFunction,
} from "@ui/ui-lib";
import { Company, Contact } from "../AddContacts/types";
import { MasterApiResponse } from "../../EmployeePage/EmployeeForm/types";
import ContactRevealCellRenderer from "./ContactRevealCellRenderer";

interface OverallData {
  totalCompanies?: number;
  totalContacts?: number;
}

export const kpiData = (overallData: OverallData, totalRows: number) => [
  {
    title: TOTAL_COMPANIES,
    count: overallData?.totalCompanies || 0,
    percentage: ((overallData?.totalCompanies || 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: TOTAL_CONTACTS,
    count: overallData?.totalContacts || 0,
    percentage: ((overallData?.totalContacts || 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
];

export const companyUtilityFunctionFromContactPage = (data: any) => {
  return data.data.data.map((company: Company) => ({
    value: company.id,
    label: company.companyName,
  }));
};

export const masterDataUtilitySearchFunctionForOwner = (
  response: MasterApiResponse
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ firstName }) => ({
    value: firstName, // Use firstName instead of name
    label: firstName, // Use firstName instead of name
  }));
};

export const tableSearchConfig: FormFieldConfig[] = [
  {
    key: "organisationName",
    name: "organisationName",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: (data: any) => {
        return companyUtilityFunctionFromContactPage(data);
      },
      defaultValue: "",
    },
    placeholder: "Search",
  },
  {
    key: "branch",
    name: "branch",
    label: "City",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.masterDataByName("city"),
      utilityFunction: masterDataUtilityCitySearchFunction,
      defaultValue: "All",
      customParams: { searchBy: "name" },
    },
    placeholder: "Search ",
  },
  {
    key: "status",
    name: "status",
    label: "Contact status",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_STATUS"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search",
  },
];

export const columns: ColDef[] = [
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    valueFormatter: ({ value }) => value || "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Contact name",
    field: "contactName",
    tooltipField: "contactName",
    headerTooltip: "Contact name",
    valueFormatter: ({ value }) => value || "--",
    cellRenderer: CompanyNameRenderer,
    cellRendererParams: {
      nameField: "contactName",
      subTextField: "designation",
    },
    cellClass: "clickable-cell",
  },
  {
    headerName: "Phone no",
    field: "phone",
    disableSort: true,
    headerTooltip: "Phone no",
    cellRenderer: ContactRevealCellRenderer,
    cellRendererParams: { communicationType: "phone" },
  },
  {
    headerName: "Email",
    field: "email",
    disableSort: true,
    headerTooltip: "Email",
    cellRenderer: ContactRevealCellRenderer,
    cellRendererParams: { communicationType: "email" },
  },
  {
    headerName: "Department",
    field: "department",
    tooltipField: "department",
    headerTooltip: "Department",
    valueFormatter: ({ value }) => value || "--",
    // valueGetter: (params) => {
    //   const department = params.data;
    //   return department?.department?.name || "--";
    // },
  },
  {
    headerName: "Designation",
    field: "designation",
    tooltipField: "designation",
    headerTooltip: "Designation",
    valueGetter: (params) => {
      const designation = params.data;
      return designation?.designation || "--";
    },
  },
  {
    headerName: "Owner",
    field: "owner",
    headerTooltip: "Owner",
    valueGetter: (params) => {
      const owner = params.data;
      return owner?.owner?.firstName || "--";
    },
    tooltipValueGetter: (params) => {
      const owner = params.data?.owner;
      return owner?.firstName || "--";
    },
  },
  {
    headerName: "Status",
    headerTooltip: "Status",
    field: "status",
    colId: "status",
    valueFormatter: ({ value }) => value?.lookUpValue || "--",
    tooltipValueGetter: (params) => {
      return params.data?.status?.lookUpValue || "--";
    },
  },
];

export const searchDefaultValues = {
  organisationName: "",
  department: "",
  owner: "",
  ownedBy: "",
  status: { value: "Active", label: "Active" },
  // viewBy: { value: "team", label: "Manager + Team" },
};
