import { NOT_AVAILABLE, theme } from "@ui/ui-lib";
import { normalizeEntityType } from ".";
import { EntityType } from "../../../constants/enum";
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";


const HQ_LOOKUP_KEY = "INSURER_BRANCH_TYPE_HQ";

export const isHqAddress = (a: any) =>
  a?.branchType?.lookUpKey === HQ_LOOKUP_KEY ||
  a?.branchTypeLid?.lookUpKey === HQ_LOOKUP_KEY;

export const getHqSectionConfig = (addresses: any[]) => {
  const hq = (addresses || []).find(isHqAddress);
  if (!hq) return [];
  return [
    {
      sectionImage: basicDetailsIcon,
      sectionTitle: "Head Quarters Details",
      fields: [
        { label: "Branch type", getFormattedValue: () => hq.branchType?.lookUpValue || "--" },
        { label: "Branch code", getFormattedValue: () => hq.branchCode || "--" },
        { label: "Branch name", getFormattedValue: () => hq.branchName || "--" },
        { label: "Address", getFormattedValue: () => hq.address1 || "--" },
        { label: "City", getFormattedValue: () => hq.cityId?.name || "--" },
        { label: "State", getFormattedValue: () => hq.stateId?.name || "--" },
        { label: "Pin code", getFormattedValue: () => hq.pinCode || "--" },
        { label: "Phone number", getFormattedValue: () => hq.phoneNumber || "--" },
        { label: "Email", getFormattedValue: () => hq.email || "--" },
        { label: "Support number", getFormattedValue: () => hq.supportNumber || "--" },
      ],
    },
  ];
};


export const getGstSectionConfig = (gstDetails: any[]) =>
  (gstDetails || []).map((gst, idx) => ({
    ...(idx === 0 && { sectionImage: basicDetailsIcon, sectionTitle: "GST details" }),
    fields: [
      {
        label: "State",
        getFormattedValue: () => gst.state?.name || "--",
      },
      {
        label: "GST number",
        getFormattedValue: () => gst.gstNumber || "--",
      },
      {
        label: "Category",
        getFormattedValue: () => gst.gstCategory?.lookUpValue || "--",
      },
    ],
  }));

export interface InsurerContact {
  firstName: string;
  lastName: string;
  email: string;
  contactAddresses: {
    phoneNumber: string;
  }[];
}

export const entityTypeLabels: Record<
  EntityType,
  {
    title: string;
    buttonText: string;
    path?: string;
    label?: string;
    titleKey?: string;
  }
> = {
  [EntityType.INSURER]: {
    title: "Insurer details",
    buttonText: "Update insurer",
    path: "/insurer",
    label: "Manage insurer",
    titleKey: "insurerName",
  },
  [EntityType.TPA]: {
    title: "TPA details",
    buttonText: "Update TPA",
    path: "/tpa",
    label: "Manage TPA",
    titleKey: "tpaName",
  },
  [EntityType.BROKER]: {
    title: "Broker details",
    buttonText: "Update broker",
    path: "/broker",
    label: "Manage broker",
    titleKey: "brokerName",
  },
};

export const getSectionConfig = (entityType: string) => {
  switch (entityType) {
    case "insurer":
      return [
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Insurer details",
          fields: [
            { label: "Insurer name", key: "insurerName" },

            { label: "Company type", key: "companyType.lookUpValue" },

            {
              label: "Website",
              key: "website",
              getFormattedValue: (data) => data?.website || NOT_AVAILABLE,
              isLink: true,
            },
            { label: "Country", key: "country.name" },
          ],
        },
        {
          fields: [{ label: "Remarks", key: "remarks", richText: true }],
          itemStyles: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(5),
            width: "80%",
            marginTop: theme.spacing(0),
          },
        },
      ];
    case "tpa":
      return [
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "TPA details",
          fields: [
            {
              label: "TPA name",
              key: "tpaName",
            },
            {
              label: "Company type",
              key: "companyType.lookUpValue",
            },

            {
              label: "Website",
              key: "website",
              isLink: true,
            },
            { label: "Country", key: "country.name" },
          ],
        },
        {
          fields: [{ label: "Remarks", key: "remarks", richText: true }],
          itemStyles: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(10),
            width: "80%",
            marginTop: theme.spacing(0),
          },
        },
      ];
    case "broker":
      return [
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Broker details",
          fields: [
            {
              label: "Broker name",
              key: "brokerName",
            },
            {
              label: "Company type",
              key: "companyType.lookUpValue",
            },

            {
              label: "Website",
              key: "website",
              isLink: true,
            },
            { label: "Country", key: "country.name" },
          ],
        },
        {
          fields: [{ label: "Remarks", key: "remarks", richText: true }],
          itemStyles: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(10),
            width: "80%",
            marginTop: theme.spacing(0),
          },
        },
      ];
    default:
      return [];
  }
};

export const contactTabsConfig = [
  {
    label: "Contact information",
    sectionKey: "contactInformation",
  },
  {
    label: "Personal details",
    sectionKey: "personalDetails",
  },
  {
    label: "Professional experience",
    sectionKey: "professionalExperience",
  },
];

export const Breadcrumbs = (
  contactName?: string,
  rawEntityType?: string,
  from?: string
) => {
  const entityType = normalizeEntityType(rawEntityType);

  // Get the entity-specific configuration from entityTypeLabels
  const entityConfig = entityType ? entityTypeLabels[entityType] : null;

  const entityPath = entityConfig?.path || "/insurer";

  const isFromContact =
    from === "insurerContact" ||
    from === "tpaContact" ||
    from === "brokerContact";

  let path = entityPath;
  if (from=== "insurerContact") {
    path = "/insurer?contacts=true";
  } else if (from === "brokerContact") {
    path = "/broker?contacts=true";
  } else if (from === "tpaContact") {
    path = "/tpa?contacts=true";
  }
  return [
    {
      label:
        entityConfig?.label + (isFromContact ? " contact" : "") ||
        "Manage Entities",
      path: path,
    },
    { label: contactName || "Contact Details" },
  ];
};

export const getSummaryConfig = (entityType: string) => {
  switch (entityType) {
    case "insurer":
      return [
        {
          fields: [
            {
              label: "Insurer code",
              key: "insureCode",
            },

            {
              label: "Insurance company type",
              key: "isLife",
            },

            {
              label: "Company tag",
              key: "tag",
            },
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
    case "tpa":
      return [
        {
          fields: [
            {
              label: "Company type",
              key: "companyType",
            },
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
    case "broker":
      return [
        {
          fields: [
            {
              label: "Company type",
              key: "companyType",
            },
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
    default:
      return [];
  }
};
