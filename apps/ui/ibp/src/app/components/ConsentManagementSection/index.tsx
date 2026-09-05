import React, { useCallback, useEffect, useState } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useSelector } from "react-redux";
import { apiRequest } from "@ui/ui-lib/utils";
import { sanitizeHtml } from "@ui/ui-lib/utils/sanitizeHtml";
import { endPoints } from "@ui/ui-lib/constants";
import { RootState } from "../../redux/store";
import {
  ActionButton,
  ActionsLabel,
  ActionsZone,
  ConsentCard,
  ConsentContainer,
  ConsentHeader,
  ConsentStatusLabel,
  ConsentSubtitle,
  InfoIconWrapper,
  InfoLabel,
  InfoRow,
  InfoValue,
  InfoZone,
  LatestChip,
  LoadingWrapper,
  ShieldIconWrapper,
  StatusBadge,
  StatusText,
  StatusZone,
  WithdrawButton,
  WithdrawnShieldWrapper,
  WithdrawnStatusBadge,
} from "./styles";

type UserTcStatus = {
  isTCAccepted: boolean;
  tcAcceptedVersion: number | null;
  tcAcceptedAt: string | null;
  tcWithdrawnAt: string | null;
  tcStatus: string | null;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getUserIdFromSession = (): number | null => {
  try {
    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    return userDetails?.id || null;
  } catch {
    return null;
  }
};

const ConsentManagementSection: React.FC = () => {
  const [tcStatus, setTcStatus] = useState<UserTcStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const tcData = useSelector((state: RootState) => state.tc.data);
  const userId = getUserIdFromSession();

  const fetchTcStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiRequest(endPoints.getUserTcStatus(userId), {
        method: "GET",
        headers: { userid: String(userId) },
      });
      setTcStatus(response?.data ?? null);
    } catch {
      setTcStatus(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTcStatus();
  }, [fetchTcStatus]);

  const handleWithdraw = async () => {
    if (!userId) return;
    setWithdrawing(true);
    try {
      await apiRequest(endPoints.withdrawTerms, {
        method: "POST",
        data: { userId },
        headers: { userid: String(userId) },
      });
      await fetchTcStatus();
    } catch (error) {
      console.error("Failed to withdraw consent:", error);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const isAccepted = tcStatus?.tcStatus === "accepted" || tcStatus?.isTCAccepted;
  const lastUpdated = isAccepted ? tcStatus?.tcAcceptedAt : tcStatus?.tcWithdrawnAt;
  const isLatestVersion =
    tcData?.version !== undefined &&
    tcStatus?.tcAcceptedVersion !== null &&
    tcStatus?.tcAcceptedVersion === tcData?.version;

  return (
    <ConsentContainer>
      <ConsentHeader>Consent Management</ConsentHeader>
      <ConsentSubtitle>Manage your consent for our Terms &amp; Conditions.</ConsentSubtitle>

      {loading ? (
        <LoadingWrapper>
          <CircularProgress size={32} />
        </LoadingWrapper>
      ) : (
        <>
          <ConsentStatusLabel>Current Consent Status</ConsentStatusLabel>
          <ConsentCard>
            {/* Status zone */}
            <StatusZone>
              {isAccepted ? (
                <ShieldIconWrapper>
                  <VerifiedUserOutlinedIcon />
                </ShieldIconWrapper>
              ) : (
                <WithdrawnShieldWrapper>
                  <GppBadOutlinedIcon />
                </WithdrawnShieldWrapper>
              )}
              <div>
                {isAccepted ? (
                  <StatusBadge>
                    Status: Accepted <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#43A047" }} />
                  </StatusBadge>
                ) : (
                  <WithdrawnStatusBadge>
                    Status: Withdrawn <BlockOutlinedIcon sx={{ fontSize: 18 }} />
                  </WithdrawnStatusBadge>
                )}
                <StatusText>
                  {isAccepted
                    ? "You have accepted the Terms & Conditions."
                    : "You have withdrawn your consent."}
                </StatusText>
              </div>
            </StatusZone>

            {/* Info zone */}
            <InfoZone>
              <InfoRow>
                <InfoIconWrapper>
                  <ArticleOutlinedIcon />
                </InfoIconWrapper>
                <InfoLabel>Accepted Version</InfoLabel>
                <InfoValue>
                  {tcStatus?.tcAcceptedVersion
                    ? `v${tcStatus.tcAcceptedVersion}.0`
                    : "—"}
                  {isAccepted && isLatestVersion && (
                    <LatestChip label="Latest" size="small" />
                  )}
                </InfoValue>
              </InfoRow>

              <InfoRow>
                <InfoIconWrapper>
                  <CalendarTodayOutlinedIcon />
                </InfoIconWrapper>
                <InfoLabel>Accepted On</InfoLabel>
                <InfoValue>{formatDate(tcStatus?.tcAcceptedAt ?? null)}</InfoValue>
              </InfoRow>

              <InfoRow>
                <InfoIconWrapper>
                  <AccessTimeOutlinedIcon />
                </InfoIconWrapper>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{formatDate(lastUpdated ?? null)}</InfoValue>
              </InfoRow>
            </InfoZone>

            {/* Actions zone */}
            <ActionsZone>
              <ActionsLabel>Actions</ActionsLabel>
              <ActionButton
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => setViewDialogOpen(true)}
              >
                View Current Terms
              </ActionButton>
              <ActionButton
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </ActionButton>
              {isAccepted && (
                <WithdrawButton
                  variant="outlined"
                  startIcon={
                    withdrawing ? (
                      <CircularProgress size={16} color="error" />
                    ) : (
                      <BlockOutlinedIcon />
                    )
                  }
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  Withdraw Consent
                </WithdrawButton>
              )}
            </ActionsZone>
          </ConsentCard>
        </>
      )}

      {/* View Current Terms dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Terms and Conditions
          <IconButton onClick={() => setViewDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {tcData ? (
            <>
              {tcData.introductionText && (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(tcData.introductionText) }} />
              )}
              {tcData.sections.map((section, index) => (
                <div key={`section-${index}`}>
                  <strong style={{ display: "block", margin: "16px 0 8px" }}>
                    {section.title}
                  </strong>
                  {section.content && (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }} />
                  )}
                  {index < tcData.sections.length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: "#d32f2f", fontStyle: "italic", textAlign: "center" }}>
              No Terms and Conditions content available. Please configure in Strapi CMS.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </ConsentContainer>
  );
};

export default ConsentManagementSection;
