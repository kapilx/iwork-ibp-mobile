import { Box, Checkbox, CircularProgress } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import React from "react";
import {
  PolicyDocumentCardContainer,
  PolicyDocumentCardHeader,
  PolicyDocumentMetaRow,
  PolicyDocumentIcon,
  CardTitleBlock,
  Title,
  SubtitleText,
  DateContainer,
  DateText,
  PolicyDocumentFileNameRow,
  FileNameText,
  CardActionRow,
  CardActionLink,
} from "./styles";
import excelIcon from "../../assets/pngs/excel-icon.png";
import pdfIcon from "../../assets/pngs/pdf-icon.png";
import defaultIcon from "../../assets/pngs/default-icon.png";
import imageIcon from "../../assets/pngs/image-icon.png";

// Resolve the file-type icon from the file name extension.
// excel -> excel icon, pdf -> pdf icon, image -> image icon, anything else -> default icon.
const getFileTypeIcon = (fileName?: string): string => {
  const ext = (fileName?.split(".").pop() ?? "").toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) return excelIcon;
  if (ext === "pdf") return pdfIcon;
  if (["png", "jpg", "jpeg", "svg", "gif", "webp", "bmp"].includes(ext)) return imageIcon;
  return defaultIcon;
};


export type PolicyDocumentCardProps = {
  title: string;
  subtitle?: string;
  fileName?: string;
  lastUpdatedLabel?: string;
  isLoading?: boolean;
  hasDocument?: boolean;
  errorText?: string;
  onViewDocument?: () => void;
  documentId?: number;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  showSecondaryAction?: boolean;
  // new props
  checked?: boolean;
  onToggleCheck?: () => void;
  thumbnailGradient?: string;
};

const PolicyDocumentCard: React.FC<PolicyDocumentCardProps> = ({
  title,
  subtitle,
  fileName,
  lastUpdatedLabel = "--",
  isLoading = false,
  hasDocument = false,
  onViewDocument,
  onSecondaryAction,
  documentId = 0,
  showSecondaryAction = false,
  checked = false,
  onToggleCheck,
  thumbnailGradient,
}) => {
  return (
    <PolicyDocumentCardContainer>
      {/* Header: icon + title/subtitle + checkbox */}
      <PolicyDocumentCardHeader>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flex: 1, minWidth: 0 }}>
          <PolicyDocumentIcon src={getFileTypeIcon(fileName)} alt="" />
          <CardTitleBlock>
            <Title title={title}>{title}</Title>
            {subtitle ? <SubtitleText title={subtitle}>{subtitle}</SubtitleText> : null}
          </CardTitleBlock>
        </Box>
        <Checkbox
          size="small"
          checked={checked}
          onChange={onToggleCheck}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 0, flexShrink: 0, mt: "2px", color: "#222222", "&.Mui-checked": { color: "#222222" } }}
        />
      </PolicyDocumentCardHeader>

      {/* File name */}
      {fileName ? (
        <PolicyDocumentFileNameRow>
          <FileNameText title={fileName}>{fileName}</FileNameText>
        </PolicyDocumentFileNameRow>
      ) : null}

      {/* Latest modify */}
      <PolicyDocumentMetaRow>
        <DateContainer>Latest modify</DateContainer>
        {isLoading ? (
          <CircularProgress size={14} />
        ) : (
          <DateText>{lastUpdatedLabel}</DateText>
        )}
      </PolicyDocumentMetaRow>

      {/* Actions: View | Download */}
      <CardActionRow>
        <CardActionLink
          $disabled={!hasDocument || isLoading}
          onClick={() => {
            if (!hasDocument || isLoading) return;
            onViewDocument?.();
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
          View
        </CardActionLink>

        {showSecondaryAction && (
          <CardActionLink
            $disabled={!hasDocument || isLoading}
            onClick={() => {
              if (!hasDocument || isLoading) return;
              onSecondaryAction?.();
            }}
          >
            <FileDownloadOutlinedIcon sx={{ fontSize: 14 }} />
            Download
          </CardActionLink>
        )}
      </CardActionRow>
    </PolicyDocumentCardContainer>
  );
};

export default PolicyDocumentCard;
