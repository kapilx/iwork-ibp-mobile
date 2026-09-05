import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { SelfImprovementRounded } from "@mui/icons-material";
import { apiRequest, endPoints } from "@ui/ui-lib";
import wellnessIllustration from "../../../../assets/pngs/wellness-banner-illustration.png";
import { setToastMessage } from "../../../redux/slice";
import { useCompanyConfig } from "../../../hooks/useCompanyConfig";
import {
  WellnessBannerWrapper,
  WellnessCard,
  WellnessImageBox,
  WellnessImage,
  WellnessOverlay,
  WellnessContent,
  WellnessText,
  WellnessTitle,
  WellnessDescription,
  WellnessButton,
} from "./styles";

/**
 * WELLNESS BANNER
 * Sits directly below the Claim Summary on the dashboard, styled after the
 * Life Events banner. CTA opens the Alyve wellness portal via magic-URL SSO,
 * matching the header's "Wellness" action.
 */
const WellnessBanner: React.FC = () => {
  const dispatch = useDispatch();
  const [isWellnessLoading, setIsWellnessLoading] = useState(false);
  const { portalDashboardConfig } = useCompanyConfig();
  const isWellnessBannerEnabled =
    portalDashboardConfig?.wellnessBanner?.enabled === true;

  const handleExplore = async () => {
    if (isWellnessLoading) return;
    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    setIsWellnessLoading(true);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        "<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc'><p style='color:#555;font-size:15px'>Redirecting to Wellness Portal…</p></body></html>",
      );
      win.document.close();
    }
    try {
      const res = await apiRequest(endPoints.alyveWellnessUrl, {
        method: "POST",
        data: {
          appKey: "alyve-wellness",
          dynamicFields: {
            mobile:
              userDetails?.phone ??
              userDetails?.mobile ??
              userDetails?.phoneNumber ??
              "",
            name: userDetails?.employeeName ?? userDetails?.fullName ?? "",
            gender: String(
              userDetails?.gender?.value ?? userDetails?.gender ?? "",
            ).toLowerCase(),
            dob: (userDetails?.dateOfBirth ?? userDetails?.dob ?? "")
              .toString()
              .slice(0, 10),
          },
        },
      });
      const redirectUrl =
        (res as any)?.data?.jsonData?.redirect_url ??
        (res as any)?.jsonData?.redirect_url;
      if (redirectUrl && win && !win.closed) {
        win.location.replace(redirectUrl);
        win.focus();
      } else {
        win?.close();
        const msg = (res as any)?.data?.message ?? (res as any)?.message;
        dispatch(
          setToastMessage({
            message:
              msg || "Unable to open Wellness portal. Please try again.",
            type: "error",
          }),
        );
      }
    } catch (err: any) {
      win?.close();
      const msg = err?.response?.data?.message ?? err?.message;
      dispatch(
        setToastMessage({
          message: msg || "Unable to open Wellness portal. Please try again.",
          type: "error",
        }),
      );
    } finally {
      setIsWellnessLoading(false);
    }
  };

  if (!isWellnessBannerEnabled) return null;

  return (
    <WellnessBannerWrapper>
      <WellnessCard>
        <WellnessImageBox>
          <WellnessImage
            src={wellnessIllustration}
            alt="A family exploring wellness benefits together"
          />
          <WellnessOverlay />
        </WellnessImageBox>
        <WellnessContent>
          <WellnessText>
            <WellnessTitle>Your wellbeing, all in one place.</WellnessTitle>
            <WellnessDescription>
              Discover preventive check-ups, teleconsults, fitness and mental
              wellness programs curated for you and your family — and unlock
              rewards along the way.
            </WellnessDescription>
          </WellnessText>
          <WellnessButton
            onClick={handleExplore}
            disabled={isWellnessLoading}
            startIcon={<SelfImprovementRounded />}
          >
            {isWellnessLoading ? "Loading..." : "Explore Wellness"}
          </WellnessButton>
        </WellnessContent>
      </WellnessCard>
    </WellnessBannerWrapper>
  );
};

export default WellnessBanner;
