import {
  environment,
  formatCurrencyByLocalization,
  formatDate,
  formatDateRange,
  formatNumberByLocalization,
  LocalizationConfig,
  theme,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";
import basicInfoIcon from "../../../assets/svgs/info-icon-details.svg";

// Add proper TypeScript interfaces
interface TabConfig {
  label: string;
  sectionKey?: string;
  componentKey?: string;
  tabKey: string;
}

const { featureFlag } = environment;

let localization: LocalizationConfig | undefined;
export const setLocalizationConfig = (config?: LocalizationConfig) => {
  localization = config;
};

const isZeroValue = (value: number | string | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "number") {
    return value === 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const parsed = Number(trimmed);
    return !Number.isNaN(parsed) && parsed === 0;
  }

  return false;
};

export const companyTabsConfig = (
  isGroupPolicyType: boolean = false
): TabConfig[] => [
  ...(featureFlag.FF_IWORK_POLICY_DASHBOARD
    ? [
        {
          tabKey: "policyDashboard",
          label: "Policy dashboard",
          componentKey: "policyDashboard",
        },
      ]
    : []),
  {
    tabKey: "policyDetails",
    label: "Policy details",
    sectionKey: "policyDetails",
  },
  {
    tabKey: "contacts",
    label: "Contacts",
    componentKey: "CardGrid",
  },
  { tabKey: "covers", label: "Cover details", componentKey: "covers" },
  { tabKey: "cdDetails", label: "CD details", componentKey: "cdDetails" },
  { tabKey: "extensionHistory", label: "Extension History", componentKey: "extensionHistory" },
  {
    tabKey: "assetInsured",
    label: "Asset insured",
    componentKey: "assetInsured",
  },
  { tabKey: "instalments", label: "Installments", componentKey: "instalments" },
  {
    tabKey: "insuredDetails",
    label: "Employee insured",
    componentKey: "insuredDetails",
  },
  {
    tabKey: "policyDefinition",
    label: "Policy definition",
    componentKey: "policyDefinition",
  },
  {
    tabKey: "portalConfiguration",
    label: "Portal Configuration",
    componentKey: "portalConfiguration",
  },
  {
    tabKey: "documents",
    label: "Documents",
    componentKey: "documents",
  },
   {
    tabKey: "uploadDocuments",
    label: "Upload",
    componentKey: "uploadDocuments",
  },
  {
    tabKey: "mappingConfiguration",
    label: "Mapping Configuration",
    componentKey: "mappingConfiguration",
  },
  {
    tabKey: "financialInfo",
    label: "Financial info",
    componentKey: "financialInfo",
  },
];

export const policyBreadcrumbs = (
  companyName?: string,
  companyId?: string,
  policyName?: string,
  from?: string,
  companyData?: any,
  policyData?: any
) => {
  if (from === "company") {
    return [
      { label: "Manage company", path: "/companies" },
      {
        label: companyName || "Company Details",
        path: `/companies/${companyId}`,
      },
      { label: policyName || "Policy Details" },
    ];
  }
  if (from === "clientPortfolio") {
    return [
      { label: "Manage client portfolio", path: `/my-client-portfolio` },
      { label: policyName || "Policy Details" },
    ];
  }
  if (from === "polimanage-endorsements") {
    return [
      {
        label: "Manage endorsements",
        path: `/manage-endorsements`,
        state: { filters: policyData ? policyData : null },
      },
      { label: policyName || "Policy Details" },
    ];
  }
  if (from === "bizDoneReport") {
    return [
      {
        label: "Manage biz done report",
        path: `/biz-done-report`,
        state: { filters: policyData ? policyData : null },
      },
      { label: policyName || "Policy Details" },
    ];
  }
  return [
    {
      label: "Manage policies",
      path: "/policies",
      state: { filters: policyData ? policyData : null },
    },
    { label: "Policy Details" },
  ];
};

const createPolicyDetailsConfig = () => [
  {
    sectionImage: basicInfoIcon,
    sectionTitle: "Basic Details",
    hideTitle: true,
    fields: [
      { label: "Policy name", key: "policyName" },
      { label: "Policy type", key: "policyTypeLookUpValue" },
      { label: "Company name", key: "companyName" },
      { label: "Company type", key: "companyTypeLookUpValue" },
      { label: "Policy from", key: "policyFrom" },
      { label: "Policy to", key: "policyTo" },
      { label: "Provisional policy no", key: "provisionalPolicyNo" },
      {
        label: "Sum Insured",
        key: "sumInsured",
        getFormattedValue: (item: { sumInsured?: number }): string => {
          if (item?.sumInsured === undefined || item?.sumInsured === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.sumInsured, localization);
        },
      },
      ...(featureFlag.FF_IWORK_ENROLMENT_PREMIUM_BASED ? [{
        label: "Enrollment premium based",
        key: "isEnrolmentPremiumBasedLookUpValue",
      }] : []),
      { label: "Owner first name", key: "owner.firstName" },
      { label: "Owner last name", key: "owner.lastName" },
      { label: "Owner email", key: "owner.email" },
      { label: "Owner mobile", key: "owner.mobile" },
      { label: "Business type", key: "businessTypeLookUpValue" },
      { label: "Insurer policy number", key: "insurerPolicyNumber" },
      { label: "Is policy mined", key: "isPolicyMinedLookUpValue" },
      { label: "Policy created by", key: "createdBy" },
      { label: "Policy created at", key: "createdAt" },
      { label: "Policy updated by", key: "updatedBy" },
      { label: "Policy updated at", key: "updatedAt" },
      { label: "Date of business", key: "dateOfBusiness" },
      { label: "Business month", key: "businessMonth" },
      { label: "Date of income", key: "dateOfIncome" },
      { label: "Income month", key: "incomeMonth" },
      { label: "Income type", key: "incomeType.lookUpValue" },
      { label: "Policy group", key: "policyGroupLookUpValue" },
      { label: "Endorsement frequency", key: "endorsementFrequency" },
      // { label: "Policy Status", key: "policyStatus.lookUpValue" },
      // { label: "Configuration Status", key: "configurationStatus.lookUpValue" },
      // { label: "Country", key: "country.name" },
      // { label: "Opportunity ID", key: "opportunityId" },
      // { label: "Company ID", key: "companyId" },
      // { label: "Opportunity Type", key: "opportunityType" },
      // { label: "AM ID", key: "amId" },
      // { label: "ISG ID", key: "isgId" },
    ],
  },
];

//Duplicating the config for sri lankan users and need to refactor in the future
const createPolicyDetailsConfigLanka = () => [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Details",
    fields: (item: { gst?: number | string | null }) => [
      {
        label: "Premium at inception",
        key: "premiumAtInception",
        getFormattedValue: (data: { premiumAtInception?: number }): string => {
          if (
            data?.premiumAtInception === undefined ||
            data?.premiumAtInception === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            data.premiumAtInception,
            localization
          );
        },
      },
      {
        label: "TAX amount",
        key: "gstAmount",
        getFormattedValue: (data: { gstAmount?: number }): string => {
          if (data?.gstAmount === undefined || data?.gstAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(data.gstAmount, localization);
        },
      },
      ...(!isZeroValue(item?.gst)
        ? [
            {
              label: "VAT",
              key: "gst",
              getFormattedValue: (data: { gst?: number }): string => {
                if (data?.gst === undefined || data?.gst === null) {
                  return "--";
                }
                return formatCurrencyByLocalization(data.gst, localization);
              },
            },
          ]
        : []),
      { label: "Insurer policy number", key: "insurerPolicyNumber" },
      { label: "Provisional policy number", key: "provisionalPolicyNumber" },
      { label: "Policy BD owner", key: "policyBdOwner" },
      { label: "Policy ISG owner", key: "policyIsgOwner" },
      {
        label: "Financial year",
        key: "financialYear",
      },
      {
        label: "Policy issue date",
        key: "policyIssueDate",
        formatter: formatDate,
      },
      {
        label: "Income month",
        key: "incomeMonth",
        formatter: formatDate,
      },
      {
        label: "Policy start date",
        key: "policyStartDate",
        formatter: formatDate,
      },
      {
        label: "Policy end date",
        key: "policyEndDate",
        formatter: formatDate,
      },
      {
        label: "Total net premium",
        key: "netPremium",
        getFormattedValue: (item: { netPremium?: number }): string => {
          if (item?.netPremium === undefined || item?.netPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.netPremium, localization);
        },
      },
      {
        label: "Total gross premium including tax",
        key: "grossPremiumAmount",
        getFormattedValue: (item: { grossPremiumAmount?: number }): string => {
          if (
            item?.grossPremiumAmount === undefined ||
            item?.grossPremiumAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.grossPremiumAmount,
            localization
          );
        },
      },
      {
        label: "TC premium amount",
        key: "terrorismAmount",
        getFormattedValue: (item: { terrorismAmount?: number }): string => {
          if (
            item?.terrorismAmount === undefined ||
            item?.terrorismAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.terrorismAmount,
            localization
          );
        },
      },
      {
        label: "TC brokerage percentage",
        key: "terrorismBrokeragePercentage",
      },
      {
        label: "TC Brokerage Amount",
        key: "tcBrokerageAmount",
        getFormattedValue: (item: { tcBrokerageAmount?: number }): string => {
          if (
            item?.tcBrokerageAmount === undefined ||
            item?.tcBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.tcBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Basic Brokerage Amount",
        key: "basicBrokerageAmount",
        getFormattedValue: (item: {
          basicBrokerageAmount?: number;
        }): string => {
          if (
            item?.basicBrokerageAmount === undefined ||
            item?.basicBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.basicBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Stamp duty",
        key: "otherAmount",
        getFormattedValue: (item: { otherAmount?: number }): string => {
          if (item?.otherAmount === undefined || item?.otherAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.otherAmount, localization);
        },
      },
      {
        label: "Stamp duty percentage",
        key: "otherPercentage",
        getFormattedValue: (item: { otherPercentage?: number }): string => {
          if (
            item?.otherPercentage === undefined ||
            item?.otherPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.otherPercentage,
            localization
          );
        },
      },
      {
        label: "Policy fee",
        key: "feeAmount",
        getFormattedValue: (item: { feeAmount?: number }): string => {
          if (item?.feeAmount === undefined || item?.feeAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.feeAmount, localization);
        },
      },
      {
        label: "Policy fee percentage",
        key: "feePercentage",
        getFormattedValue: (item: { feePercentage?: number }): string => {
          if (
            item?.feePercentage === undefined ||
            item?.feePercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(item.feePercentage, localization);
        },
      },
      {
        label: "SRCC premium amount",
        key: "srccAmount",
        getFormattedValue: (item: { srccAmount?: number }): string => {
          if (item?.srccAmount === undefined || item?.srccAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.srccAmount, localization);
        },
      },
      {
        label: "SRCC brokerage percentage",
        key: "srccPercentage",
        getFormattedValue: (item: { srccPercentage?: number }): string => {
          if (
            item?.srccPercentage === undefined ||
            item?.srccPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.srccPercentage,
            localization
          );
        },
      },
      {
        label: "SRCC brokerage amount",
        key: "srccBrokerageAmount",
        getFormattedValue: (item: { srccBrokerageAmount?: number }): string => {
          if (
            item?.srccBrokerageAmount === undefined ||
            item?.srccBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.srccBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Admin charges",
        key: "adminCharges",
        getFormattedValue: (item: { adminCharges?: number }): string => {
          if (item?.adminCharges === undefined || item?.adminCharges === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.adminCharges, localization);
        },
      },
      {
        label: "Admin charges percentage",
        key: "adminChargesPercentage",
        getFormattedValue: (item: {
          adminChargesPercentage?: number;
        }): string => {
          if (
            item?.adminChargesPercentage === undefined ||
            item?.adminChargesPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.adminChargesPercentage,
            localization
          );
        },
      },
      {
        label: "CESS amount",
        key: "cessAmount",
        getFormattedValue: (item: { cessAmount?: number }): string => {
          if (item?.cessAmount === undefined || item?.cessAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.cessAmount, localization);
        },
      },
      {
        label: "CESS percentage",
        key: "cessPercentage",
        getFormattedValue: (item: { cessPercentage?: number }): string => {
          if (
            item?.cessPercentage === undefined ||
            item?.cessPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.cessPercentage,
            localization
          );
        },
      },
      {
        label: "Total gross premium including tax and other charges",
        key: "grossPremium",
        getFormattedValue: (item: { grossPremium?: number }): string => {
          if (item?.grossPremium === undefined || item?.grossPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.grossPremium, localization);
        },
      },
    ],
  },
];

export const policyDetails = createPolicyDetailsConfig();

export const policyAdditionalDetails = [
  {
    sectionImage: basicInfoIcon,
    sectionTitle: "Additional details",
    hideTitle: true,
    fields: [
      { label: "Created by", key: "createdBy" },
      { label: "Last modified by", key: "lastModifiedBy" },
      { label: "Created on", key: "createdOn", formatter: formatDate },
      {
        label: "Last modified on",
        key: "lastModifiedOn",
        formatter: formatDate,
      },
    ],
  },
];

export const cardSections: any = [
  {
    fields: [
      { label: "Company", key: "company" },
      { label: "Policy period", key: "policyPeriod" },
      { label: "Insurer", key: "leadInsurer.displayName" },
      { label: "Updated premium", key: "updatedPremium" },
      { label: "Service level ", key: "serviceLevel" },
    ],
    itemStyles: {
      display: "flex",
    },
    customStyles: {
      marginTop: 0,
    },
    containerStyles: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1.3),
    },
    keyStyles: {
      fontWeight: `${theme.typography.fontWeights.semiBold} !important`,
      fontSize: theme.typography.fontSizes.sm,
    },
  },
];

export const cdDetailsColumns: ColDef[] = [
  {
    headerName: "Date",
    field: "date",
    tooltipField: "date",
    headerTooltip: "Date",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    hide: false,
  },
  {
    headerName: "CD number",
    field: "cdNumber",
    tooltipField: "cdNumber",
    headerTooltip: "CD number",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Transaction details",
    field: "transactionDetails",
    tooltipField: "transactionDetails",
    headerTooltip: "Transaction Details",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Debit",
    field: "debit",
    headerTooltip: "Debit",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
  },
  {
    headerName: "Credit",
    field: "credit",
    headerTooltip: "Credit",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
  },
  {
    headerName: "Balance",
    field: "balance",
    headerTooltip: "Balance",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
  },
];

export const policyDetailsViewMoreItems = [
  { label: "IIRM Policy Number", key: "policyId" },
  {
    label: "Policy period",
    key: "policyPeriod",
    formatter: formatDateRange,
  },
  {
    label: "Updated premium",
    key: "updatedPremium",
    formatter: formatNumberByLocalization,
  },
  {
    label: "CD balance",
    key: "cdBalance",
    formatter: formatNumberByLocalization,
    fallback: "0",
  },
  { label: "Service level", key: "serviceLevel" },
];

export const policyDetailsViewMoreItemsOpportunity = (
  handleClick?: () => void
) => [
  { label: "IIRM Policy Number", key: "policyId" },
  {
    label: "Policy period",
    key: "policyPeriod",
    formatter: formatDateRange,
  },
  {
    label: "Updated premium",
    key: "updatedPremium",
    formatter: formatNumberByLocalization,
  },
  {
    label: "CD balance",
    key: "cdBalance",
    formatter: formatNumberByLocalization,
    fallback: "0",
  },
  { label: "Service level", key: "serviceLevel" },
  { label: "Opty ID", key: "opportunityId", handleClick },
];

export const instalmentsColumns: ColDef[] = [
  {
    headerName: "Date",
    field: "date",
    tooltipField: "date",
    headerTooltip: "Date",
    width: 130,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Insurer details",
    field: "insurerDetails",
    tooltipField: "insurerDetails",
    headerTooltip: "Insurer Details",
    width: 280,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Share percentage",
    field: "sharePercentage",
    tooltipField: "sharePercentage",
    headerTooltip: "Share percentage",
    width: 160,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Instalment amount",
    field: "instalmentAmount",
    tooltipField: "instalmentAmount",
    headerTooltip: "Instalment amount",
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Terrorism",
    field: "terrorism",
    tooltipField: "terrorism",
    headerTooltip: "Terrorism",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Brokerage on terrorism",
    field: "commissionOnTerrorism",
    tooltipField: "commissionOnTerrorism",
    headerTooltip: "Brokerage on Terrorism",
    width: 200,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
];

export const policyPremiumAndBrokerageDetails = [
  {
    sectionImage: basicInfoIcon,
    sectionTitle: "Premium & brokerage details",
    hideTitle: true,
    fields: [
      {
        label: "Premium at inception",
        key: "premiumAtInception",
        getFormattedValue: (item: { premiumAtInception?: number }): string => {
          if (
            item?.premiumAtInception === undefined ||
            item?.premiumAtInception === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.premiumAtInception,
            localization
          );
        },
      },
      {
        label: "Basic premium",
        key: "basicPremium",
        getFormattedValue: (item: { basicPremium?: number }): string => {
          if (item?.basicPremium === undefined || item?.basicPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.basicPremium, localization);
        },
      },
      {
        label: "Net premium amount",
        key: "netPremium",
        getFormattedValue: (item: { netPremium?: number }): string => {
          if (item?.netPremium === undefined || item?.netPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.netPremium, localization);
        },
      },
      {
        label: "Gross premium amount",
        key: "grossPremium",
        getFormattedValue: (item: { grossPremium?: number }): string => {
          if (item?.grossPremium === undefined || item?.grossPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.grossPremium, localization);
        },
      },
      {
        label: "Premium collected",
        key: "premiumCollected",
        getFormattedValue: (item: { premiumCollected?: number }): string => {
          if (
            item?.premiumCollected === undefined ||
            item?.premiumCollected === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.premiumCollected,
            localization
          );
        },
      },
      // { label: "GST", key: "gst" },
      { label: "GST %", key: "gstPercentage" },
      {
        label: "GST amount",
        key: "gstAmount",
        getFormattedValue: (item: { gstAmount?: number }): string => {
          if (item?.gstAmount === undefined || item?.gstAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.gstAmount, localization);
        },
      },
      // { label: "GST", key: "gst" },
      {
        label: "Other amount",
        key: "otherAmount",
        getFormattedValue: (item: { otherAmount?: number }): string => {
          if (item?.otherAmount === undefined || item?.otherAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.otherAmount, localization);
        },
      },
      { label: "Basic brokerage %", key: "basicBrokeragePercentage" },
      {
        label: "Basic brokerage amount",
        key: "basicBrokerageAmount",
        getFormattedValue: (item: {
          basicBrokerageAmount?: number;
        }): string => {
          if (
            item?.basicBrokerageAmount === undefined ||
            item?.basicBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.basicBrokerageAmount,
            localization
          );
        },
      },
      { label: "Terrorism brokerage %", key: "terrorismBrokeragePercentage" },
      {
        label: "Terrorism brokerage amount",
        key: "tcBrokerageAmount",
        getFormattedValue: (item: { tcBrokerageAmount?: number }): string => {
          if (
            item?.tcBrokerageAmount === undefined ||
            item?.tcBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.tcBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Terrorism amount",
        key: "terrorismAmount",
        getFormattedValue: (item: { terrorismAmount?: number }): string => {
          if (
            item?.terrorismAmount === undefined ||
            item?.terrorismAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.terrorismAmount,
            localization
          );
        },
      },
      {
        label: "Total brokerage amount",
        key: "totalBrokerageAmount",
        getFormattedValue: (item: {
          totalBrokerageAmount?: number;
        }): string => {
          if (
            item?.totalBrokerageAmount === undefined ||
            item?.totalBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.totalBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Brokerage collected",
        key: "brokerageCollected",
        getFormattedValue: (item: { brokerageCollected?: number }): string => {
          if (
            item?.brokerageCollected === undefined ||
            item?.brokerageCollected === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageCollected,
            localization
          );
        },
      },
      {
        label: "Brokerage amount as per Iwork",
        key: "brokerageAmountAsperIwork",
        getFormattedValue: (item: {
          brokerageAmountAsperIwork?: number;
        }): string => {
          if (
            item?.brokerageAmountAsperIwork === undefined ||
            item?.brokerageAmountAsperIwork === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageAmountAsperIwork,
            localization
          );
        },
      },
      {
        label: "Brokerage amount as per ISG",
        key: "brokerageAmountAsperIsg",
        getFormattedValue: (item: {
          brokerageAmountAsperIsg?: number;
        }): string => {
          if (
            item?.brokerageAmountAsperIsg === undefined ||
            item?.brokerageAmountAsperIsg === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageAmountAsperIsg,
            localization
          );
        },
      },
      {
        label: "Fee amount",
        key: "feeAmount",
        getFormattedValue: (item: { feeAmount?: number }): string => {
          if (item?.feeAmount === undefined || item?.feeAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.feeAmount, localization);
        },
      },
      { label: "OD percentage", key: "odPercentage" },
      { label: "TP percentage", key: "tpPercentage" },
      { label: "Net percentage", key: "netPercentage" },
      { label: "Share percentage", key: "sharePercentage" },
    ],
  },
];

export const policyPremiumAndBrokerageDetailsLanka = [
  {
    sectionImage: basicInfoIcon,
    sectionTitle: "Premium & brokerage details",
    hideTitle: true,
    fields: [
      {
        label: "Premium at inception",
        key: "premiumAtInception",
        getFormattedValue: (item: { premiumAtInception?: number }): string => {
          if (
            item?.premiumAtInception === undefined ||
            item?.premiumAtInception === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.premiumAtInception,
            localization
          );
        },
      },
      {
        label: "SRCC premium amount",
        key: "srccAmount",
        getFormattedValue: (item: { srccAmount?: number }): string => {
          if (item?.srccAmount === undefined || item?.srccAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.srccAmount, localization);
        },
      },
      {
        label: "TC premium amount",
        key: "terrorismAmount",
        getFormattedValue: (item: { terrorismAmount?: number }): string => {
          if (
            item?.terrorismAmount === undefined ||
            item?.terrorismAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.terrorismAmount,
            localization
          );
        },
      },
      {
        label: "Total net premium",
        key: "netPremium",
        getFormattedValue: (item: { netPremium?: number }): string => {
          if (item?.netPremium === undefined || item?.netPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.netPremium, localization);
        },
      },
      {
        label: "Admin charges",
        key: "adminCharges",
        getFormattedValue: (item: { adminCharges?: number }): string => {
          if (item?.adminCharges === undefined || item?.adminCharges === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.adminCharges, localization);
        },
      },
      {
        label: "Stamp duty",
        key: "otherAmount",
        getFormattedValue: (item: { otherAmount?: number }): string => {
          if (item?.otherAmount === undefined || item?.otherAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.otherAmount, localization);
        },
      },
      {
        label: "cess amount",
        key: "cessAmount",
        getFormattedValue: (item: { cessAmount?: number }): string => {
          if (item?.cessAmount === undefined || item?.cessAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.cessAmount, localization);
        },
      },
      {
        label: "VAT percentage",
        key: "gstPercentage",
        getFormattedValue: (item: { gstPercentage?: number }): string => {
          if (
            item?.gstPercentage === undefined ||
            item?.gstPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(item.gstPercentage, localization);
        },
      },
      {
        label: "VAT amount",
        key: "gstAmount",
        getFormattedValue: (item: { gstAmount?: number }): string => {
          if (item?.gstAmount === undefined || item?.gstAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.gstAmount, localization);
        },
      },
      {
        label: "Policy fee",
        key: "feeAmount",
        getFormattedValue: (item: { feeAmount?: number }): string => {
          if (item?.feeAmount === undefined || item?.feeAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.feeAmount, localization);
        },
      },
      {
        label: "Total gross premium including tax and other charges",
        key: "grossPremium",
        getFormattedValue: (item: { grossPremium?: number }): string => {
          if (item?.grossPremium === undefined || item?.grossPremium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.grossPremium, localization);
        },
      },
      {
        label: "Basic brokerage percentage",
        key: "basicBrokeragePercentage",
        getFormattedValue: (item: {
          basicBrokeragePercentage?: number;
        }): string => {
          if (
            item?.basicBrokeragePercentage === undefined ||
            item?.basicBrokeragePercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.basicBrokeragePercentage,
            localization
          );
        },
      },
      {
        label: "SRCC brokerage percentage",
        key: "srccPercentage",
        getFormattedValue: (item: { srccPercentage?: number }): string => {
          if (
            item?.srccPercentage === undefined ||
            item?.srccPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.srccPercentage,
            localization
          );
        },
      },
      {
        label: "TC brokerage percentage",
        key: "terrorismBrokeragePercentage",
      },
      {
        label: "Basic Brokerage Amount",
        key: "basicBrokerageAmount",
        getFormattedValue: (item: {
          basicBrokerageAmount?: number;
        }): string => {
          if (
            item?.basicBrokerageAmount === undefined ||
            item?.basicBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.basicBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "SRCC brokerage amount",
        key: "srccBrokerageAmount",
        getFormattedValue: (item: { srccBrokerageAmount?: number }): string => {
          if (
            item?.srccBrokerageAmount === undefined ||
            item?.srccBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.srccBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "TC Brokerage Amount",
        key: "tcBrokerageAmount",
        getFormattedValue: (item: { tcBrokerageAmount?: number }): string => {
          if (
            item?.tcBrokerageAmount === undefined ||
            item?.tcBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.tcBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Total brokerage amount",
        key: "totalBrokerageAmount",
        getFormattedValue: (item: {
          totalBrokerageAmount?: number;
        }): string => {
          if (
            item?.totalBrokerageAmount === undefined ||
            item?.totalBrokerageAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.totalBrokerageAmount,
            localization
          );
        },
      },
      {
        label: "Premium collected",
        key: "premiumCollected",
        getFormattedValue: (item: { premiumCollected?: number }): string => {
          if (
            item?.premiumCollected === undefined ||
            item?.premiumCollected === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.premiumCollected,
            localization
          );
        },
      },
      // {
      //   label: "Total gross premium including tax",
      //   key: "grossPremiumAmount",
      //   getFormattedValue: (item: { grossPremiumAmount?: number }): string => {
      //     if (
      //       item?.grossPremiumAmount === undefined ||
      //       item?.grossPremiumAmount === null
      //     ) {
      //       return "--";
      //     }
      //     return formatCurrencyByLocalization(
      //       item.grossPremiumAmount,
      //       localization
      //     );
      //   },
      // },
      // { label: "GST", key: "gst" },
      {
        label: "Stamp duty percentage",
        key: "otherPercentage",
        getFormattedValue: (item: { otherPercentage?: number }): string => {
          if (
            item?.otherPercentage === undefined ||
            item?.otherPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.otherPercentage,
            localization
          );
        },
      },
      {
        label: "Brokerage %",
        key: "brokeragePercentage",
      },
      {
        label: "Brokerage collected",
        key: "brokerageCollected",
        getFormattedValue: (item: { brokerageCollected?: number }): string => {
          if (
            item?.brokerageCollected === undefined ||
            item?.brokerageCollected === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageCollected,
            localization
          );
        },
      },
      {
        label: "Brokerage amount as per Iwork",
        key: "brokerageAmountAsperIwork",
        getFormattedValue: (item: {
          brokerageAmountAsperIwork?: number;
        }): string => {
          if (
            item?.brokerageAmountAsperIwork === undefined ||
            item?.brokerageAmountAsperIwork === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageAmountAsperIwork,
            localization
          );
        },
      },
      {
        label: "Brokerage amount as per ISG",
        key: "brokerageAmountAsperIsg",
        getFormattedValue: (item: {
          brokerageAmountAsperIsg?: number;
        }): string => {
          if (
            item?.brokerageAmountAsperIsg === undefined ||
            item?.brokerageAmountAsperIsg === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.brokerageAmountAsperIsg,
            localization
          );
        },
      },
      {
        label: "Policy fee percentage",
        key: "feePercentage",
        getFormattedValue: (item: { feePercentage?: number }): string => {
          if (
            item?.feePercentage === undefined ||
            item?.feePercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(item.feePercentage, localization);
        },
      },
      { label: "OD percentage", key: "odPercentage" },
      { label: "TP percentage", key: "tpPercentage" },
      { label: "Net percentage", key: "netPercentage" },
      { label: "Share percentage", key: "sharePercentage" },
      {
        label: "Admin charges percentage",
        key: "adminChargesPercentage",
        getFormattedValue: (item: {
          adminChargesPercentage?: number;
        }): string => {
          if (
            item?.adminChargesPercentage === undefined ||
            item?.adminChargesPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.adminChargesPercentage,
            localization
          );
        },
      },
      {
        label: "cess percentage",
        key: "cessPercentage",
        getFormattedValue: (item: { cessPercentage?: number }): string => {
          if (
            item?.cessPercentage === undefined ||
            item?.cessPercentage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.cessPercentage,
            localization
          );
        },
      },
    ],
  },
];

export const policyRconDetails = [
  {
    sectionImage: basicInfoIcon,
    sectionTitle: "RCON details",
    hideTitle: true,
    fields: [
      { label: "RCON status", key: "rconStatus" },
      {
        label: "RCON brokerage",
        key: "rconBrokerage",
        getFormattedValue: (item: { rconBrokerage?: number }): string => {
          if (
            item?.rconBrokerage === undefined ||
            item?.rconBrokerage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(item.rconBrokerage, localization);
        },
      },
      {
        label: "RCON outcome",
        key: "rconOutcome",
      },
      {
        label: "Pending brokerage",
        key: "pendingBrokerage",
        getFormattedValue: (item: { pendingBrokerage?: number }): string => {
          if (
            item?.pendingBrokerage === undefined ||
            item?.pendingBrokerage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.pendingBrokerage,
            localization
          );
        },
      },
    ],
  },
];

export const instalmentsData = [
  {
    date: "31-Mar-2025",
    insurerDetails: "OIC-Bo Dabirwala house– Kolkata-311100",
    sharePercentage: 100,
    instalmentAmount: "2,00,000",
    terrorism: "--",
    commissionOnTerrorism: "No",
  },
  {
    date: "30-Sep-2025",
    insurerDetails: "OIC-Bo Dabirwala house– Kolkata-311100",
    sharePercentage: 100,
    instalmentAmount: "4,00,000",
    terrorism: "--",
    commissionOnTerrorism: "No",
  },
  {
    date: "30-Sep-2025",
    insurerDetails: "OIC-Bo Dabirwala house– Kolkata-311100",
    sharePercentage: 100,
    instalmentAmount: "4,00,000",
    terrorism: "--",
    commissionOnTerrorism: "No",
  },
  {
    date: "30-Sep-2025",
    insurerDetails: "OIC-Bo Dabirwala house– Kolkata-311100",
    sharePercentage: 100,
    instalmentAmount: "4,00,000",
    terrorism: "--",
    commissionOnTerrorism: "No",
  },
  {
    date: "30-Sep-2025",
    insurerDetails: "OIC-Bo Dabirwala house– Kolkata-311100",
    sharePercentage: 100,
    instalmentAmount: "4,00,000",
    terrorism: "--",
    commissionOnTerrorism: "No",
  },
];

export const insurerDetails = [
  {
    sectionTitle: "Insurer details",
    sectionImage: basicInfoIcon,
    hideTitle: true,
    fields: [
      { label: "Insurer name", key: "insurerDetails.name" },
      { label: "Display name", key: "insurerDetails.displayName" },
      { label: "Company type", key: "insurerDetails.companyType.lookUpValue" },
      { label: "Insurance type", key: "insurerDetails.isLife.lookUpValue" },
      { label: "Website", key: "insurerDetails.website" },
      {
        label: "Insurer participation type",
        key: "insurerParticipationType.lookUpValue",
      },
    ],
  },
  {
    sectionTitle: "Branch details",
    fields: [
      { label: "Branch type", key: "addressDetails.branchType.lookUpValue" },
      { label: "Branch code", key: "addressDetails.branchCode" },
      { label: "Address line 1", key: "addressDetails.address1" },
      { label: "Address line 2", key: "addressDetails.address2" },
      { label: "Area", key: "addressDetails.area" },
      { label: "City", key: "addressDetails.city.displayName" },
      { label: "State", key: "addressDetails.state.displayName" },
      { label: "Country", key: "addressDetails.country.displayName" },
      { label: "Pincode", key: "addressDetails.pincode" },
      { label: "Phone number", key: "addressDetails.phoneNumber" },
      { label: "Alternate phone", key: "addressDetails.alternatePhoneNumber" },
      { label: "Email", key: "addressDetails.email" },
      { label: "Support number", key: "addressDetails.supportNumber" },
      { label: "Fax", key: "addressDetails.fax" },
    ],
  },
  {
    sectionTitle: "Risk locations",
    hideTitle: false,
    isMultiple: true,
    dataKey: "riskLocations",
    itemStyles: { gridTemplateColumns: "1fr" },
    fields: [
      {
        getFormattedValue: (item: any) => {
          const address = item?.address ?? item ?? {};
          const city =
            address?.city?.displayName ??
            address?.city?.name ??
            address?.cityId?.name;
          const state =
            address?.state?.displayName ??
            address?.state?.name ??
            address?.stateId?.name;
          const country =
            address?.country?.displayName ??
            address?.country?.name ??
            address?.countryId?.name;
          const pincode = address?.pincode ?? address?.pinCode;

          const parts = [
            address?.address1,
            address?.address2,
            address?.area,
            city,
            state,
            country,
            pincode,
          ].filter(Boolean);

          return parts.length ? [`• ${parts.join(", ")}`] : ["--"];
        },
      },
    ],
  },
  {
    sectionTitle: "Contact details",
    fields: [
      { label: "First name", key: "contactDetails.firstName" },
      { label: "Last name", key: "contactDetails.lastName" },
      { label: "Middle name", key: "contactDetails.middleName" },
      { label: "Display name", key: "contactDetails.displayName" },
      {
        label: "Company location",
        key: "contactDetails.companyLocation.displayName",
      },
      {
        label: "Company branch",
        key: "contactDetails.companyBranch.displayName",
      },

      { label: "Department", key: "contactDetails.department" },
      { label: "Designation", key: "contactDetails.designation" },
      { label: "Reporting to", key: "contactDetails.reportingTo" },
      { label: "Contact type", key: "contactDetails.contactType.lookUpValue" },
      { label: "Email", key: "contactDetails.email" },
      { label: "Phone number", key: "contactDetails.phoneNumber" },
      { label: "Status", key: "contactDetails.status.lookUpValue" },
      { label: "Assistant", key: "contactDetails.assistant" },
      { label: "Remarks", key: "contactDetails.remarks" },
    ],
  },
];

export const tpaDetails = [
  {
    sectionTitle: "TPA details",
    sectionImage: basicInfoIcon,
    hideTitle: true,
    fields: [
      { label: "TPA name", key: "tpaDetails.name" },
      { label: "Display name", key: "tpaDetails.displayName" },
      { label: "Company type", key: "tpaDetails.companyType.lookUpValue" },
      { label: "Website", key: "tpaDetails.website" },
    ],
  },
  {
    sectionTitle: "Address details",
    fields: [
      { label: "Address type", key: "addressDetails.addressType.lookUpValue" },
      { label: "Address line 1", key: "addressDetails.address1" },
      { label: "Address line 2", key: "addressDetails.address2" },
      { label: "Area", key: "addressDetails.area" },
      { label: "City", key: "addressDetails.city.displayName" },
      { label: "State", key: "addressDetails.state.displayName" },
      { label: "Country", key: "addressDetails.country.displayName" },
      { label: "Pincode", key: "addressDetails.pincode" },
      { label: "Phone number", key: "addressDetails.phoneNumber" },
      { label: "Alternate phone", key: "addressDetails.alternatePhoneNumber" },
      { label: "Email", key: "addressDetails.email" },
      { label: "Support number", key: "addressDetails.supportNumber" },
      { label: "Fax", key: "addressDetails.fax" },
    ],
  },
  {
    sectionTitle: "Contact details",
    fields: [
      { label: "First name", key: "contactDetails.firstName" },
      { label: "Last name", key: "contactDetails.lastName" },
      { label: "Middle name", key: "contactDetails.middleName" },
      { label: "Display name", key: "contactDetails.displayName" },
      {
        label: "Company location",
        key: "contactDetails.companyLocation.displayName",
      },
      {
        label: "Company branch",
        key: "contactDetails.companyBranch.displayName",
      },

      { label: "Department", key: "contactDetails.department" },
      { label: "Designation", key: "contactDetails.designation" },
      { label: "Reporting to", key: "contactDetails.reportingTo" },
      { label: "Contact type", key: "contactDetails.contactType.lookUpValue" },
      { label: "Email", key: "contactDetails.email" },
      { label: "Phone number", key: "contactDetails.phoneNumber" },
      { label: "Status", key: "contactDetails.status.lookUpValue" },
      { label: "Assistant", key: "contactDetails.assistant" },
      { label: "Remarks", key: "contactDetails.remarks" },
    ],
  },
];

export const companyContacts = [
  {
    sectionTitle: "Company contact details",
    sectionImage: basicInfoIcon,
    hideTitle: true,
    fields: [
      { label: "First name", key: "contactDetails.firstName" },
      { label: "Last name", key: "contactDetails.lastName" },
      { label: "Middle name", key: "contactDetails.middleName" },
      { label: "Display name", key: "contactDetails.displayName" },
      { label: "Contact type", key: "contactDetails.contactType.lookUpValue" },
      { label: "Department", key: "contactDetails.department" },
      { label: "Designation", key: "contactDetails.designation" },
      { label: "Email", key: "contactDetails.email" },
      { label: "Phone number", key: "contactDetails.phoneNumber" },
    ],
  },
  {
    sectionTitle: "Address details",
    fields: [
      { label: "Address type", key: "addressDetails.addressType.lookUpValue" },
      { label: "Address line 1", key: "addressDetails.address1" },
      { label: "Address line 2", key: "addressDetails.address2" },
      { label: "Area", key: "addressDetails.area" },
      { label: "City", key: "addressDetails.city.displayName" },
      { label: "State", key: "addressDetails.state.displayName" },
      { label: "Country", key: "addressDetails.country.displayName" },
      { label: "Pincode", key: "addressDetails.pincode" },
      { label: "Phone number", key: "addressDetails.phoneNumber" },
      { label: "Alternate phone", key: "addressDetails.alternatePhoneNumber" },
      { label: "Email", key: "addressDetails.email" },
      { label: "Support number", key: "addressDetails.supportNumber" },
      { label: "Fax", key: "addressDetails.fax" },
    ],
  },
];

export const coInsurer = [
  {
    sectionTitle: "Co insurer details",
    sectionImage: basicInfoIcon,
    hideTitle: true,
    fields: [
      { label: "Name", key: "insurerDetails.name" },
      { label: "Display name", key: "insurerDetails.displayName" },
      { label: "Company type", key: "insurerDetails.companyType.lookUpValue" },
      { label: "Website", key: "insurerDetails.website" },
      { label: "Insurance type", key: "insurerDetails.isLife.lookUpValue" },
    ],
  },
  {
    sectionTitle: "Branch details",
    fields: [
      { label: "Branch type", key: "addressDetails.branchType.lookUpValue" },
      { label: "Branch code", key: "addressDetails.branchCode" },
      { label: "Address line 1", key: "addressDetails.address1" },
      { label: "Address line 2", key: "addressDetails.address2" },
      { label: "Area", key: "addressDetails.area" },
      { label: "City", key: "addressDetails.city.displayName" },
      { label: "State", key: "addressDetails.state.displayName" },
      { label: "Country", key: "addressDetails.country.displayName" },
      { label: "Pincode", key: "addressDetails.pincode" },
      { label: "Phone number", key: "addressDetails.phoneNumber" },
      { label: "Alternate phone", key: "addressDetails.alternatePhoneNumber" },
      { label: "Email", key: "addressDetails.email" },
      { label: "Support number", key: "addressDetails.supportNumber" },
      { label: "Fax", key: "addressDetails.fax" },
    ],
  },
  {
    sectionTitle: "Contact details",
    fields: [
      { label: "First name", key: "contactDetails.firstName" },
      { label: "Last name", key: "contactDetails.lastName" },
      { label: "Middle name", key: "contactDetails.middleName" },
      { label: "Display Name", key: "contactDetails.displayName" },
      {
        label: "Company location",
        key: "contactDetails.companyLocation.displayName",
      },
      {
        label: "Company branch",
        key: "contactDetails.companyBranch.displayName",
      },
      { label: "Reporting to", key: "contactDetails.reportingTo" },
      { label: "Contact type", key: "contactDetails.contactType.lookUpValue" },
      { label: "Department", key: "contactDetails.department" },
      { label: "Designation", key: "contactDetails.designation" },
      { label: "Email", key: "contactDetails.email" },
      { label: "Phone number", key: "contactDetails.phoneNumber" },
      { label: "Status", key: "contactDetails.status.lookUpValue" },
      { label: "Assistant", key: "contactDetails.assistant" },
      { label: "Remarks", key: "contactDetails.remarks" },
    ],
  },
];
export const crmAccountManagerDetails = [
  {
    sectionTitle: "BD owner details",
    hideTitle: true,
    fields: [
      { label: "CRM Team Lead", key: "bdOwner.name" },
      {
        label: "Employee ID",
        key: "bdOwner.empId",
      },
      { label: "Email", key: "bdOwner.email" },
      { label: "Mobile", key: "bdOwner.mobile" },
      { label: "Branch", key: "bdOwner.branch" },
    ],
  },
  {
    sectionTitle: "ISG owner details",
    fields: [
      { label: "Name", key: "isgOwner.name" },
      {
        label: "Employee ID",
        key: "isgOwner.empId",
      },
      { label: "Email", key: "isgOwner.email" },
      { label: "Mobile", key: "isgOwner.mobile" },
      { label: "Branch", key: "isgOwner.branch" },
    ],
  },
  {
    sectionTitle: "Account manager details",
    fields: [
      { label: "Name", key: "accountManager.name" },
      {
        label: "Employee ID",
        key: "accountManager.empId",
      },
      {
        label: "Email",
        key: "accountManager.email",
      },
      {
        label: "Mobile",
        key: "accountManager.mobile",
      },
      {
        label: "Branch",
        key: "accountManager.branch",
      },
    ],
  },
  {
    sectionTitle: "Associate details",
    fields: [
      { label: "Name", key: "leadCrm.name" },
      {
        label: "Employee ID",
        key: "leadCrm.empId",
      },
      { label: "Email", key: "leadCrm.email" },
      { label: "Mobile", key: "leadCrm.mobile" },
      { label: "Branch", key: "leadCrm.branch" },
    ],
  },
];

export const premiumInstallmentDetails = [
  {
    sectionTitle: "Premium installments",
    sectionImage: basicInfoIcon,
    hideTitle: true,
    fields: [
      { label: "Installment date", key: "installmentDate" },
      {
        label: "Installment amount",
        key: "installmentAmount",
        getFormattedValue: (item: { installmentAmount?: number }): string => {
          if (
            item?.installmentAmount === undefined ||
            item?.installmentAmount === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.installmentAmount,
            localization
          );
        },
      },
    ],
  },
];
