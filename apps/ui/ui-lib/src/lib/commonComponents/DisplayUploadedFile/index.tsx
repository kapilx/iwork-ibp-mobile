import PdfIcon from "../../assets/svgs/pdf-icon.svg";
import DownloadIcon from "../../assets/svgs/download-icon.svg";
import PreviewIcon from "../../assets/svgs/eye-icon-sm.svg"
import RefreshIcon from "../../assets/svgs/refresh-icon.svg";
import ThrashIcon from "../../assets/svgs/trash-icon.svg";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { environment } from "@ui/ui-lib/environment";
import {
  CommonActionIcon,
  CommonTypography,
  DisplayUploadedFileContainer,
  DocumentActionsContainer,
  DocumentDetailsContainer,
  SpanTypography,
  UploadedFileStyledSelect,
  UploadFileContainer,
} from "./styles";
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./visuallyHidden.css";
import { useFileUpload } from "@ui/ui-lib/hooks/useFileUpload.js";
import DocIcon from "../../assets/svgs/doc-icon.svg";
import VideoIcon from "../../assets/svgs/video-icon.svg";
import ExcelIcon from "../../assets/svgs/excel-icon.svg";
import PowerPointIcon from "../../assets/svgs/powerPoint-icon.svg";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib/redux/slice";

import {
  FILE_URL_OR_BUFFER_IS_MISSING,
  INVALID_BASE64_FILE_BUFFER,
  SELECT_DOCUMENT_TYPE,
  SELECT_NEW_FILE,
  UNSUPPORTED_FILE_BUFFER_TYPE,
} from "../../constants";
import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";

export interface DocumentUploadProps {
  file: any;
  onReplace: (oldFileId: string, newFile: any) => void;
  onDelete: (fileId: string) => void;
  disableAllFields?: boolean; // To disable all fields in the form
  hideDropdown?: boolean; // To hide the dropdown for document type selection
  customVariant?: string;
  accept?: string; // prop to specify accepted file types
  downloadModuleKey?: string;
  isDownloadAllowed?: boolean;
  replaceEndpoint?: string;
  replaceMethod?: "POST" | "PUT";
  getFileDownloadUrl?: (fileId: number) => string;
}

const DisplayUploadedFile: React.FC<DocumentUploadProps> = ({
  file,
  onReplace,
  onDelete,
  disableAllFields,
  hideDropdown = false, // New prop to hide the dropdown
  customVariant,
  accept,
  downloadModuleKey,
  isDownloadAllowed: isDownloadAllowedProp,
  replaceEndpoint,
  replaceMethod = "PUT",
  getFileDownloadUrl,
}) => {
  const dispatch = useDispatch();
  const hasRbacPermissionDownload = useHasPermission(FeatureKey.EXPORT_CLAIMS);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermissionDownload;
  const [isReplacing, setIsReplacing] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [excelHtml, setExcelHtml] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileExtension = (
    (file?.fileUpload?.fileName || file?.documentName || "").split(".").pop() || ""
  ).toLowerCase();

  const [documentTypeOptions, setDocumentTypeOptions] = useState<
    {
      id: string;
      lookUpName: string;
      lookUpValue: string;
      lookUpkey: string;
    }[]
  >([]);

  const { data: documentTypeData, isLoading: isDocTypeLoading } = useApiQuery({
    queryKey: ["documentType"],
    url: endPoints.lookUpByName("DOCUMENT_TYPE"),
  });

  useEffect(() => {
    if (documentTypeData?.data?.length) {
      setDocumentTypeOptions(documentTypeData.data);
    }
  }, [documentTypeData]);

  const selectedDocumentType = documentTypeOptions?.find(
    (option) =>
      String(option.id) === String(file?.documentType) ||
      String(option.lookUpValue) === String(file?.documentType)
  );

  const { handleFileUpload, uploadedFile, loading } = useFileUpload(
    file?.fileUpload,
    "",
    hideDropdown,
    replaceEndpoint,
    replaceMethod
  );

  // Strips the Unix-timestamp prefix (e.g. "1782802165319_report.pdf")
  // and formats as "report.pdf - 30/06/2026".
  const formatFileName = (raw: string): string => {
    if (!raw) return raw;
    const match = raw.match(/^(\d{10,})_(.+)$/);
    if (match) {
      const parsed = new Date(Number(match[1]));
      if (isNaN(parsed.getTime())) return raw;
      const date = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
      }).format(parsed);
      return `${match[2]} - ${date}`;
    }
    return raw;
  };

  // uploadedFile is updated synchronously (before parent re-renders) when a
  // replace completes, so it always reflects the latest file name.
  const rawFileName =
    uploadedFile?.fileName ||
    file?.fileUpload?.fileName ||
    file?.documentName ||
    "";
  const displayFileName = formatFileName(rawFileName);

  useEffect(() => {
    if (!loading) setIsReplacing(false);
  }, [loading]);

  const handleReplaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setIsReplacing(true);
      handleFileUpload(
        selectedFile,
        file.companyType,
        file.companyId ?? "",
        file.documentType,
        (uploadedFileData: any) => {
          onReplace(file.fileUpload.id, {
            fileUpload: uploadedFileData,
            documentType: file.documentType,
            documentName: file.documentName,
            companyType: file.companyType,
            companyId: file.companyId,
            opportunityId: file.opportunityId,
            opportunityActivityId: file.opportunityActivityId,
            policyId: file.policyId,
            claimActivityId: file.claimActivityId,
          });
        },
        file.opportunityId,
        file.opportunityActivityId,
        file.policyId,
        file.claimActivityId
      );
      e.target.value = "";
    }
  };

  const handleDownload = async () => {
    try {
      const downloadUrl = downloadModuleKey
        ? `${(getFileDownloadUrl?.(Number(file?.fileUpload.id)) ??
            `${endPoints.fileUploadDownload}/${file?.fileUpload.id}/download`)}?moduleKey=${encodeURIComponent(
          downloadModuleKey
        )}`
        : getFileDownloadUrl?.(Number(file?.fileUpload.id)) ??
          `${endPoints.fileUploadDownload}/${file?.fileUpload.id}/download`;
      const response = await apiRequest(
        downloadUrl,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      // Ensure response.data is used to create the Blob
      const blob = response.data as Blob;

      // Check if the response is valid and not an error page
      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        console.error("Received HTML instead of file:", text);
        dispatch(
          setToastMessage("Download failed — server returned an error page.")
        );
        return;
      }

      // Extract filename from Content-Disposition header
      let filename = file?.fileUpload?.fileName || "download";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Create a URL for the Blob and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename.replace(/^\d+_/, "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const EXCEL_TYPES = ["xlsx", "xls", "csv"];

  const handlePreview = async () => {
    try {
      const downloadUrl = downloadModuleKey
        ? `${(getFileDownloadUrl?.(Number(file?.fileUpload.id)) ??
            `${endPoints.fileUploadDownload}/${file?.fileUpload.id}/download`)}?moduleKey=${encodeURIComponent(downloadModuleKey)}`
        : getFileDownloadUrl?.(Number(file?.fileUpload.id)) ??
          `${endPoints.fileUploadDownload}/${file?.fileUpload.id}/download`;
      const response = await apiRequest(downloadUrl, { method: "GET", responseType: "blob" });
      const blob = response.data as Blob;

      if (EXCEL_TYPES.includes(fileExtension)) {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const html = XLSX.utils.sheet_to_html(firstSheet, { header: "", footer: "" });
        setExcelHtml(html);
      } else {
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      }
    } catch {
      dispatch(setToastMessage("Preview failed. Try again."));
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setExcelHtml(null);
  };

  const handleRefresh = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDelete = () => {
    onDelete(file?.fileUpload.id);
  };

  const renderFileType = (fileExtension: String) => {
    switch (fileExtension) {
      case "pdf":
        return <img src={PdfIcon} alt="file type" />;
      case "doc":
      case "docx":
        return <img src={DocIcon} alt="file type" />;
      case "xls":
      case "xlsx":
        return <img src={ExcelIcon} alt="file type" />;
      case "ppt":
      case "pptx":
        return <img src={PowerPointIcon} alt="file type" />;
      case "mp4":
        return <img src={VideoIcon} alt="file type" />;
      default:
        return <img src={PdfIcon} alt="file type" />;
    }
  };

  return (
    <>
      <label htmlFor="refresh-file-input" className="visually-hidden">
        {SELECT_NEW_FILE}
      </label>
      <input
        id="refresh-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleReplaceInputChange}
        title="Select new file"
        tabIndex={-1}
        aria-hidden="true"
        className="visually-hidden"
        {...(accept && { accept })}
      />
      <UploadFileContainer>
        {!isReplacing && !loading && selectedDocumentType && (
          <UploadedFileStyledSelect
            value={selectedDocumentType.id}
            fullWidth
            disabled
          >
            {selectedDocumentType ? (
              <MenuItem
                value={selectedDocumentType.id}
                key={selectedDocumentType.id}
              >
                {selectedDocumentType?.lookUpValue}
              </MenuItem>
            ) : (
              <MenuItem value="" key="default">
                <Typography>{SELECT_DOCUMENT_TYPE}</Typography>
              </MenuItem>
            )}
          </UploadedFileStyledSelect>
        )}
        {isReplacing && loading ? (
          <LinearProgress color="secondary" style={{ width: "100%" }} />
        ) : (
          <DisplayUploadedFileContainer customVariant={customVariant}>
            <DocumentDetailsContainer>
              {renderFileType(fileExtension)}
              <Tooltip
                title={displayFileName}
                arrow
                placement="top"
              >
                <CommonTypography
                  hideDropdown={hideDropdown}
                  customVariant={customVariant}
                >
                  {displayFileName}{" "}
                </CommonTypography>
              </Tooltip>
            </DocumentDetailsContainer>
            <DocumentActionsContainer
              className="document-actions"
              customVariant={customVariant}
            >
              <CommonActionIcon
                src={PreviewIcon}
                onClick={handlePreview}
                alt="Preview"
                // sx={{ cursor: "pointer", fontSize: 20, color: "primary.main" }}
              />
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
                    alt="refresh"
                    onClick={handleRefresh}
                  />
                  <CommonActionIcon
                    src={ThrashIcon}
                    alt="thrash"
                    onClick={handleDelete}
                  />
                </>
              )}
            </DocumentActionsContainer>
          </DisplayUploadedFileContainer>
        )}
      </UploadFileContainer>

      <Dialog open={!!previewBlobUrl || !!excelHtml} onClose={handleClosePreview} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {displayFileName}
          <IconButton onClick={handleClosePreview} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {excelHtml ? (
            <Box
              sx={{ overflowX: "auto", "& table": { borderCollapse: "collapse", width: "100%" }, "& td, & th": { border: "1px solid #ddd", padding: "4px 8px", fontSize: 13 } }}
              dangerouslySetInnerHTML={{ __html: excelHtml }}
            />
          ) : IMAGE_TYPES.includes(fileExtension) ? (
            <Box
              component="img"
              src={previewBlobUrl ?? ""}
              alt={displayFileName}
              sx={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "auto" }}
            />
          ) : fileExtension === "pdf" ? (
            <Box
              component="iframe"
              src={previewBlobUrl ?? ""}
              sx={{ width: "100%", height: "80vh", border: "none" }}
            />
          ) : (
            <Typography sx={{ p: 2 }}>
              Preview not supported for this file type. Please download to view.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DisplayUploadedFile;
