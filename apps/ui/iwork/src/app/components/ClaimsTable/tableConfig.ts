import {
  CompanyNameRenderer,
  companyUtilityFunction,
  endPoints,
  formatDate,
  formatNumberByLocalization,
  formatNumberShort,
  FormFieldConfig,
  insurerListUtilityFunction,
  theme,
  tpaUtilityFunction,
  getAllMonths,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { format } from "path";
import { priorityStyleMap } from "../../pages/CompanyPage/CompanyListing/tableConfig";

export const getUploadClaimsFormConfig = (): FormFieldConfig[] => [
  {
    key: "tpaId",
    name: "tpaId",
    type: "selectFieldByApi",
    label: "TPA name",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disablePortal: true,
    },
    apiDependencies: {
      endPoint: endPoints.tpasList,
      utilityFunction: tpaUtilityFunction,
      customParams: { searchBy: "firstName", page: 1, limit: 1000 },
    },
  },
];

export interface ClaimsTableRow {
  companyName: string;
  claimNumber: string;
  policyType: string;
  companyPriority: string;
  claimDate: string;
  claimStatus: string;
  tatDays: number;
  claimAmount: number;
}

export const searchDefaultValues = {
  type: "",
  industrySegment: "",
  priority: "",
  city: "",
  companyType: "",
  ownedBy: "",
  viewBy: { value: "team", label: "Manager + Team" },
};

export const statusStyleMap = {
  styleMap: {
    approved: {
      backgroundColor: theme.palette.background.tableHeaderHover,
      color: theme.palette.text.priorityLow,
      dotColor: theme.palette.text.success,
    },
    "in-progress": {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.secondary.main,
      dotColor: theme.palette.secondary.border,
    },
    rejected: {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.chips.senary,
      dotColor: theme.palette.chips.septenary,
    },
  },
};

export const getClaimsTableColumns = (): ColDef[] => [
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    // cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    pinned: "left",
  },
  {
    headerName: "Claim number",
    field: "claimNumber",
    tooltipField: "claimNumber",
    headerTooltip: "Claim number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    pinned: "left",
    width: 150,
  },
  {
    headerName: "Policy number",
    field: "policyNumber",
    tooltipField: "policyNumber",
    headerTooltip: "Policy number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    pinned: "left",
    width: 150,
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    valueFormatter: ({ value }) => value ?? "--",
    hide: false,
    width: 150,
  },
  {
    headerName: "Company priority",
    field: "companyPriority",
    tooltipField: "companyPriority",
    headerTooltip: "Company priority",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    valueFormatter: ({ value }) => value ?? "--",
    hide: false,
    width: 150,
  },
  {
    headerName: "Claim date",
    field: "claimDate",
    headerTooltip: "Claim date",
    valueFormatter: ({ value }) => formatDate(value) ?? "--",
    tooltipValueGetter: ({ value }) => formatDate(value) ?? "--",
    hide: false,
    width: 150,
    // Was: sort:"desc", sortIndex:0 — ag-grid re-reads a colDef's own
    // sort/sortIndex whenever columnDefs gets a new array reference (which
    // happens on re-render here), silently re-injecting this as the primary
    // sort even after the user picked a different column. No default sort
    // here; backend already falls back to claim.createdAt DESC when the
    // sort param is empty.
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: statusStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) => value ?? "--",
    hide: false,
    width: 150,
  },
  {
    headerName: "TAT/Aging (days)",
    field: "tatDays",
    headerTooltip: "TAT (Days)",
    valueFormatter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    hide: false,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 150,
    // Computed via DATE_PART/DATE_TRUNC at request time, not in
    // ENTITY_SORT_FIELDS.CLAIM — no DB column to sort by.
    disableSort: true,
  },
  {
    headerName: "Claim amount",
    field: "claimAmount",
    headerTooltip: "Claim amount",
    valueFormatter: ({ value }) =>
      value != null ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    hide: false,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 150,
  },
  {
    headerName: "Branch",
    field: "branchName",
    tooltipField: "branchName",
    headerTooltip: "Branch",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    width: 150,
    // Populated in a post-fetch enrichment step after pagination/sorting
    // already ran server-side — no DB column to sort by (see ENTITY_SORT_FIELDS.CLAIM).
    disableSort: true,
  },
  {
    headerName: "Insurer",
    field: "insurer",
    tooltipField: "insurer",
    headerTooltip: "Insurer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    width: 180,
    disableSort: true,
  },
  {
    headerName: "Co-insurers",
    field: "coInsurers",
    tooltipField: "coInsurers",
    headerTooltip: "Co-insurers",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    width: 180,
    disableSort: true,
  },
  {
    headerName: "TPA",
    field: "tpaName",
    tooltipField: "tpaName",
    headerTooltip: "TPA",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    width: 180,
    disableSort: true,
  },
  {
    headerName: "Executive",
    field: "executive",
    headerTooltip: "Executive",
    valueGetter: () => "--",
    // Hardcoded placeholder, not real data — no DB column to sort by.
    disableSort: true,
  },
  // {
  //   headerName: "Actions",
  //   field: "actions",
  //   headerTooltip: "Actions",
  //   cellRenderer: "ActionButton",
  //   hide: false,
  // },
];

export const claimsSearchConfig: FormFieldConfig[] = [
  {
    key: "priorityLid",
    name: "priorityLid",
    label: "Company priority",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
    },
    placeholder: "Search",
  },
  {
    key: "opportunityPolicyType",
    name: "opportunityPolicyType",
    label: "Policy type",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select policy type",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "insurerId",
    name: "insurerId",
    label: "Insurer",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.insurersList,
      utilityFunction: insurerListUtilityFunction,
    },
    placeholder: "Search",
  },
  {
    key: "tatRange",
    name: "tatRange",
    label: "Claims TAT Days",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select TAT Days",
      multiple: false,
    },
    options: [
      { label: "< 3 Days", value: "< 3 Days" },
      { label: "< 7 Days", value: "< 7 Days" },
      { label: "< 14 Days", value: "< 14 Days" },
      { label: "> 14 Days", value: "> 14 Days" },
    ],
    placeholder: "Search",
  },
  {
    key: "claimStatus",
    name: "claimStatus",
    label: "Status",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Status",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CLAIM_STATUS"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
];

export const manageClaimsBreadcrumbs = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Manage claims",
  },
];
