import {
  formatCurrencyByLocalization,
  formatDate,
  formatLargeCurrency,
  formatNumberByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";
import employeeDataIconXl from "../../assets/svgs/employee-data-icon-xl.svg";
import empDependentImg from "../../assets/svgs/employee-dependent.svg";
import kpiBackgroundImage from "../../assets/svgs/details-overview.svg";
import { ColDef } from "ag-grid-community";

export const getCompanyPolicyDetails = (data: any) => [
  {
    id: "emp",
    cardOnClick: () => {},
    bgGradient:
      "linear-gradient(351.53deg, rgba(237, 244, 255, 0.6) -65.73%, rgba(123, 191, 246, 0.6) 168.69%)",
    statGroups: [
      {
        groupTitle: "Employee and Dependent Status",
        icon: employeeDataIconXl, // ✅ not "employeeDataIconXl"
        stats: [
          {
            value: data?.employeeAndDependents?.employeeCount ?? 100,
            label: "Total employees",
          },
          {
            value: data?.employeeAndDependents?.dependentsCount ?? 10,
            label: "Total dependents",
          },
          {
            value: data?.employeeAndDependents?.totalLives ?? 100,
            label: "Total lives",
          },
          {
            value: data?.employeeAndDependents?.employeeCount ?? 100,
            label: "Total employees",
          },
          {
            value: data?.employeeAndDependents?.employeeCount ?? 100,
            label: "Total employees",
          },
          {
            value: data?.employeeAndDependents?.employeeCount ?? 100,
            label: "Total employees",
          },
        ],
      },
    ],
    width: "60%",
    height: 400,
    backgroundImage: empDependentImg, // ✅ not "empDependentImg"
    onClick: () => {},
  },
];

export const overViewData = (overViewData: any, remarks: string) => [
  {
    type: "imageText",
    image: employeeDataIconXl,
    text: "Overview",
  },
  {
    type: "section",
    title: "Company's History",
    description: overViewData?.companyHistory ?? "N/A",
    richText: true,
  },
  {
    type: "section",
    title: "Major Products",
    description: overViewData?.majorProducts || "N/A",
    richText: true,
  },
  {
    type: "section",
    title: "Key Customers",
    description: overViewData?.keyCustomers ?? "N/A",
    richText: true,
  },

  {
    type: "section",
    title: "Business processes",
    description: overViewData?.businessProcesses || "N/A",
    richText: true,
  },
  {
    type: "section",
    title: "Remarks",
    description: remarks || "N/A",
    richText: true,
  },
];

export const companyKPIData = (
  kpiData: any,
  localization: LocalizationConfig
) => ({
  heading: "KPIs",
  infoText:
    "For more information and in-depth insights, please visit the link provided here.",
  kpis: [
    {
      label: "Policy count",
      value:
        formatNumberByLocalization(kpiData?.policyCount, localization) ?? 0,
    },
    {
      label: "Total policy premium",
      value:
        formatLargeCurrency(kpiData?.policyPremiumTotal, localization) ?? 0,
      hoverValue:
        formatNumberByLocalization(kpiData?.policyPremiumTotal, localization) ??
        0,
    },
    // {
    //   label: "Total policy brokerage",
    //   value:
    //     formatLargeCurrency(kpiData?.policyBrokerageTotal, localization) ?? 0,
    //   hoverValue:
    //     formatNumberByLocalization(
    //       kpiData?.policyBrokerageTotal,
    //       localization
    //     ) ?? 0,
    // },
    {
      label: "Total claims",
      value: formatNumberByLocalization(kpiData?.totalClaim, localization) ?? 0,
    },
    {
      label: "Total claims amount",
      value: formatLargeCurrency(kpiData?.totalClaimAmount, localization) ?? 0,
      hoverValue:
        formatNumberByLocalization(kpiData?.totalClaimAmount, localization) ??
        0,
    },
    {
      label: "RO count",
      value: formatNumberByLocalization(kpiData?.roCount, localization) ?? 0,
    },
    {
      label: "RO premium",
      value: formatLargeCurrency(kpiData?.roPremium, localization) ?? 0,
      hoverValue:
        formatNumberByLocalization(kpiData?.roPremium, localization) ?? 0,
    },
    {
      label: "SO count",
      value: formatNumberByLocalization(kpiData?.soCount, localization) ?? 0,
    },
    {
      label: "SO premium",
      value: formatLargeCurrency(kpiData?.soPremium, localization) ?? 0,
      hoverValue:
        formatNumberByLocalization(kpiData?.soPremium, localization) ?? 0,
    },
  ],
  footerLinks: [
    { text: "View Claims", url: "/claims" },
    { text: "View Endorsements", url: "/endorsements" },
  ],
  backgroundImageLink: kpiBackgroundImage,
});

export const columns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Policy number",
    field: "policyNumber",
    tooltipField: "policyNumber",
    headerTooltip: "Policy number",
    width: 220,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined && value !== "" ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined && value !== "" ? value : "--",
    hide: false,
    cellClass: "clickable-cell"
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Expiry date",
    field: "policyTo",
    headerTooltip: "Expiry date",
    width: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    hide: false,
  },
  {
    headerName: "Premium (WON)",
    field: "premium",
    headerTooltip: "Premium (WON)",
    width: 150,
    valueFormatter: ({ value }) =>
      formatCurrencyByLocalization(value, localization) ?? "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    headerTooltip: "Brokerage",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
  },
  {
    headerName: "Insurance company",
    field: "insurerCompany",
    tooltipField: "insurerCompany",
    headerTooltip: "Insurance company",
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "TPA",
    field: "tpa",
    tooltipField: "tpa",
    headerTooltip: "TPA",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Claims amount",
    field: "claimAmount",
    headerTooltip: "Claims amount",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "RO Id",
    field: "opportunityId",
    headerTooltip: "RO Id",
    width: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    cellClass: "clickable-cell",
  },
];
