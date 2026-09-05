export const TPA_MEDIATOR_TYPE = 100;
export const INSURER_MEDIATOR_TYPE = 101;
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";
import {
  endPoints,
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";
import salesStrategyIcon from "../../../assets/svgs/sales-strategy.svg";

let localization: LocalizationConfig | undefined;
export const setLocalizationConfig = (config?: LocalizationConfig) => {
  localization = config;
};

export const OpportunityTabs = {
  ACTIVITIES: "OpportunityActivities",
  OVERVIEW: "opportunityOverview",
  CONTACTS: "opportunityContacts",
  CLAIM_EXPERIENCE: "opportunityClaimExperience",
  PREVIOUS_PLACEMENT: "previousPlacementDetails",
  OPPORTUNITY_LOST: "OpportunityLost",
  SALES_PITCH: "OpportunitySalesPitch",
  OPPORTUNITY_HISTORY: "OpportunityHistory",
} as const;

export const sectionConfig = [
  {
    // sectionImage: basicDetailsIcon
    sectionTitle: "Opportunity Overview",
    backgroundColor: "#e0f7fa",
    textColor: "#006064",
    fields: [
      { label: "Company name", key: "company.companyName" },
      { label: "Contact person", key: "contact.displayName" },
      { label: "Policy type", key: "policyType.lookUpValue" },
      { label: "Policy status", key: "policyStatus.lookUpValue" },
      { label: "Service level", key: "serviceLevel.lookUpValue" },
      // { label: "Expiry date", key: "expiryDate" },
      { label: "Sum insured", key: "sumInsured" },
      { label: "Premium paid", key: "premiumPaid" },
      { label: "Estimated brokerage", key: "estimatedBrokerage" },
      { label: "Estimated fee", key: "estimatedFee" },
      { label: "Referred by", key: "referredBy" },
      { label: "Sharing percentage", key: "sharingPercentage" },
      { label: "Stage", key: "stage.lookUpValue" },
      { label: "Remarks", key: "remarks", richText: true },
    ],
  },
  {
    sectionTitle: "Opportunity claim details",
    backgroundColor: "#f1f8e9",
    textColor: "#388e3c",
    fields: [
      { label: "Policy from", key: "policyFrom" },
      { label: "Policy to", key: "policyTo" },
      { label: "Nature of loss", key: "natureOfLoss" },
      { label: "Premium", key: "premium" },
      { label: "Claim amount", key: "claimAmount" },
      { label: "Claim percentage", key: "claimPercentage" },
    ],
    isMultiple: true,
    dataKey: "claimExperiences",
  },
  {
    sectionTitle: "Risk locations",
    backgroundColor: "#e1f5fe",
    textColor: "#0277bd",
    fields: [
      {
        label: "Address type",
        key: "addressType.lookUpValue",
      },
      { label: "Address 1", key: "address1" },
      { label: "Address 2", key: "address2" },
      { label: "Area", key: "area" },
      { label: "Country", key: "countryId.name" },
      { label: "State", key: "stateId.name" },
      { label: "City", key: "cityId.name" },
      { label: "Pincode", key: "pinCode" },
      { label: "Email", key: "email" },
      { label: "Phone number", key: "phoneNumber" },
      {
        label: "Alternate phone number",
        key: "alternatePhoneNumber",
      },
      {
        label: "Support number",
        key: "supportNumber",
      },
    ],
    isMultiple: true,
    dataKey: "riskLocations",
  },

  {
    sectionTitle: "Opportunity challenges",
    backgroundColor: "#ffe0b2",
    textColor: "#e65100",
    fields: [
      { label: "Challenge type", key: "challenge.lookUpValue" },
      { label: "Description ", key: "description" },
      { label: "Mitigation type", key: "mitigation.lookUpValue" },
      { label: "Mitigation description", key: "mitigationDescription" },
    ],
    isMultiple: true,
    dataKey: "challenges",
  },
];

export const opportunityBreadcrumbs = (
  opportunityName: string,
  opportunityType: string,
  opportunityValues?: any
) => [
  {
    label: "Manage opportunities",
    path:
      opportunityType === "SO" ? "/opportunities" : "/renewal-opportunities",
    state: { filters: opportunityValues },
  },
  {
    label: opportunityName || `${opportunityType} Details`,
  },
];

export const opportunityTabsConfig = [
  {
    tabKey: OpportunityTabs.ACTIVITIES,
    label: "Activities",
    componentKey: "OpportunityActivities",
  },
  {
    tabKey: OpportunityTabs.SALES_PITCH,
    label: "Sales pitch",
    componentKey: "OpportunitySalesPitch",
  },
  {
    tabKey: OpportunityTabs.OVERVIEW,
    label: "Overview",
    sectionKey: "opportunityOverview",
  },
  {
    tabKey: OpportunityTabs.CONTACTS,
    label: "Contacts",
    componentKey: "opportunityContacts",
  },
  {
    tabKey: OpportunityTabs.CLAIM_EXPERIENCE,
    label: "Claim experience",
    sectionKey: "opportunityClaimExperience",
  },
  {
    tabKey: OpportunityTabs.PREVIOUS_PLACEMENT,
    label: "Previous placement details",
    sectionKey: "previousPlacementDetails",
  },
  {
    tabKey: OpportunityTabs.OPPORTUNITY_LOST,
    label: "Opportunity lost",
    componentKey: "OpportunityLost",
  },

  {
    tabKey: "documents",
    label: "Documents",
    componentKey: "documents",
    endpoint: endPoints.opportunityDocs,
  },
  {
    tabKey: OpportunityTabs.OPPORTUNITY_HISTORY,
    label: "Opportunity History",
    componentKey: "OpportunityHistory",
  },
];

export const opportunityOverview = (opportunityType?: string) => [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Overview",
    fields: [
      { label: "Company name", key: "company.companyName" },
      { label: "Policy type", key: "policyType.lookUpValue" },
      { label: "Opportunity type", key: "opportunityType.lookUpValue" },
      {
        label: "Risk location",
        key: "riskLocations",
        getFormattedValue: (item: {
          address?: {
            address1?: string;
            address2?: string;
            area?: string;
            cityId?: { name?: string };
            stateId?: { name?: string };
            countryId?: { name?: string };
            pinCode?: string;
          };
        }) => {
          const address = item?.address || {};
          return [
            address.address1,
            address.address2,
            address.area,
            address.cityId?.name,
            address.stateId?.name,
            address.countryId?.name,
            address.pinCode,
          ]
            .filter(Boolean)
            .join(", ");
        },
        isMultiple: true,
        itemStyles: {
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        },
      },
      { label: "Created by", key: "createdByName" },
      { label: "Updated by", key: "updatedByName" },
    ],
  },

  {
    sectionImage: basicDetailsIcon,
    sectionTitle: `${opportunityType} details`,
    fields: [
      { label: "Policy status", key: "policyStatus.lookUpValue" },
      { label: "Service level", key: "serviceLevel.lookUpValue" },
      // { label: "Expiry date", key: "expiryDate" },
      {
        label: "Sum insured",
        key: "sumInsured",
        getFormattedValue: (item: { sumInsured?: number }): string => {
          if (item?.sumInsured === undefined || item?.sumInsured === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.sumInsured, localization);
        },
      },
      {
        label: "Premium paid",
        key: "premiumPaid",
        getFormattedValue: (item: { premiumPaid?: number }): string => {
          if (item?.premiumPaid === undefined || item?.premiumPaid === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.premiumPaid, localization);
        },
      },
      {
        label: "Estimated brokerage",
        key: "estimatedBrokerage",
        getFormattedValue: (item: { estimatedBrokerage?: number }): string => {
          if (
            item?.estimatedBrokerage === undefined ||
            item?.estimatedBrokerage === null
          ) {
            return "--";
          }
          return formatCurrencyByLocalization(
            item.estimatedBrokerage,
            localization
          );
        },
      },
      {
        label: "Estimated fee",
        key: "estimatedFee",
        getFormattedValue: (item: { estimatedFee?: number }): string => {
          if (item?.estimatedFee === undefined || item?.estimatedFee === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.estimatedFee, localization);
        },
      },
      { label: "Source type", key: "opportunitySource.lookUpValue" },
      { label: "Source", key: "source" },
    ],
  },
];

export const opportunityClaimExperience = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Claim experience",
    dataKey: "claimExperiences",
    isMultiple: true,
    fields: [
      {
        label: "Policy from",
        key: "policyFrom",
      },
      {
        label: "Policy to",
        key: "policyTo",
      },
      { label: "Nature of loss", key: "natureOfLoss" },
      {
        label: "Premium",
        key: "premium",
        getFormattedValue: (item: { premium?: number }): string => {
          if (item?.premium === undefined || item?.premium === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.premium, localization);
        },
      },
      {
        label: "Claim amount",
        key: "claimAmount",
        getFormattedValue: (item: { claimAmount?: number }): string => {
          if (item?.claimAmount === undefined || item?.claimAmount === null) {
            return "--";
          }
          return formatCurrencyByLocalization(item.claimAmount, localization);
        },
      },
      {
        label: "Claim percentage",
        key: "claimPercentage",
        getFormattedValue: (item: { claimPercentage?: number }): string => {
          if (
            item?.claimPercentage === undefined ||
            item?.claimPercentage === null
          ) {
            return "--";
          }
          return `${item.claimPercentage} %`;
        },
      },
      {
        label: "Remarks",
        key: "remarks",
        richText: true,
      },
    ],
  },
];

export const previousPlacementDetails = [
  {
    dataKey: "previousPlacementDetails[0]",
    fields: [
      {
        label: "Challenges and mitigation",
        key: "previousPlacementDetails[0].challengesAndMitigation",
        richText: true,
      },
      {
        label: "Existing competition",
        key: "previousPlacementDetails[0].existingCompetition",
        richText: true,
      },
      {
        label: "Remarks",
        key: "previousPlacementDetails[0].remarks",
        richText: true,
      },
    ],
  },
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Previous insurer details",
    isMultiple: true,
    dataKey: "previousMediatorDetails.previousInsurer",
    fields: [
      {
        label: "Company name",
        key: "company.companyName",
      },
      {
        label: "Location",
        key: "location.name",
      },
      {
        label: "Branch",
        key: "branch.name",
      },
    ],
  },
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Previous TPA details",
    isMultiple: true,
    dataKey: "previousMediatorDetails.previousTPA",
    fields: [
      {
        label: "Company name",
        key: "company.companyName",
      },
      {
        label: "Location",
        key: "location.name",
      },
      {
        label: "Branch",
        key: "branch.name",
      },
    ],
  },
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Previous broker details",
    isMultiple: true,
    dataKey: "previousMediatorDetails.previousBroker",
    fields: [
      {
        label: "Company name",
        key: "company.companyName",
      },
      {
        label: "Location",
        key: "location.name",
      },
      {
        label: "Branch",
        key: "branch.name",
      },
    ],
  },
];

export const opportunitySummaryCard = [
  {
    fields: [
      { label: "Policy type", key: "policyType" },
      { label: "Expiry date", key: "expiryDate" },
      { label: "Service level", key: "serviceLevel" },
      { label: "Opportunity type", key: "opportunityType" },
      { label: "Opportunity source", key: "opportunitySource" },
    ],
    itemStyles: {
      display: "flex",
    },
    customStyles: {
      marginTop: 0,
    },
  },
];

export const opportunitySalesPitch = [
  {
    sectionTitle: "Sales pitch",
    fields: [
      {
        key: "salesPitch",
        richText: true,
      },
    ],
    sectionImage: salesStrategyIcon,
    itemStyles: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
  },
];
