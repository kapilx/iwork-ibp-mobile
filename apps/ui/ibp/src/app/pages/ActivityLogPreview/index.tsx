import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { CircularProgress, Typography } from "@mui/material";
import { endPoints, useApiQuery } from "@ui/ui-lib";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { ActivityLogItem } from "../../utils/map-activity-log";
import { downloadMailPreviewPdf, getMailPdfFileName } from "../../utils/mailPreview";
import {
  BackArrowButton,
  CenteredState,
  HtmlPreviewFrame,
  LoadingState,
  PageWrapper,
  PreviewBody,
  PreviewCard,
  PreviewHeader,
  PreviewTitle,
  PreviewTitleGroup,
  DownloadPreviewButton,
} from "./styles";

type ActivityLogPreviewState = {
  activity?: ActivityLogItem | null;
};

const getHtmlPreviewFromMetadata = (
  metadata?: Record<string, unknown>,
): string => {
  if (!metadata) return "";

  const htmlCandidateKeys = [
    "renderedHtml",
    "htmlTemplate",
    "htmlContent",
    "templateHtml",
    "previewHtml",
  ] as const;

  for (const key of htmlCandidateKeys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
};

const parseNotificationInfoId = (value: unknown): number | null => {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const ActivityLogPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previewState = (location.state ?? {}) as ActivityLogPreviewState;
  const activity = previewState?.activity ?? null;
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  const selectedNotificationId =
    activity?.referenceType === "NOTIFICATION_INFO"
      ? parseNotificationInfoId(activity.referenceId)
      : parseNotificationInfoId(activity?.metadata?.notificationInfoId);

  const hasMetadataHtml = Boolean(getHtmlPreviewFromMetadata(activity?.metadata));

  const { data: notificationPreviewData, isLoading } = useApiQuery({
    queryKey: ["activityLogPreviewNotificationInfo", selectedNotificationId],
    url:
      selectedNotificationId != null
        ? endPoints.getNotificationInfoById(selectedNotificationId)
        : "",
    enabled: Boolean(activity?.previewable && selectedNotificationId != null && !hasMetadataHtml),
  });

  const renderedHtml = React.useMemo(() => {
    const metadataHtml = getHtmlPreviewFromMetadata(activity?.metadata);
    const apiHtml =
      notificationPreviewData?.data?.renderedHtml ||
      notificationPreviewData?.renderedHtml ||
      "";

    if (metadataHtml || apiHtml) {
      return metadataHtml || apiHtml;
    }

    return "";
  }, [activity, notificationPreviewData]);

  const createDownloadActivityLog = async () => {
    const metadata = activity?.metadata ?? {};
    const rawReferenceId =
      metadata["documentReferenceId"] ?? activity?.referenceId ?? null;

    if (rawReferenceId == null) return;

    const parsedReferenceId =
      typeof rawReferenceId === "number"
        ? rawReferenceId
        : Number.isFinite(Number(rawReferenceId))
          ? Number(rawReferenceId)
          : String(rawReferenceId);

    const policyNumber = String(
      metadata["policyNumber"] || metadata["policyName"] || activity?.title || "--",
    );
    const documentType = String(metadata["documentType"] || "POLICY_FEATURE_DOCUMENT");
    const activityText = `${documentType} downloaded (${policyNumber})`;

    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "DOCUMENT_DOWNLOADED",
          activityCategory: "DOCUMENT",
          referenceId: parsedReferenceId,
          referenceType: "DOCUMENT",
          metadata: {
            documentType,
            policyNumber,
            fileName: String(metadata["fileName"] || activity?.downloadFileName || ""),
            activityText,
            policyName: String(metadata["policyName"] || policyNumber),
          },
        },
      });
    } catch (error) {
      console.error("Failed to create DOCUMENT_DOWNLOADED activity log", error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!renderedHtml) return;

    setIsDownloadingPdf(true);
    try {
      await downloadMailPreviewPdf({
        html: renderedHtml,
        fileName: getMailPdfFileName(
          activity?.downloadFileName || activity?.title,
          "mail-preview",
        ),
      });

      await createDownloadActivityLog();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <PageWrapper>
      <PreviewCard>
        <PreviewHeader>
          <PreviewTitleGroup>
            <BackArrowButton onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowBackIosNewIcon fontSize="small" />
            </BackArrowButton>
            <PreviewTitle>{activity?.title || "Activity Preview"}</PreviewTitle>
          </PreviewTitleGroup>
          {renderedHtml ? (
            <DownloadPreviewButton
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              startIcon={
                isDownloadingPdf ? (
                  <CircularProgress size={14} sx={{ color: "inherit" }} />
                ) : null
              }
            >
              {isDownloadingPdf ? "Downloading..." : "Download PDF"}
            </DownloadPreviewButton>
          ) : null}
        </PreviewHeader>
        <PreviewBody>
          {!activity ? (
            <CenteredState>
              <Typography variant="body1">No activity preview available.</Typography>
            </CenteredState>
          ) : isLoading ? (
            <LoadingState>
              <CircularProgress size={24} />
              <Typography variant="body2">Loading activity preview...</Typography>
            </LoadingState>
          ) : renderedHtml ? (
            <HtmlPreviewFrame title="Activity Preview" srcDoc={renderedHtml} />
          ) : (
            <CenteredState>
              <Typography variant="body1">Preview content is not available.</Typography>
            </CenteredState>
          )}
        </PreviewBody>
      </PreviewCard>
    </PageWrapper>
  );
};

export default ActivityLogPreview;
