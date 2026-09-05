import { formatDate, theme } from "@ui/ui-lib";
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";

export const ContactDetailsTabs = {
  CONTACT_INFORMATION: "contactInformation",
  RELATIONSHIPS: "relationships",
  PROFESSIONAL: "professional",
  QUALIFICATION: "qualification",
  ACHIEVEMENTS: "achievements",
  SALES_OPPORTUNITIES: "ContactSalesOpportunities",
  RENEWAL_OPPORTUNITIES: "ContactRenewalOpportunities",
  PORTFOLIO: "PolicyList",
} as const;

export const contactTabsConfig = [
  {
    tabKey: ContactDetailsTabs.CONTACT_INFORMATION,
    label: "Contact information",
    sectionKey: "contactInformation",
  },
  {
    tabKey: ContactDetailsTabs.RELATIONSHIPS,
    label: "Relationships",
    sectionKey: "relationships",
  },
  {
    tabKey: ContactDetailsTabs.PROFESSIONAL,
    label: "Professional",
    sectionKey: "professional",
  },
  {
    tabKey: ContactDetailsTabs.QUALIFICATION,
    label: "Qualification",
    sectionKey: "qualification",
  },
  {
    tabKey: ContactDetailsTabs.ACHIEVEMENTS,
    label: "Achievements",
    sectionKey: "achievements",
  },
  {
    tabKey: ContactDetailsTabs.SALES_OPPORTUNITIES,
    label: "SO",
    componentKey: "ContactSalesOpportunities",
  },
  {
    tabKey: ContactDetailsTabs.RENEWAL_OPPORTUNITIES,
    label: "RO",
    componentKey: "ContactRenewalOpportunities",
  },
  {
    tabKey: ContactDetailsTabs.PORTFOLIO,
    label: "Our portfolio",
    componentKey: "PolicyList",
  },
];

// Contact Information Section
export const contactInformation = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Basic details",
    fields: [
      { label: "Salutation", key: "salutation.lookUpValue" },
      { label: "First name", key: "firstName" },
      { label: "Middle name", key: "middleName" },
      { label: "Last name", key: "lastName" },
      { label: "Reporting to", key: "reportingTo.displayName" },
      { label: "Location", key: "companyLocation.lookUpValue" },
      { label: "Remarks", key: "remarks", richText: true },
    ],
  },
];
export const CommunicatonDetails = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Communication details",
    fields: [
      {
        label: "Communication type",
        key: "communicationType",
        getFormattedValue: (item: CommunicationDetail) => {
          const type = item.communicationType;
          return type === "email" ? "Email" : type === "phone" ? "Phone" : type;
        },
      },
      { label: "Details", key: "communicationDetails" },
    ],
    isMultiple: true,
    dataKey: "communicationDetails",
  },
];

export const relationships = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Relationships status",
    fields: [
      {
        label: "Gender",
        key: "contactDetails.genderType.lookUpValue",
      },
      {
        label: "Date of birth",
        key: "contactDetails.dateOfBirth",
        formatter: formatDate,
      },
      {
        label: "Favourite food",
        key: "contactDetails.favouriteFood",
      },
      {
        label: "Favourite restaurant",
        key: "contactDetails.favouriteRestaurant",
      },
      {
        label: "Marriage status",
        key: "contactDetails.maritalStatusType.lookUpValue",
      },
      {
        label: "Date of wedding",
        key: "contactDetails.dateOfWedding",
      },
      { label: "Spouse/ partner name", key: "contactDetails.spouseName" },
      {
        label: "Spouse / Partner’s date of birth",
        key: "contactDetails.spouseDateOfBirth",
        formatter: formatDate,
      },
      {
        label: "Spouse / Partner’s working status",
        key: "contactDetails.spouseWorkingStatusType.lookUpValue",
      },
      {
        label: "Spouse / Partner’s working company",
        key: "contactDetails.workingCompany",
      },
      {
        label: "Personal history",
        key: "contactDetails.personalHistory",
        richText: true,
      },
    ],
  },
];
export const childInfo = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Children Details",
    fields: [
      {
        label: "Child gender",
        key: "childGenderType.lookUpValue",
      },
      {
        label: "Child name",
        key: "childName",
      },
      {
        label: "Child date of birth",
        key: "childDob",
        formatter: formatDate,
      },
    ],
    isMultiple: true,
    dataKey: "contactDetails.childDetails",
  },
];
export const professional = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Professional experience",

    fields: [
      {
        label: "From date",
        key: "fromDate",
        render: (value: string) => (value ? value : "Not available"),
        formatter: formatDate,
      },
      {
        label: "To date",
        key: "toDate",
        render: (value: string) => (value ? value : "Not available"),
        formatter: formatDate,
      },
      {
        label: "Company",
        key: "company",
      },
      {
        label: "Department",
        key: "department",
      },
      {
        label: "Designation",
        key: "designation",
      },
      {
        label: "Details",
        key: "details",
        richText: true,
      },
    ],
    isMultiple: true,
    dataKey: "professionalExperiences",
  },
];

export const qualification = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Qualifications",
    fields: [
      {
        label: "Name of qualification",
        key: "nameOfQualification",
      },
      {
        label: "University name",
        key: "universityName",
      },
      {
        label: "Year of qualification",
        key: "yearOfQualification",
        formatter: formatDate,
      },

      {
        label: "Details",
        key: "details",
        richText: true,
      },
    ],
    isMultiple: true,
    dataKey: "qualificationExperiences",
  },
];
export const achievements = [
  {
    sectionImage: basicDetailsIcon,
    sectionTitle: "Achievements",
    fields: [
      {
        label: "Major achievements",
        key: "contactDetails.majorAchievements",
        richText: true,
      },
    ],
  },
];

export const contactBreadcrumbs = (
  contactName?: string,
  from?: string,
  contactValues?: any
) => {
  if (from === "bizDoneReport") {
    return [
      {
        label: "Manage biz done report",
        path: "/biz-done-report",
        state: { filters: contactValues ? contactValues : null },
      },
      { label: contactName || "Contact Details" },
    ];
  }
  return [
    {
      label: "Manage contact",
      path: "/contact",
      state: { filters: contactValues ? contactValues : null },
    },
    { label: contactName || "Contact Details" },
  ];
};

interface CommunicationDetail {
  id: number;
  communicationType: "email" | "phone";
  communicationDetails: string;
  isPrimary: boolean;
}

export const contactSummaryCard = [
  {
    fields: [
      { label: "Company", key: "company" },
      { label: "Status", key: "status" },
      { label: "Phone", key: "phone" },
      { label: "Email", key: "email" },
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
      fontWeight: theme.typography.fontWeights.semiBold,
      fontSize: theme.typography.fontSizes.sm,
    },
  },
];
