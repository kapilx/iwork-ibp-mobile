import { ColDef } from "ag-grid-community";
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";
import currencyIcon from "../../../assets/svgs/currency-icon.svg";
import incorporationIcon from "../../../assets/svgs/date-of-incorporation-icon.svg";
import panIcon from "../../../assets/svgs/pan-icon.svg";
import salesStrategyIcon from "../../../assets/svgs/sales-strategy.svg";
import { TabsContact } from "../../../constants";
import {
  NOT_AVAILABLE,
  formatCurrencyByLocalization,
  formatIndianCurrency,
  LocalizationConfig,
  localizeFields,
  formatNumberByLocalization,
  formatDate,
  endPoints,
} from "@ui/ui-lib";
import { regulatoryFields } from "../AddCompany/formConfig";

let localization: LocalizationConfig | undefined;
export const setLocalizationConfig = (config?: LocalizationConfig) => {
  localization = config;
};

export const companyTabsConfig = [
  { tabKey: "profile", label: "Profile", componentKey: "profile" },
  {
    tabKey: "moreInfo",
    label: "More info",
    sectionKey: "companyDetails",
  },
  {
    tabKey: "contacts",
    label: "Contacts",
    componentKey: "CardGrid",
  },
  {
    tabKey: "kyc",
    label: "KYC",
    componentKey: "companyRegulatory",
  },
  {
    tabKey: "overview",
    label: "Overview",
    componentKey: "ProfileSection",
  },
  {
    tabKey: "strategy",
    label: "Strategy",
    componentKey: "StrategySection",
  },
  // {
  //   tabKey: "salesOpportunities",
  //   label: "SO",
  //   componentKey: "CompanySalesOpportunities",
  // },
  // {
  //   tabKey: "renewalOpportunities",
  //   label: "RO",
  //   componentKey: "CompanyRenewalOpportunities",
  // },
  // { tabKey: "portfolio", label: "Our portfolio", componentKey: "PolicyList" },

  {
    tabKey: "documents",
    label: "Documents",
    componentKey: "documents",
    endpoint: endPoints.companyDocs,
  },
  {
    tabKey: "employeeDetailConfig",
    label: "Employee Detail Config",
    componentKey: "EmployeeDetailConfig",
  },
  {
    tabKey: "emailReminders",
    label: "Email Reminders",
    componentKey: "EmailReminders",
  },
];

export const companyDetails = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Details",
    fields: [
      { label: "Company name", key: "companyName" },
      { label: "Type of company", key: "companyType.lookUpValue" },
      { label: "Is part of group company", key: "groupCompany.lookUpValue" },
      { label: "Group company name", key: "groupCompanyMap.groupCompanyName" },
      {
        label: "Number of employees",
        key: "noOfEmployees",
        getFormattedValue: (item: { noOfEmployees?: number }): string => {
          if (
            item?.noOfEmployees === undefined ||
            item?.noOfEmployees === null
          ) {
            return "--";
          }
          return formatNumberByLocalization(item.noOfEmployees, localization);
        },
      },
      { label: "Source type", key: "sourceType.lookUpValue" },
      { label: "Source", key: "source" },
      { label: "Lead CRM", key: "leadCrmInfo.name" },
      { label: "Associate", key: "associateCrmInfo.name" },
      // { label: "Associate Manager", key: "associateCrmMgrInfo.name" },
      { label: "Central OPS Account Manager", key: "accountManagerInfo.name" },
      { label: "Central OPS Team Lead", key: "centralOpsTeamLeadInfo.name" },
      { label: "Central OPS Lead", key: "centralOpsLeadInfo.name" },
    ],
  },
];

export const contactsColumns: ColDef<TabsContact>[] = [
  {
    headerName: "Contact name",
    field: "displayName",
    cellClass: "clickable-cell",
    tooltipField: "displayName",
    headerTooltip: "Contact Name",
    valueFormatter: ({ value }) => value || "--",
    flex: 2,
  },
  {
    headerName: "Designation",
    field: "designation",
    valueGetter: (params) => {
      const designation = params.data;
      return designation?.designation?.name || "--";
    },
    flex: 1,
  },
  {
    headerName: "Email",
    field: "email",
    valueGetter: (params) => {
      const primaryAddress = params?.data?.communicationDetails.find(
        (each) => each.isPrimary && each.communicationType === "email"
      )?.communicationDetails;
      return primaryAddress || "--";
    },
    flex: 2,
  },
  {
    headerName: "Phone no",
    field: "phone",
    valueGetter: (params) => {
      const primaryAddress = params?.data?.communicationDetails.find(
        (each) => !!each.isPrimary && each.communicationType === "phone"
      )?.communicationDetails;
      return primaryAddress || "--";
    },
    flex: 1,
  },
  {
    headerName: "Department",
    field: "department",
    valueGetter: (params) => {
      const department = params.data;
      return department?.department?.name || "--";
    },
    flex: 1,
  },
  {
    headerName: "Owner",
    field: "owner",
    valueGetter: (params) => {
      const owner = params.data;
      return owner?.owner?.firstName || "--";
    },
    flex: 1,
  },
  {
    headerName: "Status",
    field: "status.lookUpValue",
    valueFormatter: ({ value }) => value || "--",
    flex: 1,
  },
];

export const companyRegulatory = [
  {
    sectionTitle: "Regulatory details",
    fields: [
      { label: "Registration number", key: "registrationNo" },
      { label: "TAN number", key: "tanNumber" },
      { label: "PAN card number", key: "panCardNumber" },
      { label: "Date of incorporation ", key: "dateOfIncorporation" },
      { label: "Currency", key: "currency.lookUpValue" },
      { label: "Annual premium", key: "annualPremium" },
    ],
  },
  {
    sectionTitle: "GST",
    fields: [
      {
        key: "stateGstDetails",
        getLabel: (item) => item?.gstCategory?.lookUpValue,
        isMultiple: true,
        getFormattedValue: (item: {
          gstNumber?: string;
          state?: { name?: string };
          gstCategory?: { lookUpValue?: string };
        }) => {
          const stateName = item?.state?.name || { NOT_AVAILABLE };
          const gstNumber = item?.gstNumber || { NOT_AVAILABLE };
          const gstCategory = item?.gstCategory?.lookUpValue || {
            NOT_AVAILABLE,
          };

          return [
            `State: ${stateName}`,
            `GST Number: ${gstNumber}`,
            `Category: ${gstCategory}`,
          ]
            .filter(Boolean)
            .join(", ");
        },
        customClassName: "highlighted-field",
      },
    ],
    itemStyles: {
      display: "flex",
    },
  },
];

export const companyProfile = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Overview",
    fields: [
      {
        label: "Company’s history",
        key: "details.companyHistory",
        richText: true,
      },
      { label: "Major products", key: "details.majorProducts", richText: true },
      { label: "Key customers", key: "details.keyCustomers", richText: true },
      {
        label: "Business processes",
        key: "details.businessProcesses",
        richText: true,
      },
      { label: "Remarks ", key: "remarks", richText: true },
    ],
    itemStyles: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    thumbnails: [
      {
        url: "https://divami.com",
        alt: "divami.com thumbnail",
        date: "Race98 - 03 June 2023",
        title: "Life Insurance Growth",
        description:
          "Life insurers in India reported a 5.1% increase in new business premiums for FY25, totaling ₹3.97 lakh crore, indicating steady sector growth.",
      },
      {
        url: "https://theiirm.ac.in/",
        alt: "divami.com thumbnail",
        date: "Race98 - 03 June 2023",
        title: "Life Insurance Growth",
        description:
          "Life insurers in India reported a 5.1% increase in new business premiums for FY25, totaling ₹3.97 lakh crore, indicating steady sector growth.",
      },
    ],
  },
];

export const companyStrategy = [
  {
    sectionTitle: "Sales strategy",
    fields: [
      {
        label: "Why this account?",
        key: "details.accountStrategy",
        richText: true,
      },
      { label: "Our competition", key: "details.competitor", richText: true },
      {
        label: "Targeting reason",
        key: "details.targetingReason",
        richText: true,
      },
      { label: "Our weaknesses", key: "details.weakness", richText: true },
      { label: "Action plan", key: "details.actionPlan", richText: true },
      {
        label: "Potential opportunities",
        key: "details.potentialOpportunity",
        richText: true,
      },
      {
        label: "Industry intelligence",
        key: "details.industryIntelligence",
        richText: true,
      },
      { label: "Sales pitch", key: "details.salesPitch", richText: true },
    ],
    itemStyles: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    sectionImage: salesStrategyIcon,
    thumbnails: [
      {
        url: "https://divami.com",
        alt: "divami.com thumbnail",
        date: "Race98 - 03 June 2023",
        title: "Life Insurance Growth",
        description:
          "Life insurers in India reported a 5.1% increase in new business premiums for FY25, totaling ₹3.97 lakh crore, indicating steady sector growth.",
      },
      {
        url: "https://theiirm.ac.in/",
        alt: "divami.com thumbnail",
        date: "Race98 - 03 June 2023",
        title: "Life Insurance Growth",
        description:
          "Life insurers in India reported a 5.1% increase in new business premiums for FY25, totaling ₹3.97 lakh crore, indicating steady sector growth.",
      },
    ],
  },
  {
    sectionTitle: "Service strategy",
    fields: [
      { label: "Our service plan", key: "details.servicePlan", richText: true },
      {
        label: "Client acquisition history and current dynamics",
        key: "details.acquisitionHistory",
        richText: true,
      },
      {
        label: "Current business profile",
        key: "details.bizProfile",
        richText: true,
      },
      {
        label: "Our service performance",
        key: "details.servicePerformance",
        richText: true,
      },
    ],

    itemStyles: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    sectionImage: salesStrategyIcon,
  },
];

export const companyBreadcrumbsData = (
  companyName?: string,
  from?: string,
  companyValues?: any,
  policyName?: string,
  policyId?: string | number
) => {
  if (from === "policyDetails") {
    return [
      {
        label: "Manage policies",
        path: `/policies`,
        state: { filters: companyValues ? companyValues : null },
      },
      {
        label: policyName || "Policy Details",
        path: `/policies/${policyId}`,
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "claims") {
    return [
      {
        label: "Manage claims",
        path: "/manage-claims",
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "clientPortfolio") {
    return [
      {
        label: "Manage client portfolio",
        path: `/my-client-portfolio`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "policyListing") {
    return [
      {
        label: "Manage policies",
        path: `/policies`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "SO") {
    return [
      {
        label: "Manage SO",
        path: `/opportunities`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "RO") {
    return [
      {
        label: "Manage RO",
        path: `/renewal-opportunities`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "contact") {
    return [
      {
        label: "Manage contact",
        path: `/contact`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  if (from === "bizDoneReport") {
    return [
      {
        label: "Manage biz done report",
        path: `/biz-done-report`,
        state: { filters: companyValues ? companyValues : null },
      },
      { label: companyName || "Company Details" },
    ];
  }
  return [
    {
      label: "Manage company",
      path: "/companies",
      state: { filters: companyValues ? companyValues : null },
    },
    { label: companyName || "Company Details" },
  ];
};

export const companyRegulatoryConfig = (
  companyData: any,
  localizationData?: any
) => {
  const localizedFields = localizationData
    ? localizeFields(regulatoryFields, localizationData)
    : regulatoryFields;

  const iconMap: Record<string, string> = {
    registrationNo: panIcon,
    tanNumber: panIcon,
    panCardNumber: panIcon,
    dateOfIncorporation: incorporationIcon,
    currencyId: currencyIcon,
    annualPremium: currencyIcon,
  };

  const data = localizedFields.map((field, index) => {
    let value: any = companyData?.[field.name as keyof typeof companyData];

    if (field.name === "currencyId") {
      value = companyData?.currency?.name;
    }

    if (field.name === "annualPremium") {
      const premium = companyData?.annualPremium;
      value =
        premium !== undefined && premium !== null && premium !== ""
          ? formatIndianCurrency(Number(premium))
          : undefined;
    }
    if (field.name === "dateOfIncorporation") {
      const date = companyData?.dateOfIncorporation;
      value =
        date !== undefined && date !== null && date !== ""
          ? formatDate(date)
          : undefined;
    }

    const subheading = value || NOT_AVAILABLE;

    return {
      id: index + 1,
      imageSrc: iconMap[field.name] ?? panIcon,
      heading: field.label,
      subheading,
    };
  });

  return {
    sectionTitle: "KYC information",
    data,
  };
};

export const opportunityColumns = [
  {
    headerName: "Policy Type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy Type",
    valueFormatter: ({ value }) => value || "--",
    flex: 1,
    cellClass: "clickable-cell",
  },
  {
    headerName: "Expiry date",
    field: "expiryDate",
    tooltipField: "expiryDate",
    headerTooltip: "Expiry date",
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    flex: 1,
  },
  {
    headerName: "Sum Insured",
    field: "sumInsured",
    tooltipField: "sumInsured",
    headerTooltip: "Sum Insured",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    flex: 1,
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
  },
];
