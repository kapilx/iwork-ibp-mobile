import {
  colors,
  endPoints,
  formatDate,
  formatNumberByLocalization,
  insurerListUtilityFunction,
  NO_DATA_AVAILABLE,
  getAllMonths,
} from "@ui/ui-lib";
import { priorityStyleMap } from "../../CompanyPage/CompanyListing/tableConfig.js";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig.js";

export const statusStyleMap = {
  "endorsement request received": {
    backgroundColor: colors.background.lightSkyBlue,
    color: colors.text.darkBlue,
    dotColor: colors.chips.secondary,
  },
  "create endorsement": {
    backgroundColor: colors.background.lightYellow,
    color: colors.text.darkYellow,
    dotColor: colors.chips.quinary,
  },
  "send endorsement to insurer": {
    backgroundColor: colors.background.lightOrange,
    color: colors.text.darkOrange,
    dotColor: colors.chips.senary,
  },
  "receive acknowledgement from insurer": {
    backgroundColor: colors.background.purple,
    color: colors.text.purple,
    dotColor: colors.chips.primary,
  },
  "client confirmation": {
    backgroundColor: colors.background.lightGreen,
    color: colors.text.darkGreen,
    dotColor: colors.text.success,
  },
  "tpa id upload": {
    backgroundColor: colors.background.lightBlueActive,
    color: colors.text.lightBlue,
    dotColor: colors.chips.ternary,
  },
};

const endorsementStepOptions = (data: any) => {
  const stepData = data?.data?.data ?? [];

  return stepData.map((item: any) => ({
    value: item?.endorsementStepKey,
    label: item?.label,
  }));
};

export const endorsementSmartsearchConfig = [
  {
    key: "companyName",
    name: "companyName",
    label: "Company",
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
    key: "companyPriority",
    name: "companyPriority",
    label: "Company priority",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      isSmartSearch: true,
    },

    placeholder: "Search",
  },
  {
    key: "policyType",
    name: "policyType",
    label: "Policy type",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
      isSmartSearch: true,
    },
    placeholder: "Enter policy type ",
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
    type: "select",
    label: "TAT",
    gridColumn: 2.9,
    options: [
      { label: "< 3 Days", value: "< 3 Days" },
      { label: "< 7 Days", value: "< 7 Days" },
      { label: "< 14 Days", value: "< 14 Days" },
      { label: "> 14 Days", value: "> 14 Days" },
    ],
  },
  {
    key: "endorsementStatus",
    name: "endorsementStatus",
    type: "select",
    label: "Status",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.endorsementSteps,
      utilityFunction: endorsementStepOptions,
    },
    // isSmartSearch: true,
  },
  {
    key: "businessMonth",
    name: "businessMonth",
    label: "Business month",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select month",
    apiDependencies: {
      utilityFunction: getAllMonths,
    },
  },
];

export const getManageEndorsementCols = [
  {
    headerName: "Company name",
    field: "companyName",
    headerTooltip: "Company name",
    valueGetter: (params) => params.data.companyName ?? "--",
    tooltipValueGetter: (params) => params.data.companyName ?? "--",
    // ENTITY_SORT_FIELDS.ENDORSEMENT.companyName ("policy.company.companyName")
    // references a join this query never makes — the raw .orderBy() throws a
    // live SQL error. Stopgap until the join is added; see
    // Table-Sort-Problem-List.md section 1.5.
    disableSort: true,
  },
  {
    headerName: "Endorsement number",
    field: "endorsementId",
    tooltipField: "endorsementId",
    headerTooltip: "Endorsement number",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Company priority",
    field: "companyPriority",
    headerTooltip: "Company priority",
    // Same broken-join issue as companyName above
    // ("policy.company.priority.lookUpOrder") — see
    // Table-Sort-Problem-List.md section 1.5.
    disableSort: true,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: (params) => {
      const val = params.data?.companyPriority;
      return val !== null && val !== undefined
        ? String(val)
        : { NO_DATA_AVAILABLE };
    },
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
  },
  {
    headerName: "Policy number",
    field: "policyNumber",
    headerTooltip: "Policy number",
    cellClass: "clickable-cell",
    valueGetter: (params) =>
      params.data.policyNumber !== null ? params.data.policyNumber : "--",
    tooltipValueGetter: (params) =>
      params.data.policyNumber !== null ? params.data.policyNumber : "--",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    valueGetter: (params) => params.data.policyType ?? "--",
    tooltipValueGetter: (params) => params.data.policyType ?? "--",
    // Same broken-join issue as companyName above
    // ("policy.policyType.lookUpValue") — see
    // Table-Sort-Problem-List.md section 1.5.
    disableSort: true,
  },
  {
    headerName: "Endorsement date",
    field: "endorsementDate",
    headerTooltip: "Endorsement date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    tooltipValueGetter(params) {
      return formatDate(params.data?.endorsementDate) ?? "--";
    },
  },
  {
    headerName: "TAT (days)",
    field: "TATDate",
    headerTooltip: "TAT (days)",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter(params) {
      return formatNumberByLocalization(params.data?.TATDate) ?? "--";
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Computed at request time (calcTatDays) — no DB column to sort by.
    disableSort: true,
  },
  {
    headerName: "Status",
    field: "status",
    // Backend accepts this sort key (endorsement.endorsementStatus is in
    // ALLOWED_SORT_FIELDS), but it sorts the raw status string/enum
    // alphabetically — there's no lookUpOrder-style mapping to the actual
    // workflow sequence, so ASC/DESC doesn't correspond to any meaningful
    // order. Disabled until that ordering is defined.
    disableSort: true,
    headerTooltip: "Status",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: statusStyleMap,
      // variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 250,
  },
  {
    headerName: "Branch",
    field: "branchName",
    headerTooltip: "Branch",
    valueGetter: (params) => params.data.branchName ?? "--",
    tooltipValueGetter: (params) => params.data.branchName ?? "--",
    // Populated in a post-fetch enrichment step after pagination/sorting
    // already ran server-side — no DB column to sort by.
    disableSort: true,
  },
  {
    headerName: "Insurer",
    field: "insurer",
    headerTooltip: "Insurer",
    valueGetter: (params) => params.data.insurer ?? "--",
    tooltipValueGetter: (params) => params.data.insurer ?? "--",
    disableSort: true,
  },
  {
    headerName: "Co-Insurers",
    field: "coInsurers",
    headerTooltip: "Co-Insurers",
    valueGetter: (params) => params.data.coInsurers ?? "--",
    tooltipValueGetter: (params) => params.data.coInsurers ?? "--",
    disableSort: true,
  },
  {
    headerName: "Executive",
    field: "executive",
    headerTooltip: "Executive",
    valueGetter: () => "--",
    disableSort: true,
  },
];

export const manageEndorsementBreadcrumbs = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Manage Endorsements",
  },
];
