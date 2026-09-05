import { ColDef } from "ag-grid-community";
import { theme, useLookupIdByKey } from "@ui/ui-lib";
import { LookUpValues } from "../../../constants/lookupValues";

type FormFieldType = "text" | "select" | "date" | "checkbox";

interface FormFieldConfig {
  key: string;
  name: string;
  label: string;
  type: FormFieldType;
  gridColumn?: number;
  componentProps?: Record<string, string | number | boolean | undefined>;
  options?: Array<{ label: string; value: string | number }>;
}

interface OverallData {
  totalCompanies?: number;
  totalContacts?: number;
}

export const getDynamicTitle = (
  contactRecordTypeLid: number,
  type: "manage" | "list",
  resolvedLookupIds: Record<string, number>
): string => {
  const matchedKey = Object.entries(resolvedLookupIds).find(
    ([_, id]) => id === contactRecordTypeLid
  )?.[0];

  let entityLabel = "";

  switch (matchedKey) {
    case LookUpValues.INSURER_CONTACT:
      entityLabel = "Insurer";
      break;
    case LookUpValues.BROKER_CONTACT:
      entityLabel = "Broker";
      break;
    case LookUpValues.TPA_CONTACT:
      entityLabel = "TPA";
      break;
    default:
      entityLabel = "";
      break;
  }

  const label = entityLabel.trim();

  if (!label) return "";

  if (type === "manage") {
    return `Add ${label === "TPA" ? label : label.toLowerCase()} contact`;
  } else if (type === "list") {
    return `${label} contact list`;
  }

  return "";
};

export const insurerKPIData = (
  overallData: OverallData,
  totalRows: number,
  contactRecordTypeLid: number,
  resolvedLookupIds: Record<string, number>
) => {
  const matchedKey = Object.entries(resolvedLookupIds).find(
    ([_, id]) => id === contactRecordTypeLid
  )?.[0];

  switch (matchedKey) {
    case LookUpValues.INSURER_CONTACT:
      return [
        {
          title: "Total insurer contacts",
          count: overallData?.totalContacts ?? 0,
          percentage: ((overallData?.totalContacts ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: "Total insurer companies",
          count: overallData?.totalCompanies ?? 0,
          percentage: ((overallData?.totalCompanies ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
      ];
    case LookUpValues.TPA_CONTACT:
      return [
        {
          title: "Total TPA contacts",
          count: overallData?.totalContacts ?? 0,
          percentage: ((overallData?.totalContacts ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: "Total TPA companies",
          count: overallData?.totalCompanies ?? 0,
          percentage: ((overallData?.totalCompanies ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
      ];
    case LookUpValues.BROKER_CONTACT:
      return [
        {
          title: "Total broker contacts",
          count: overallData?.totalContacts ?? 0,
          percentage: ((overallData?.totalContacts ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.purple,
          textColor: theme.palette.text.purple,
        },
        {
          title: "Total broker companies",
          count: overallData?.totalCompanies ?? 0,
          percentage: ((overallData?.totalCompanies ?? 0) / totalRows) * 100,
          backgroundColor: theme.palette.kpiColors.yellow,
          textColor: theme.palette.text.yellow,
        },
      ];
    default:
      return [];
  }
};

export const tableSearchConfig = (
  contactRecordTypeLid: number,
  resolvedLookupIds: Record<string, number>
): FormFieldConfig[] => {
  const matchedKey = Object.entries(resolvedLookupIds).find(
    ([_, id]) => id === contactRecordTypeLid
  )?.[0];

  switch (matchedKey) {
    case LookUpValues.INSURER_CONTACT:
      return []; // return insurer-specific config
    case LookUpValues.TPA_CONTACT:
      return []; // return tpa-specific config
    case LookUpValues.BROKER_CONTACT:
      return []; // return broker-specific config
    default:
      return [];
  }
};

export const searchDefaultValues = {
  CompanyId: "",
  contactName: "",
  phone: "",
  status: "",
};

interface CommunicationDetails {
  isPrimary: boolean;
  communicationType: string;
  communicationDetails: string;
}

interface DataWithCommunicationDetails {
  communicationDetails: CommunicationDetails[];
}

interface DataWithDepartment extends DataWithCommunicationDetails {
  department?: { name: string };
  designation?: { name: string };
  status?: { lookUpValue: string };
}
interface InsurerContactData extends DataWithDepartment {
  contactName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
}

export const getColumnsByContactRecordTypeLid = <T extends InsurerContactData>(
  contactRecordTypeLid: number,
  resolvedLookupIds: Record<string, number>
): ColDef<T>[] => {
  switch (contactRecordTypeLid) {
    case resolvedLookupIds[LookUpValues.INSURER_CONTACT]:
      return [
        {
          headerName: "Insurer Contact Name",
          field: "contactName" as ColDef<T>["field"],
          cellClass: "clickable-cell",
          tooltipValueGetter: (params) => params.data?.contactName || "--",
          headerTooltip: "Insurer Contact Name",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "Insurer Company Name",
          field: "companyName" as ColDef<T>["field"],
          tooltipValueGetter: (params) => params.data?.companyName || "--",
          headerTooltip: "Insurer Company Name",
          valueFormatter: ({ value }) => value || "--",
          cellClass: "clickable-cell",
          flex: 1,
        },
        {
          headerName: "Phone No",
          field: "phone" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          headerTooltip: "Phone Number",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "Email",
          field: "email" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          headerTooltip: "Email Address",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "Department",
          field: "department" as ColDef<T>["field"],
          headerTooltip: "Department",
          tooltipValueGetter: (params) => params.data?.department ?? "--",
          valueGetter: (params) => params.data?.department ?? "--",
          flex: 1,
        },
        {
          headerName: "Designation",
          field: "designation" as ColDef<T>["field"],
          headerTooltip: "Designation",
          tooltipValueGetter: (params) => params.data?.designation ?? "--",
          valueGetter: (params) => params.data?.designation ?? "--",
          flex: 1,
        },
        {
          headerName: "Status",
          field: "status" as ColDef<T>["field"],
          tooltipValueGetter: (params) =>
            params.data?.status?.lookUpValue ?? "--",
          headerTooltip: "Status",
          valueGetter: (params) => params.data?.status?.lookUpValue ?? "--",
          flex: 1,
        },
      ];

    case resolvedLookupIds[LookUpValues.TPA_CONTACT]:
      return [
        {
          headerName: "TPA Contact Name",
          field: "contactName" as ColDef<T>["field"],
          cellClass: "clickable-cell",
          tooltipValueGetter: (params) => params.data?.contactName || "--",
          headerTooltip: "TPA Contact Name",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "TPA Company Name",
          field: "companyName" as ColDef<T>["field"],
          tooltipValueGetter: (params) => params.data?.companyName || "--",
          headerTooltip: "TPA Company Name",
          valueFormatter: ({ value }) => value || "--",
          cellClass: "clickable-cell",
          flex: 1,
        },
        {
          headerName: "Phone No",
          field: "phone" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          headerTooltip: "Phone Number",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "Email",
          field: "email" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          headerTooltip: "Email Address",
          flex: 1,
        },
        {
          headerName: "Department",
          field: "department" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.department ?? "--",
          tooltipValueGetter: (params) => params.data?.department ?? "--",
          headerTooltip: "Department",
          flex: 1,
        },
        {
          headerName: "Designation",
          field: "designation" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.designation ?? "--",
          tooltipValueGetter: (params) => params.data?.designation ?? "--",
          headerTooltip: "Designation",
          flex: 1,
        },
        {
          headerName: "Status",
          field: "status" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.status?.lookUpValue ?? "--",
          tooltipValueGetter: (params) =>
            params.data?.status?.lookUpValue ?? "--",
          headerTooltip: "Status",
          flex: 1,
        },
      ];

    case resolvedLookupIds[LookUpValues.BROKER_CONTACT]:
      return [
        {
          headerName: "Broker Contact Name",
          field: "contactName" as ColDef<T>["field"],
          cellClass: "clickable-cell",
          tooltipValueGetter: (params) => params.data?.contactName || "--",
          headerTooltip: "Broker Contact Name",
          valueFormatter: ({ value }) => value || "--",
          flex: 1,
        },
        {
          headerName: "Broker Company Name",
          field: "companyName" as ColDef<T>["field"],
          tooltipValueGetter: (params) => params.data?.companyName || "--",
          headerTooltip: "Broker Company Name",
          valueFormatter: ({ value }) => value || "--",
          cellClass: "clickable-cell",
          flex: 1,
        },
        {
          headerName: "Phone No",
          field: "phone" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "phone"
            )?.communicationDetails ?? "--",
          headerTooltip: "Phone Number",
          flex: 1,
        },
        {
          headerName: "Email",
          field: "email" as ColDef<T>["field"],
          sortable: false,
          valueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          tooltipValueGetter: (params) =>
            params?.data?.communicationDetails.find(
              (each: CommunicationDetails) => each.communicationType === "email"
            )?.communicationDetails ?? "--",
          headerTooltip: "Email Address",
          flex: 1,
        },
        {
          headerName: "Department",
          field: "department" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.department ?? "--",
          tooltipValueGetter: (params) => params.data?.department?.name ?? "--",
          headerTooltip: "Department",
          flex: 1,
        },
        {
          headerName: "Designation",
          field: "designation" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.designation ?? "--",
          tooltipValueGetter: (params) =>
            params.data?.designation?.name ?? "--",
          headerTooltip: "Designation",
          flex: 1,
        },
        {
          headerName: "Status",
          field: "status" as ColDef<T>["field"],
          valueGetter: (params) => params.data?.status?.lookUpValue ?? "--",
          tooltipValueGetter: (params) =>
            params.data?.status?.lookUpValue ?? "--",
          headerTooltip: "Status",
          flex: 1,
        },
      ];

    default:
      return [];
  }
};
