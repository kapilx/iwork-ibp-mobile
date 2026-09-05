import { ColDef } from "ag-grid-community";
import { Box, IconButton } from "@mui/material";
import { EllipsisSpan, StyledDownloadContainer } from "./styles";
import DownloadIcon from "../../assets/svgs/download-icon.svg";

export const columns: ColDef[] = [
    {
      field: "date",
      headerName: "Date",
      valueGetter: (params) => {
        const raw = params.data?.date;
        if (!raw) return "--";
        const d = new Date(raw);
        return isNaN(d.getTime())
          ? "--"
          : new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(d);
      },
      // width: 120
      disableSort: true,
    },
    {
      field: "filename",
      headerName: "Filename",
      valueGetter: (params) => params.data.sourceFile?.fileName,
      // width: 300
      disableSort: true,
    },
    {
      field: "records",
      headerName: "No. of Records",
      valueGetter:(params) => params.data.successCount + params.data.errorCount,
      // width: 130
      disableSort: true,
    },
    {
      field: "success",
      headerName: "Success",
      valueGetter: (params) => params.data.successCount,
      // width: 100
    },
    {
      field: "reject",
      headerName: "Reject",
      valueGetter: (params) => params.data.errorCount,
      // width: 100
    },

       {
      field: "errorFile",
      headerName: "Error File",
      cellClass: "clickable-cell",
      tooltipValueGetter: () => "Download Error File",
      // width: 300
      cellRenderer: (params: any) => {
        const row = params.data;
        if (row.errorFile && row.errorFile.fileName !== "-") {
          return (
            <StyledDownloadContainer data-testid={`error-file-policy-employee-data-${row.errorFile.id}`}>
              <EllipsisSpan title={row.errorFile.fileName}>{row.errorFile.fileName}</EllipsisSpan>
              <IconButton
                size="small"
                color="primary"
              >
                <img src={DownloadIcon} alt="Download Error File" />
              </IconButton>
            </StyledDownloadContainer>
          );
        }
        return <span>-</span>;
      },
      disableSort: true,
    },
    {
      field: "status",
      headerName: "Status",
      valueGetter: (params) => params.data.documentProcessingFile?.processStatus,
      // width: 120
    },
];
  
export const documentTypeOptions = [
  { value: "policy_employee_data", label: "Employee Data" },
  { value: "policy_employee_enrollment_data", label: "Employee Enrollment Data" },
]