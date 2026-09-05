import {
  LocalizationConfig,
  formatCurrencyByLocalization,
  formatDate,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

let localization: LocalizationConfig | undefined;
export const setLocalizationConfig = (config?: LocalizationConfig) => {
  localization = config;
};
export const opportunityColumns: ColDef[] = [
  {
    headerName: "Policy type",
    field: "policyType.value",
    tooltipField: "policyType.value",
    headerTooltip: "Policy Type",
    valueFormatter: ({ value }) => value || "--",
    flex: 1,
    cellClass: "clickable-cell",
    disableSort: true,
  },
  {
    headerName: "Expiry date",
    field: "expiryDate",
    headerTooltip: "Expiry date",
    valueFormatter: ({ value }) => formatDate(value) || "--",
    tooltipValueGetter: ({ value }) => formatDate(value) || "--",
    flex: 1,
    disableSort: true,
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    tooltipField: "sumInsured",
    headerTooltip: "Sum Insured",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    flex: 1,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Brokerage",
    field: "estimatedBrokerage",
    tooltipField: "estimatedBrokerage",
    headerTooltip: "Brokerage",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    flex: 1,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
];
