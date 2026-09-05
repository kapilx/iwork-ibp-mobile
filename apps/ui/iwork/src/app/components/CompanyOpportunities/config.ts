import {
  LocalizationConfig,
  formatCurrencyByLocalization,
  formatDate,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { priorityStyleMap } from "../../pages/CompanyPage/CompanyListing/tableConfig";

let localization: LocalizationConfig | undefined;
export const setLocalizationConfig = (config?: LocalizationConfig) => {
  localization = config;
};
export const opportunityColumns: ColDef[] = [
  // {
  //   headerName: "Company name",
  //   field: "companyName",
  //   tooltipField: "companyName",
  //   headerTooltip: "Company Name",
  //   valueFormatter: ({ value }) => value?.toString().trim() ?? "--",
  //   tooltipValueGetter: ({ value }) => value?.toString().trim() ?? "--",
  //   minWidth: 250,
  // },
  {
    headerName: "Policy type",
    field: "policyTypeData.value",
    colId: "policyType",
    tooltipField: "policyTypeData.value",
    headerTooltip: "Policy Type",
    valueFormatter: ({ value }) => value?.toString().trim() ?? "--",
    tooltipValueGetter: ({ value }) => value?.toString().trim() ?? "--",
    minWidth: 200,
    cellClass: "clickable-cell",
  },
  {
    headerName: "Opportunity type",
    field: "opportunityType",
    tooltipField: "opportunityType",
    headerTooltip: "Opportunity type",
    valueFormatter: ({ value }) => value?.toString().trim() ?? "--",
    tooltipValueGetter: ({ value }) => value?.toString().trim() ?? "--",
    minWidth: 180,
  },
  {
    headerName: "Priority level",
    field: "priority",
    tooltipField: "priority",
    headerTooltip: "Priority level",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    minWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Expiry date",
    field: "expiryDate",
    headerTooltip: "Expiry date",
    valueFormatter: ({ value }) => formatDate(value) || "--",
    tooltipValueGetter: ({ value }) => formatDate(value) || "--",
    minWidth: 200,
  },
  {
    headerName: "Activity name",
    field: "activityName",
    headerTooltip: "Activity Name",
    valueFormatter: ({ value }) => value?.toString().trim() ?? "--",
    tooltipValueGetter: ({ value }) => value?.toString().trim() ?? "--",
    minWidth: 300,
    cellClass: "clickable-cell",
  },
  {
    headerName: "Premium",
    field: "premium",
    headerTooltip: "Premium",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    minWidth: 200,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  // {
  //   headerName: "Sum insured",
  //   field: "sumInsured",
  //   headerTooltip: "Sum Insured",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined
  //       ? formatCurrencyByLocalization(value, localization)
  //       : "--",
  //   tooltipValueGetter: ({ value }) =>
  //     value !== null && value !== undefined
  //       ? formatCurrencyByLocalization(value, localization)
  //       : "--",
  //   flex: 1,
  //   cellClass: "right-aligned-cell",
  //   headerClass: "right-aligned-header",
  // },
  {
    headerName: "Estimated brokerage",
    field: "estimatedBrokerage",
    headerTooltip: "Estimated brokerage",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    minWidth: 200,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
    {
    headerName: "Opportunity status",
    // colId stays as the field name: the sort key the grid emits is the colId,
    // and ENTITY_SORT_FIELDS.OPPORTUNITY maps `state` -> status.lookUpValue.
    field: "state",
    tooltipField: "state",
    headerTooltip: "Opportunity status",
    valueFormatter: ({ value }) => value?.toString().trim() ?? "--",
    tooltipValueGetter: ({ value }) => value?.toString().trim() ?? "--",
    minWidth: 180,
  },
];
