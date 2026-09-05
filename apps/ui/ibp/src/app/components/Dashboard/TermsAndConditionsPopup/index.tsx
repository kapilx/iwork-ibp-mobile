import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, Divider } from "@mui/material";
import {
  TermsDialogTitle,
  TermsDialogContent,
  TermsDialogActions,
  TermsContentScroll,
  TermsNoticeText,
  TermsParagraphText,
  TermsSectionTitle,
  DeclineButton,
  AcceptButton,
} from "./styles";
import { apiRequest } from "@ui/ui-lib/utils";
import { sanitizeHtml } from "@ui/ui-lib/utils/sanitizeHtml";
import { endPoints } from "@ui/ui-lib/constants";
import { clearPortalConfiguration } from "../../../redux/portalConfigSlice";
import { RootState } from "../../../redux/store";

const TermsAndConditionsPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const tcData = useSelector((state: RootState) => state.tc.data);
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userId: number | null = userDetails?.id || null;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const showPopup = sessionStorage.getItem("showLoginWelcomePopup");
    if (showPopup === "true") {
      setOpen(true);
      sessionStorage.removeItem("showLoginWelcomePopup");
    }
  }, []);

  const handleAccept = async () => {
    if (!userId) {
      console.error("Failed to accept terms: missing userId");
      return;
    }

    try {
      await apiRequest(endPoints.acceptTerms, {
        method: "POST",
        data: {
          userId,
          ...(tcData?.version !== undefined && { tcVersion: tcData.version }),
        },
        headers: { userid: String(userId) },
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to accept terms:", error);
      setOpen(false);
    }
  };

  const handleDeclineAndLogout = async () => {
    if (!userId) {
      console.error("Failed to log out: missing userId");
    } else {
      try {
        await apiRequest(endPoints.getActivityLogs, {
          method: "POST",
          data: {
            activityKey: "LOGGED_OUT",
            activityCategory: "AUTH",
            referenceId: userId,
            referenceType: "USER",
            metadata: null,
          },
          headers: { userid: String(userId) },
        });
      } catch (_error) {
        // Keep logout reliable even if activity logging fails.
      }
    }

    dispatch(clearPortalConfiguration());
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionStartedAt");
    setOpen(false);
    navigate("/landing");
  };

  const handleClose = (_event: object, reason: string) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <TermsDialogTitle>Terms and Conditions</TermsDialogTitle>
      <TermsDialogContent>
        <TermsNoticeText>
          You must read and scroll down to accept it.
        </TermsNoticeText>

        <TermsContentScroll>
          {tcData ? (
            <>
              {tcData.introductionText && (
                <TermsParagraphText
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(tcData.introductionText) }}
                />
              )}
              {tcData.sections.map((section, index) => (
                <div key={`section-${index}`}>
                  <TermsSectionTitle>{section.title}</TermsSectionTitle>
                  {section.content && (
                    <TermsParagraphText
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                    />
                  )}
                  {index < tcData.sections.length - 1 && <Divider />}
                </div>
              ))}
            </>
          ) : (
            <TermsParagraphText
              sx={{ color: "#d32f2f", fontStyle: "italic", textAlign: "center", py: 4, fontWeight: 500 }}
            >
              No content available in Strapi. Please configure the Terms and
              Conditions content in Strapi CMS.
            </TermsParagraphText>
          )}
        </TermsContentScroll>
      </TermsDialogContent>
      <TermsDialogActions>
        <DeclineButton
          size="small"
          variant="outlined"
          onClick={handleDeclineAndLogout}
        >
          Decline and Log Out
        </DeclineButton>
        <AcceptButton size="small" variant="contained" onClick={handleAccept}>
          Accept
        </AcceptButton>
      </TermsDialogActions>
    </Dialog>
  );
};

export default TermsAndConditionsPopup;
