import React from "react";
import { Typography, IconButton } from "@mui/material";
import { useHasPermission, FeatureKey } from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import {
  CardContainer,
  FileInfoContainer,
  FileContentWrapper,
  FileTextContent,
  FileIconWrapper,
  FileName,
  MetaInfo,
  Content,
  MetaLabel,
  MetaValue,
  DividerLine,
  FooterContainer,
  ChipContainer,
  TotalCount,
  TotalValue,
  ErrorButton,
  ErrorIcon,
} from "./styles";
import File from "../../assets/svgs/file-text.svg";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { ChipRenderer, colors, formatDate, formatDateTime } from "@ui/ui-lib";
import user from "../../assets/svgs/user.svg";
import calendar from "../../assets/svgs/calendar.svg";
import { CARDS } from "../../constants";
import downloadErrorIcon from "../../assets/svgs/download-icon.svg";

interface HospitalCardProps {
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  inclusionCount: number;
  exclusionCount: number;
  total: number;
  onDownload?: (isError: boolean) => void;
  errorFileId?: number;
  errorCount: number;
  showFooter?: boolean;
  status?: "active" | "replaced";
  isDownloadAllowed?: boolean;
}

const HospitalCard: React.FC<HospitalCardProps> = ({
  fileName,
  uploadedBy,
  uploadedAt,
  inclusionCount,
  exclusionCount,
  total,
  onDownload,
  errorFileId,
  errorCount,
  showFooter = true,
  status,
  isDownloadAllowed: isDownloadAllowedProp,
}) => {
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_HOSPITAL_NETWORK);
  const internalDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const isDownloadAllowed = isDownloadAllowedProp !== undefined ? isDownloadAllowedProp : internalDownloadAllowed;
  const inclusionStyleMap = {
    [`${inclusionCount} hospital network`]: {
      backgroundColor: colors.background.greenVariant,
      dotColor: colors.chips.green,
    },
  };

  const exclusionStyleMap = {
    [`${exclusionCount} excluded hospitals`]: {
      backgroundColor: colors.background.orangeVariant,
      dotColor: colors.chips.orange,
    },
  };

  // NEW: style map for status chip when provided
  const statusStyleMap =
    status === "active"
      ? {
          [status]: {
            backgroundColor: colors.background.greenVariant,
            dotColor: colors.chips.green,
          },
        }
      : status === "replaced"
      ? {
          [status]: {
            backgroundColor: colors.background.orangeVariant,
            dotColor: colors.chips.orange,
          },
        }
      : undefined;

  return (
    <CardContainer>
      <FileInfoContainer>
        <FileContentWrapper>
          <FileIconWrapper>
            <img src={File} alt="Excel Icon" width={20} height={20} />
          </FileIconWrapper>

          <FileTextContent>
            <FileName>{fileName}</FileName>

            <MetaInfo>
              <Content>
                <img src={user} alt="User Icon" width={16} height={16} />
                <MetaLabel>{CARDS.UPLOADED_BY}</MetaLabel>
                <MetaValue>{uploadedBy}</MetaValue>
              </Content>
              <Content>
                <img
                  src={calendar}
                  alt="Calendar Icon"
                  width={16}
                  height={16}
                />
                <MetaLabel>{formatDateTime(uploadedAt)}</MetaLabel>
              </Content>
            </MetaInfo>
          </FileTextContent>
        </FileContentWrapper>

        {isDownloadAllowed && (
          <IconButton disableRipple onClick={() => onDownload?.(false)}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </FileInfoContainer>

      <DividerLine />

      {showFooter && (
        <FooterContainer>
          <ChipContainer>
            {/* NEW: If status is provided, render ONLY one chip */}
            {status ? (
              <ChipRenderer
                value={status}
                styleMap={statusStyleMap}
                variant="withDot"
              />
            ) : (
              <>
                {/* Legacy: two chips (kept for backward compatibility) */}
                <ChipRenderer
                  value={`${inclusionCount} Hospital Network`}
                  styleMap={inclusionStyleMap}
                  variant="withDot"
                />
                <ChipRenderer
                  value={`${exclusionCount} Excluded Hospitals`}
                  styleMap={exclusionStyleMap}
                  variant="withDot"
                />
              </>
            )}

            {errorFileId && (
              <ErrorButton onClick={isDownloadAllowed ? () => onDownload?.(true) : undefined}>
                {errorCount} Error records
                {isDownloadAllowed && <FileDownloadOutlinedIcon fontSize="inherit" />}
              </ErrorButton>
            )}
          </ChipContainer>

          {/* NEW: Hide total when status chip is shown */}
          {!status && (
            <TotalCount variant="body2">
              {CARDS.TOTAL}: <TotalValue>{total}</TotalValue>
            </TotalCount>
          )}
        </FooterContainer>
      )}
    </CardContainer>
  );
};

export default HospitalCard;
