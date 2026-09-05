import { DATE_FORMATS, endPoints, formatDate } from "@ui/ui-lib";
import { StyledButton } from "@ui/ui-lib/commonComponents/ActionButton/styles";
import downloadIcon from "@ui/ui-lib/assets/svgs/download-icon.svg";
import { environment } from "@ui/ui-lib/environment";
import { NestedFormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

export enum PolicyDocActivityType {
  INCEPTION = "Inception",
  ENDORSEMENT = "Endorsement",
  CLAIM = "Claim",
}

export const policyDocumentsColumns = (
  handleFileDownload: (item: any) => void,
  hasRbacPermission = true
) => {
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  return [
  {
    headerName: "OS Ticket Number",
    field: "osTicketNumber",
    tooltipField: "osTicketNumber",
    headerTooltip: "OS Ticket Number / Activity ID",
    flex: 2,
    valueFormatter: ({ value }: any) => value || "N/A",
    tooltipValueGetter: ({ value }: any) => value || "N/A",
  },
  {
    headerName: "File Name",
    field: "fileName",
    tooltipField: "fileName",
    headerTooltip: "File Name",
    flex: 3,
  },
  {
    headerName: "Document Name",
    field: "documentName",
    tooltipField: "documentName",
    headerTooltip: "Document Name",
    flex: 2,
  },
  {
    headerName: "Activity Name",
    field: "activityName",
    tooltipField: "activityName",
    headerTooltip: "Activity Name",
    flex: 2,
    valueFormatter: ({ value }: any) => value || "N/A",
    cellClass: ({ value }: any) => "clickable-cell",
  },
  {
    headerName: "Sub-Activity Name",
    field: "subActivityName",
    tooltipField: "subActivityName",
    headerTooltip: "Sub-Activity Name",
    flex: 2.5,
  },
  {
    headerName: "Uploaded By",
    field: "uploadedBy",
    tooltipField: "uploadedBy",
    headerTooltip: "Uploaded By",
    flex: 2,
  },
  {
    headerName: "Uploaded Date",
    field: "uploadedAt",
    headerTooltip: "Uploaded Date",
    flex: 1.5,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }: any) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
  },
  {
    headerName: "Download",
    field: "actions",
    flex: 1.5,
    tooltipValueGetter: ({}) => "",
    sortable: false,
    cellRenderer: (params: any) => {
      return (
        <div>
          {isDownloadAllowed && (
            <StyledButton
              variantType="secondary"
              onClick={() => handleFileDownload(params?.data)}
            >
              <img src={downloadIcon} alt="download-icon" />
            </StyledButton>
          )}
        </div>
      );
    },
  },
];
};

export const getUploadTabConfig = (
  handleAutoUpload: () => void,
  policyId: number
): NestedFormFieldConfig[] => [
  {
    key: "selectSection",
    enableSmartSearch: false,
    containerStyles: {
      paddingTop: "16px",
    },
    config: [
      {
        key: "policyDocumentType",
        name: "policyDocumentType",
        label: "Document Type",
        type: "select",
        apiDependencies: {
          endPoint: endPoints.lookUpByName("POLICY_UPLOAD_DOCUMENT_TYPE"),
          utilityFunction: (apiResponse: any) => {
            const data = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
            return data.map((item: any) => ({
              label: item.lookUpValue,
              value: item.lookUpValue?.toLowerCase().replace(/ /g, "_"),
            }));
          },
        },
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Document type is required" },
        },
        componentProps: {
          fullWidth: true,
          disablePortal: true,
        },
      },
    ],
  },
  {
    key: "uploadSection",
    enableSmartSearch: false,
    disableAllFields: "!selectSection?.policyDocumentType",
    config: [
      {
        key: "policyDocumentFile",
        name: "policyDocumentFile",
        label: "Upload Document",
        type: "documentupload",
        gridColumn: 9,
        hideDropdown: true,
        policyId,
        apiDependencies: {
          endPoint: endPoints.fileUpload,
        },
        rules: {
          required: { value: true, message: "Please upload a document" },
        },
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          requireDocumentType: false,
          maxLimit: 1,
          onUploadSuccess: handleAutoUpload,
          companyType: "policy",
        },
      },
    ],
  },
];