import { EntityType } from "../../../constants/enum";
import basicDetailsIcon from "../../../assets/svgs/basic-details-icon.svg";
import { theme } from "@ui/ui-lib";
import { LookUpValues } from "../../../constants/lookupValues";

export const entityTypeLabels: Record<
  EntityType,
  { title: string; path?: string; label?: string }
> = {
  [EntityType.INSURER]: {
    title: "Insurer contact details",
    path: "/insurer",
    label: "Manage insurer contact",
  },
  [EntityType.TPA]: {
    title: "TPA contact details",
    path: "/tpa",
    label: "Manage TPA contact",
  },
  [EntityType.BROKER]: {
    title: "Broker contact details",
    path: "/broker",
    label: "Manage broker contact",
  },
};

export const contactDetailsConfig = (
  contactRecordTypeLid: number,
  resolvedLookupIds: Record<string, number>
) => {
  const {
    INSURER_CONTACT_RECORD_TYPE,
    TPA_CONTACT_RECORD_TYPE,
    BROKER_CONTACT_RECORD_TYPE,
  } = resolvedLookupIds;

  switch (contactRecordTypeLid) {
    case INSURER_CONTACT_RECORD_TYPE:
      return [
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Details",
          fields: [
            { label: "First name", key: "firstName" },
            { label: "Last name", key: "lastName" },
            { label: "Middle name", key: "middleName" },
            { label: "Department", key: "department" },
            { label: "Designation", key: "designation" },
            { label: "Remarks", key: "remarks", richText: true },
          ],
        },
        {
          fields: [{ label: "Remarks", key: "remarks", richText: true }],
          itemStyles: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(5),
            width: "80%",
            marginTop: theme.spacing(10),
          },
        },
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Communication details",
          fields: [
            { label: "Communication type", key: "communicationType" },
            { label: "Details", key: "communicationDetails" },
          ],
          isMultiple: true,
          dataKey: "communicationDetails",
        },
      ];

    case TPA_CONTACT_RECORD_TYPE:
    case BROKER_CONTACT_RECORD_TYPE:
      return [
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Details",
          fields: [
            { label: "First name", key: "firstName" },
            { label: "Last name", key: "lastName" },
            { label: "Middle name", key: "middleName" },
            { label: "Department", key: "department" },
            { label: "Designation", key: "designation" },
            { label: "Remarks", key: "remarks", richText: true },
          ],
        },
        {
          fields: [{ label: "Remarks", key: "remarks", richText: true }],
          itemStyles: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(5),
            width: "80%",
            marginTop: theme.spacing(10),
          },
        },
        {
          sectionImage: basicDetailsIcon,
          sectionTitle: "Communication details",
          fields: [
            { label: "Communication type", key: "communicationType" },
            { label: "Details", key: "communicationDetails" },
          ],
          isMultiple: true,
          dataKey: "communicationDetails",
        },
      ];

    default:
      return [];
  }
};

export const Breadcrumbs = (
  contactName?: string,
  contactRecordTypeLid?: number,
  resolvedLookupIds?: Record<string, number>
) => {
  if (!contactRecordTypeLid || !resolvedLookupIds) {
    return [
      { label: "Manage contact", path: "/contact" },
      { label: contactName || "Contact details" },
    ];
  }

  // Build reverse lookup from ID to EntityType key
  const lookupIdToEntityType: Partial<Record<number, EntityType>> = {
    [resolvedLookupIds.INSURER_CONTACT_RECORD_TYPE]: EntityType.INSURER,
    [resolvedLookupIds.TPA_CONTACT_RECORD_TYPE]: EntityType.TPA,
    [resolvedLookupIds.BROKER_CONTACT_RECORD_TYPE]: EntityType.BROKER,
  };

  const entityType = lookupIdToEntityType[contactRecordTypeLid];
  const entityConfig = entityType ? entityTypeLabels[entityType] : null;

  // Dynamically add ?contacts=true param for each entity type
  let path = entityConfig?.path || "/contact";
  if (entityConfig?.path === "/insurer") {
    path = "/insurer?contacts=true";
  } else if (entityConfig?.path === "/broker") {
    path = "/broker?contacts=true";
  } else if (entityConfig?.path === "/tpa") {
    path = "/tpa?contacts=true";
  }

  return [
    {
      label: entityConfig?.label || "Manage contact",
      path,
    },
    { label: contactName || "Contact details" },
  ];
};

export const contactSummaryConfig = (
  contactRecordTypeLid: number,
  resolvedLookupIds?: Record<string, number>
) => {
  const sharedSection = (label: string) => [
    {
      fields: [
        { label: "Company", key: "company" },
       // { label, key: "contactName" },
        { label: "Status", key: "status" },
        { label: "Contact tag", key: "contactTag" },
        { label: "Contact type", key: "contactType" },
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

  const contactTypeMap: Record<number, string> = {
    [resolvedLookupIds?.[LookUpValues.INSURER_CONTACT] ?? -1]: "Contact name",
    [resolvedLookupIds?.[LookUpValues.TPA_CONTACT] ?? -2]: "TPA contact",
    [resolvedLookupIds?.[LookUpValues.BROKER_CONTACT] ?? -3]: "Broker contact",
  };

  const label = contactTypeMap[contactRecordTypeLid] ?? "Contact";

  return sharedSection(label);
};
