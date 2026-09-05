import { Box, CircularProgress, LinearProgress, styled } from "@mui/material";
import { DATE_FORMATS, endPoints, formatDate, Table } from "@ui/ui-lib";
import { useFileUpload } from "@ui/ui-lib/hooks/useFileUpload";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { ColDef } from "ag-grid-community";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import DownloadIcon from "../../assets/svgs/download-icon.svg";
import RefreshIcon from "../../assets/svgs/refresh-icon.svg";
import ThrashIcon from "../../assets/svgs/trash-icon.svg";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { environment } from "@ui/ui-lib/environment";
import { getUserFullNameFromStorage } from "../FormComponent/Fields/DocumentUploadField";
import { CommonActionIcon } from "./styles";

type UploadedFileRecord = {
  fileUpload?: {
    id?: number | string;
    fileName?: string;
    uploadedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    uploadedBy?: string;
    owner?: string;
    createdBy?: string;
  };
  documentId?: number | string;
  documentType?: number | string;
  documentTypeLid?: number | string;
  documentName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  companyType?: string;
  companyId?: number | string;
  opportunityId?: number | string;
  opportunityActivityId?: number | string;
  policyId?: number | string;
  claimActivityId?: number | string;
  [key: string]: any;
};

type TableRow = {
  id: number | string;
  documentType: string;
  documentName: string;
  uploadedBy: string;
  uploadedAt: string | null;
  file: UploadedFileRecord;
};

const ActionCellContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  width: "100%",
}));

const HiddenFileInput = styled("input")({
  display: "none",
});

const ActionCell: React.FC<{
  file: UploadedFileRecord;
  onReplace: (oldFileId: string, newFile: any) => void;
  onDelete: (fileId: string) => void;
  disableAllFields?: boolean;
  hideDropdown?: boolean;
  accept?: string;
  downloadModuleKey?: string;
  isDownloadAllowed?: boolean;
  replaceEndpoint?: string;
  replaceMethod?: "POST" | "PUT";
  getFileDownloadUrl?: (fileId: number) => string;
}> = ({
  file,
  onReplace,
  onDelete,
  disableAllFields,
  hideDropdown,
  accept,
  downloadModuleKey,
  isDownloadAllowed: isDownloadAllowedProp,
  replaceEndpoint,
  replaceMethod = "PUT",
  getFileDownloadUrl,
}) => {
  const dispatch = useDispatch();
  const hasRbacPermissionDownload = useHasPermission(FeatureKey.EXPORT_UPLOADED_FILES);
  const permissionDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermissionDownload;
  const isDownloadAllowed = isDownloadAllowedProp ?? permissionDownloadAllowed;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const { handleFileUpload, loading } = useFileUpload(
    file?.fileUpload,
    "",
    hideDropdown,
    replaceEndpoint,
    replaceMethod
  );

  useEffect(() => {
    if (!loading) {
      setIsReplacing(false);
    }
  }, [loading]);

  if (!file?.fileUpload?.id) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const downloadUrl = downloadModuleKey
        ? `${(getFileDownloadUrl?.(Number(file.fileUpload?.id)) ??
            `${endPoints.fileUploadDownload}/${file.fileUpload?.id}/download`)}?moduleKey=${encodeURIComponent(
            downloadModuleKey
          )}`
        : getFileDownloadUrl?.(Number(file.fileUpload?.id)) ??
          `${endPoints.fileUploadDownload}/${file.fileUpload?.id}/download`;
      const response = await apiRequest(
        downloadUrl,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      const blob = response.data as Blob;
      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        dispatch(
          setToastMessage("Download failed — server returned an error page.")
        );
        return;
      }

      let filename = file?.fileUpload?.fileName || "download";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"\n]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const handleReplaceInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setIsReplacing(true);
      handleFileUpload(
        selectedFile,
        file.companyType ?? "",
        file.companyId ?? "",
        (file.documentType ?? file.documentTypeLid ?? "") as string,
        (uploadedFileData: any) => {
          onReplace(String(file.fileUpload?.id), {
            fileUpload: uploadedFileData,
            documentType: file.documentType ?? file.documentTypeLid,
            documentName: file.documentName,
            companyType: file.companyType,
            companyId: file.companyId,
            opportunityId: file.opportunityId,
            opportunityActivityId: file.opportunityActivityId,
            policyId: file.policyId,
            claimActivityId: file.claimActivityId,
            documentId: file.documentId ?? uploadedFileData?.id,
            uploadedAt:
              uploadedFileData?.uploadedAt ??
              uploadedFileData?.createdAt ??
              uploadedFileData?.updatedAt ??
              new Date().toISOString(),
            uploadedBy:
              uploadedFileData?.uploadedBy ??
              uploadedFileData?.owner ??
              uploadedFileData?.createdBy ??
              file.uploadedBy ??
              "",
          });
        },
        file.opportunityId,
        file.opportunityActivityId,
        file.policyId,
        file.claimActivityId
      );
      event.target.value = "";
    }
  };

  const handleRefresh = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (file?.fileUpload?.id) {
      onDelete(String(file.fileUpload.id));
    }
  };

  return (
    <ActionCellContainer>
      <label htmlFor={`replace-file-${file.fileUpload?.id}`} hidden>
        Replace file
      </label>
      <HiddenFileInput
        id={`replace-file-${file.fileUpload?.id}`}
        ref={fileInputRef}
        type="file"
        onChange={handleReplaceInputChange}
        accept={accept}
      />
      {isReplacing && loading ? (
        <CircularProgress size={20} />
      ) : (
        <>
          {isDownloadAllowed && (
            <CommonActionIcon
              src={DownloadIcon}
              alt="download"
              onClick={handleDownload}
            />
          )}
          {!disableAllFields && (
            <>
              <CommonActionIcon
                src={RefreshIcon}
                alt="replace"
                onClick={handleRefresh}
              />
              <CommonActionIcon
                src={ThrashIcon}
                alt="delete"
                onClick={handleDelete}
              />
            </>
          )}
        </>
      )}
    </ActionCellContainer>
  );
};

const formatUploadedDate = (value: string | null | undefined) => {
  if (!value) {
    return "--";
  }

  try {
    return formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR);
  } catch (error) {
    console.error("Failed to format date", error);
    return "--";
  }
};

interface UploadedDocumentsTableProps {
  files: UploadedFileRecord[];
  onReplace: (oldFileId: string, newFile: any) => void;
  onDelete: (fileId: string) => void;
  disableAllFields?: boolean;
  hideDropdown?: boolean;
  accept?: string;
  downloadModuleKey?: string;
  isDownloadAllowed?: boolean;
  replaceEndpoint?: string;
  replaceMethod?: "POST" | "PUT";
  getFileDownloadUrl?: (fileId: number) => string;
}

const UploadedDocumentsTable: React.FC<UploadedDocumentsTableProps> = ({
  files,
  onReplace,
  onDelete,
  disableAllFields,
  hideDropdown,
  accept,
  downloadModuleKey,
  isDownloadAllowed,
  replaceEndpoint,
  replaceMethod = "PUT",
  getFileDownloadUrl,
}) => {
  console.log("files", files);

  const tableRows = useMemo<TableRow[]>(() => {
    return (files ?? []).filter(Boolean).map((file, index) => {
      const fileExtension = (
        (file?.fileUpload?.fileName || file?.documentName).split(".").pop() ||
        ""
      ).toLowerCase();

      const uploadedAtValue = file.uploadedAt ?? null;

      const uploadedByValue = file.uploadedBy ?? getUserFullNameFromStorage();

      const documentName =
        file.fileUpload?.fileName ?? file.documentName ?? "--";

      console.log(documentName, "documentName");

      return {
        id: (file.fileUpload?.id ?? file.documentId ?? index) as
          | string
          | number,
        documentType: fileExtension,
        documentName,
        uploadedBy: uploadedByValue || "--",
        uploadedAt: uploadedAtValue,
        file,
      };
    });
  }, [files]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setSortModel] = useState<{ colId: string; sort: "asc" | "desc" }[]>(
    []
  );

  const pageSizeOptions = useMemo(() => {
    const baseOptions = [5, 10, 20];
    if (tableRows.length > 0 && !baseOptions.includes(tableRows.length)) {
      return [...baseOptions, tableRows.length].sort((a, b) => a - b);
    }
    return baseOptions;
  }, [tableRows.length]);

  useEffect(() => {
    setCurrentPage(1);
    if (!pageSizeOptions.includes(pageSize)) {
      setPageSize(pageSizeOptions[0]);
    }
  }, [tableRows.length, pageSizeOptions, pageSize]);

  const columns = useMemo<ColDef<TableRow>[]>(
    () => [
      {
        headerName: "Document name",
        field: "documentName",
        tooltipField: "documentName",
        flex: 2,
        sortable: false,
      },
      {
        headerName: "Uploaded by",
        field: "uploadedBy",
        tooltipField: "uploadedBy",
        flex: 1.5,
        valueGetter: (params) => params.data.uploadedBy || "--",
        sortable: false,
      },
      {
        headerName: "Uploaded on",
        field: "uploadedAt",
        flex: 1.2,
        valueFormatter: ({ value }) => formatUploadedDate(value),
        tooltipValueGetter: ({ value }) => formatUploadedDate(value),
        sortable: false,
      },
      {
        headerName: "Actions",
        field: "actions",
        flex: 1,
        sortable: false,
        suppressMenu: true,
        tooltipValueGetter: () => null,
        cellRenderer: (params: any) => (
          <ActionCell
            file={params.data.file}
            onReplace={onReplace}
            onDelete={onDelete}
            disableAllFields={disableAllFields}
            hideDropdown={hideDropdown}
            accept={accept}
            downloadModuleKey={downloadModuleKey}
            isDownloadAllowed={isDownloadAllowed}
            replaceEndpoint={replaceEndpoint}
            replaceMethod={replaceMethod}
            getFileDownloadUrl={getFileDownloadUrl}
          />
        ),
      },
    ],
    [
      onReplace,
      onDelete,
      disableAllFields,
      hideDropdown,
      accept,
      downloadModuleKey,
      isDownloadAllowed,
      replaceEndpoint,
      replaceMethod,
      getFileDownloadUrl,
    ]
  );

  return (
    <Table
      columns={columns}
      rowData={tableRows}
      totalRows={tableRows.length}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      loading={false}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      setPageSize={setPageSize}
      onCellClicked={() => {}}
      components={{}}
      setSort={setSortModel}
      domLayout="autoHeight"
      displaySettingsButton={false}
      enableSaveView={false}
    />
  );
};

export default UploadedDocumentsTable;
