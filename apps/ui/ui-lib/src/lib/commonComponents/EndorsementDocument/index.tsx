import React, { useEffect, useState, useCallback } from "react";
import PreviewModal from "./PreviewModal";
import {
  ContentContainer,
  DocumentIconContainer,
  DownLoadIconHolder,
  FileNameAndIconHolder,
  FileNameAndUploadedOnContainer,
  HeaderContainer,
  HeaderTitleTypography,
  MainContainer,
  MainHeaderContainer,
  SubtitleTypography,
  TitleTypography,
  RefreshContentContainer,
  RefreshStatusText,
  RefreshControls,
  RefreshSpinner,
} from "./styles";
import DocumentIconBlue from "../../assets/svgs/document-icon-blue.svg";
import DownloadIcon from "../../assets/svgs/download-icon.svg";
import RefreshIcon from "../../assets/svgs/refresh-icon.svg";
import EyeIcon from "../../assets/svgs/eye-icon-sm.svg";
import { useDispatch } from "react-redux";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { environment } from "@ui/ui-lib/environment";
import {
  apiRequest,
  DOCUMENT_NAME,
  endPoints,
  formatDate,
  setToastMessage,
  useApiQuery,
  useApiMutation,
} from "@ui/ui-lib";
import Button from "../Button";

// File status enum constants
const FILE_STATUS = {
  CREATED: "Created",
  PROCESSING: "Processing",
  FAILED: "Failed",
  COMPLETED: "Completed",
  PROCESSING_MSG:
    "We're still working on your file. Use 'Refresh' to get the latest status.",
  FAILED_MSG: "Something went wrong. Use 'Retry' to attempt processing again.",
  CREATED_MSG:
    "Your file has been received and is queued for processing. It will be processed shortly.",
} as const;

export interface EndorsementDocumentProps {
  title?: string;
  subTitle?: string;
  endorsementFileDetails?: any;
  enableDownloadIcon?: boolean;
  creationLabel?: string;
  policyId?: number;
  endorsementId?: number;
  setDocumentFileStatus?: (status: string | null) => void;
  refetchEndorsementSteps?: () => void;
  permissionFeatureKey?: FeatureKey;
}

const EndorsementDocument: React.FC<EndorsementDocumentProps> = ({
  title,
  subTitle,
  endorsementFileDetails,
  enableDownloadIcon,
  creationLabel,
  policyId,
  endorsementId,
  setDocumentFileStatus,
  refetchEndorsementSteps,
  permissionFeatureKey = FeatureKey.EXPORT_ENDORSEMENTS,
}) => {
  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(permissionFeatureKey);
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Preview state for Excel preview
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewUrl = previewFileId ? endPoints.policyPreviewDocument(previewFileId) : "";

  const getUrl =
    policyId && endorsementId
      ? endPoints.insurerDocumentStatus(policyId, endorsementId)
      : "";

  const {
    data: documentStatusResponse,
    isLoading,
    refetch,
  } = useApiQuery({
    url: getUrl,
    queryKey: ["insurer-document-status", policyId, endorsementId],
    enabled: !!getUrl,
  });

  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useApiQuery({
    url: previewUrl,
    queryKey: ["policy-preview-document", previewFileId],
    enabled: !!previewUrl,
  });

  const { mutate: triggerDocumentGeneration, isPending: isRetryPending } =
    useApiMutation({
      config: {
        onSuccess: async (response) => {
          dispatch(
            setToastMessage(
              response?.message || "Document generation triggered successfully."
            )
          );
          refetch();
        },
        onError: async (error) => {
          const errorMessage = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message ?? "Failed to trigger document generation.";
          dispatch(setToastMessage(errorMessage));
        },
      },
    });

  const documentData = documentStatusResponse?.data || endorsementFileDetails;
  const fileStatus = documentData?.fileStatus;

  // Normalize file status for safe comparison
  const normalizedStatus = fileStatus?.toString().trim().toLowerCase();

  // Notify parent component of file status changes
  useEffect(() => {
      if (setDocumentFileStatus && fileStatus) {
          setDocumentFileStatus(fileStatus);
      }
      if (fileStatus?.toLowerCase() === FILE_STATUS.COMPLETED.toLowerCase()) {
          setPreviewFileId(documentData?.fileId || null);
          // Refetch endorsement steps data to update attachment IDs
          if (refetchEndorsementSteps) {
              refetchEndorsementSteps();
          }
      } 
  }, [fileStatus, setDocumentFileStatus, documentData?.fileId, refetchEndorsementSteps]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [refetch]);

  const handleRetry = useCallback(() => {
    if (!policyId || !endorsementId) {
      dispatch(setToastMessage("Invalid policy or endorsement ID."));
      return;
    }

    const endpoint = endPoints.insurerDocumentStatus(policyId, endorsementId);
    triggerDocumentGeneration({
      endpoint,
      method: "POST",
    });
  }, [policyId, endorsementId, triggerDocumentGeneration, dispatch]);

  const handleDownload = async (errorFileUploadId: number) => {
    try {
      if (!errorFileUploadId) {
        dispatch(setToastMessage("Invalid selection."));
        return;
      }

      const downloadUrl = endPoints.fileUploadDownloadById(errorFileUploadId);
      const response = await apiRequest(downloadUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) {
          dispatch(
            setToastMessage("Download failed — server returned an error page.")
          );
          return;
        }
      }

      let filename = "error-report.xlsx"; // Default filename
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      dispatch(setToastMessage("File downloaded successfully."));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  // Derive a stable, readable display file name
  const isInception = creationLabel?.trim()?.toLowerCase() === "inception";
  const providedFileName = documentData?.fileName;
  const hasUsableProvidedName =
    !!providedFileName && providedFileName.trim() !== "";
  const displayFileName = hasUsableProvidedName
    ? providedFileName
    : isInception
    ? DOCUMENT_NAME.INCEPTION
    : DOCUMENT_NAME.ENDORSEMENT;

  const refreshStatusMessage =
    normalizedStatus === FILE_STATUS.PROCESSING.toLowerCase()
      ? FILE_STATUS.PROCESSING_MSG
      : normalizedStatus === FILE_STATUS.CREATED.toLowerCase()
      ? FILE_STATUS.CREATED_MSG
      : normalizedStatus === FILE_STATUS.FAILED.toLowerCase()
      ? FILE_STATUS.FAILED_MSG
      : FILE_STATUS.CREATED_MSG;

  return (
    <MainContainer>
      <HeaderContainer>
        <MainHeaderContainer>
          <DocumentIconContainer src={DocumentIconBlue} alt="Document Icon" />
          <HeaderTitleTypography>{title}</HeaderTitleTypography>
        </MainHeaderContainer>
        <SubtitleTypography>{subTitle}</SubtitleTypography>
      </HeaderContainer>

      {normalizedStatus === FILE_STATUS.PROCESSING.toLowerCase() && (
        <RefreshContentContainer data-testid="refresh-container">
          <RefreshStatusText>{refreshStatusMessage}</RefreshStatusText>
          <RefreshControls>
            <Button
              variantType="link"
              label="Refresh"
              onClick={handleManualRefresh}
              size="small"
            />
            {isRefreshing && (
              <RefreshSpinner src={RefreshIcon} alt="Refreshing" />
            )}
          </RefreshControls>
        </RefreshContentContainer>
      )}
      {normalizedStatus === FILE_STATUS.CREATED.toLowerCase() && (
        <RefreshContentContainer data-testid="refresh-container">
          <RefreshStatusText>{refreshStatusMessage}</RefreshStatusText>
          <RefreshControls>
            <Button
              variantType="link"
              label="Refresh"
              onClick={handleManualRefresh}
              size="small"
            />
            {isRefreshing && (
              <RefreshSpinner src={RefreshIcon} alt="Refreshing" />
            )}
          </RefreshControls>
        </RefreshContentContainer>
      )}

      {normalizedStatus === FILE_STATUS.FAILED.toLowerCase() && (
        <RefreshContentContainer data-testid="refresh-container">
          <RefreshStatusText>{refreshStatusMessage}</RefreshStatusText>
          <RefreshControls>
            <Button
              variantType="link"
              label="Retry"
              onClick={handleRetry}
              size="small"
              disabled={isRetryPending}
            />
            {isRetryPending && (
              <RefreshSpinner src={RefreshIcon} alt="Retrying" />
            )}
          </RefreshControls>
        </RefreshContentContainer>
      )}

      {normalizedStatus === FILE_STATUS.COMPLETED.toLowerCase() && (
        <>
          <ContentContainer>
            <FileNameAndIconHolder>
              <img src={DocumentIconBlue} alt="Document Icon" />
              <FileNameAndUploadedOnContainer>
                <TitleTypography>{displayFileName}</TitleTypography>
                <SubtitleTypography>
                  {formatDate(documentData?.generatedDate)}
                </SubtitleTypography>
              </FileNameAndUploadedOnContainer>
            </FileNameAndIconHolder>
            <div style={{ display: 'flex' }}>
             {isDownloadAllowed && (
              <DownLoadIconHolder
                src={DownloadIcon}
                onClick={() => handleDownload(documentData?.fileId)}
                alt="Download Icon"
                enableDownloadIcon={enableDownloadIcon}
              />
             )}
              <DownLoadIconHolder
                src={EyeIcon}
                alt="View Icon"
                onClick={() => setIsPreviewOpen(true)}
                enableDownloadIcon={enableDownloadIcon}
              />
            </div>
          </ContentContainer>
          <PreviewModal
            open={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            data={previewData?.data}
            isLoading={isPreviewLoading}
            error={previewError}
            title={previewData?.data?.fileName ? `${previewData.data.fileName} - Preview` : "Insurer Document - Preview"}
          />
        </>
      )}
    </MainContainer>
  );
};

export default EndorsementDocument;
