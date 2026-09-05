import { formatCurrencyByLocalization, formatDate, LocalizationConfig } from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const getAssestsColumns = (
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Cover code",
    field: "coverCode",
    disableSort: true,
    tooltipField: "coverCode",
    headerTooltip: "Cover code",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Risk location type",
    field: "riskLocationType",
    disableSort: true,
    tooltipField: "riskLocationType",
    headerTooltip: "Risk location type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Risk location details",
    field: "riskLocationDetails",
    disableSort: true,
    tooltipField: "riskLocationDetails",
    headerTooltip: "Risk location details",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Category",
    field: "category",
    disableSort: true,
    tooltipField: "category",
    headerTooltip: "Category",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Coverage type",
    field: "coverageType",
    disableSort: true,
    headerTooltip: "Coverage type",
    tooltipField: "coverageType",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Quantity",
    field: "quantity",
    disableSort: true,
    tooltipField: "quantity",
    headerTooltip: "Quantity",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Units of measurement",
    field: "uom",
    disableSort: true,
    tooltipField: "uom",
    headerTooltip: "Units of measurement",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Rate",
    field: "rate",
    disableSort: true,
    tooltipField: "rate",
    headerTooltip: "Rate",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    disableSort: true,
    tooltipField: "sumInsured",
    headerTooltip: "Sum insured",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
  },
  {
    headerName: "Premium",
    field: "premium",
    disableSort: true,
    tooltipField: "premium",
    headerTooltip: "Premium",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
  },
];

export const getSubAssetsColumns = (
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Cover code",
    field: "coverCode",
    disableSort: true,
    tooltipField: "coverCode",
    headerTooltip: "Cover code",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Sub-limit Description",
    field: "subLimitDescription",
    disableSort: true,
    tooltipField: "subLimitDescription",
    headerTooltip: "Sub-limit Description",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Sub-limit Type",
    field: "subLimitType",
    disableSort: true,
    tooltipField: "subLimitType",
    headerTooltip: "Sub-limit Type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Sub-limit Amount",
    field: "subLimitAmount",
    disableSort: true,
    tooltipField: "subLimitAmount",
    headerTooltip: "Sub-limit Amount",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
  },
  {
    headerName: "Inception Date",
    field: "inceptionDate",
    disableSort: true,
    tooltipField: "inceptionDate",
    headerTooltip: "Inception Date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Endorsement Number",
    field: "endorsementNumber",
    disableSort: true,
    tooltipField: "endorsementNumber",
    headerTooltip: "Endorsement Number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
];