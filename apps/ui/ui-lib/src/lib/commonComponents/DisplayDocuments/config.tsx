import { DATE_FORMATS, endPoints, formatDate } from "@ui/ui-lib";
import { StyledButton } from "../ActionButton/styles";
import downloadIcon from "../../assets/svgs/download-icon.svg";

export const defaultValues = {
  documentType: "",
  from: "",
  to: "",
};

export const smartSearchConfig = [
  {
    key: "documentType",
    name: "documentType",
    label: "Document type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("DOCUMENT_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "from",
    name: "from",
    label: "From date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select from date",
    },
  },
  {
    key: "to",
    name: "to",
    label: "To date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select to date",
    },
  },
];

export const columns = (handleFileDownload: (item: any) => void, isDownloadAllowed = true) => [
  {
    headerName: "File name",
    field: "fileName",
    tooltipField: "fileName",
    headerTooltip: "File name",
    flex: 3,
  },
  {
    headerName: "Document type",
    field: "documentType",
    tooltipField: "documentType",
    headerTooltip: "Document type",
    flex: 1.5,
    disableSort: true,
  },
  {
    headerName: "Activity name",
    field: "activityName",
    tooltipField: "activityName",
    headerTooltip: "Activity name",
    flex: 2,
  },
  {
    headerName: "Uploaded by",
    field: "uploadedBy",
    tooltipField: "uploadedBy",
    headerTooltip: "Uploaded by",
    flex: 2,
  },
  {
    headerName: "Uploaded on",
    field: "uploadedAt",
    headerTooltip: "Uploaded at",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
  },
  {
    headerName: "Download file",
    field: "actions",
    flex: 2,
    disableSort: true,
    tooltipValueGetter: ({}) => "",
    cellRenderer: (params: any) => {
      return (
        <div>
          {isDownloadAllowed && (
            <StyledButton
              variantType="secondary"
              onClick={() => handleFileDownload(params?.data)}
            >
              <img src={downloadIcon} alt="action-icon" />
            </StyledButton>
          )}
        </div>
      );
    },
  },
];
