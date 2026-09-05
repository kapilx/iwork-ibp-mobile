import React from "react";
import { Box, Divider, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { DocumentPreview, endPoints } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import documentIcon from "../../assets/svgs/file-icon-blue.svg";
import {
  ActionButton,
  BackRow,
  BackTitle,
  FileNameRow,
  FileNameValue,
  PageRoot,
  PanelLayout,
  PreviewContent,
  PreviewEmpty,
  PreviewPanel,
  PreviewPanelActions,
  PreviewPanelHeader,
  PreviewPanelTitle,
  PropertiesPanel,
  PropertiesTitle,
  PropertyLabel,
  PropertyRow,
  PropertyValue,
} from "./styles";

interface DocumentPreviewState {
  documentId?: string | number;
  fileName?: string;
  mimeType?: string;
  title?: string;
  documentType?: string;
  associatedContext?: string;
  uploadedBy?: string;
  lastUpdated?: string;
}

const DocumentPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as DocumentPreviewState;

  const {
    documentId,
    fileName = "Document",
    mimeType,
    title = "Document",
    documentType = "--",
    associatedContext = "--",
    uploadedBy = "--",
    lastUpdated = "--",
  } = state;

  const handleDownload = async () => {
    if (!documentId) return;
    try {
      const url = endPoints.ibpFileUploadDownloadById(Number(documentId));
      const response = await apiRequest(url, { responseType: "blob" });
      const blob = response.data as Blob;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "document";
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const handleExpandView = () => {
    if (!documentId) return;
    const url = endPoints.ibpFileUploadDownloadById(Number(documentId));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <PageRoot>
      {/* Back button + doc title */}
      <BackRow>
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: "#222222", p: 0.5 }}
          aria-label="Go back"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <BackTitle>{title}</BackTitle>
      </BackRow>

      {/* Two-panel layout */}
      <PanelLayout>
        {/* Left panel – Document Preview */}
        <PreviewPanel>
          <PreviewPanelHeader>
            <PreviewPanelTitle>Document Preview</PreviewPanelTitle>
            <PreviewPanelActions>
              {/* <ActionButton $active={Boolean(documentId)} onClick={handleExpandView}>
                <OpenInNewIcon sx={{ fontSize: 16 }} />
                Expand View
              </ActionButton> */}
              <ActionButton $active={Boolean(documentId)} onClick={handleDownload}>
                <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                Download
              </ActionButton>
            </PreviewPanelActions>
          </PreviewPanelHeader>

          <PreviewContent>
            {documentId ? (
              <DocumentPreview
                fileId={documentId}
                fileName={fileName}
                mimeType={mimeType}
                getFileDownloadUrl={endPoints.ibpFileUploadDownloadById}
                previewHeight="65vh"
                showDownloadButton={false}
                showFileMeta={false}
              />
            ) : (
              <PreviewEmpty>
                <Typography>No document available for preview.</Typography>
              </PreviewEmpty>
            )}
          </PreviewContent>
        </PreviewPanel>

        {/* Right panel – Properties */}
        <PropertiesPanel>
          <PropertiesTitle>Properties</PropertiesTitle>

          {/* File icon + file name */}
          <FileNameRow>
            <img src={documentIcon} alt="" width={32} height={32} style={{ flexShrink: 0, marginTop: 2 }} />
            <Box>
              <PropertyLabel>File name</PropertyLabel>
              <FileNameValue>{title}</FileNameValue>
            </Box>
          </FileNameRow>

          <Divider sx={{ mb: 2.5 }} />

          <PropertyRow>
            <PropertyLabel>Document Type</PropertyLabel>
            <PropertyValue>{documentType}</PropertyValue>
          </PropertyRow>

          <Divider sx={{ mb: 2.5 }} />

          <PropertyRow>
            <PropertyLabel>Associated Context</PropertyLabel>
            <PropertyValue>{associatedContext}</PropertyValue>
          </PropertyRow>

          <Divider sx={{ mb: 2.5 }} />

          <PropertyRow>
            <PropertyLabel>Uploaded By</PropertyLabel>
            <PropertyValue>{uploadedBy}</PropertyValue>
          </PropertyRow>

          <Divider sx={{ mb: 2.5 }} />

          <Box>
            <PropertyLabel>Latest modify</PropertyLabel>
            <PropertyValue>{lastUpdated}</PropertyValue>
          </Box>
        </PropertiesPanel>
      </PanelLayout>
    </PageRoot>
  );
};

export default DocumentPreviewPage;

