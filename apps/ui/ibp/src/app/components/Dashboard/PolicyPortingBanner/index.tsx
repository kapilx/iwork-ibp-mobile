import React from "react";
import { SwapHorizRounded } from "@mui/icons-material";
import portingIllustration from "../../../../assets/pngs/policy-porting-illustration.png";
import { useCompanyConfig } from "../../../hooks/useCompanyConfig";
import {
  PortingBannerWrapper,
  PortingCard,
  PortingImageBox,
  PortingImage,
  PortingOverlay,
  PortingContent,
  PortingText,
  PortingTitle,
  PortingDescription,
  PortingButton,
} from "./styles";

/**
 * POLICY PORTING / CLUB EVEXIA BANNER (wireframe stage)
 * Sits above the "Need help understanding your benefits?" section on the
 * dashboard. CTA target is a placeholder for now.
 */
const PolicyPortingBanner: React.FC = () => {
  const { portalDashboardConfig } = useCompanyConfig();
  const isPortingBannerEnabled =
    portalDashboardConfig?.portingBanner?.enabled === true;

  const handleExplore = () => {
    // Same destination as the header's "Policy Porting" external nav item.
    window.open("https://www.iirmwellness.co.in", "_blank", "noopener,noreferrer");
  };

  if (!isPortingBannerEnabled) return null;

  return (
    <PortingBannerWrapper>
      <PortingCard>
        <PortingImageBox>
          <PortingImage
            src={portingIllustration}
            alt="A family protected under a coverage shield"
          />
          <PortingOverlay />
        </PortingImageBox>
        <PortingContent>
          <PortingText>
            <PortingTitle>Continued coverage, wherever life takes you.</PortingTitle>
            <PortingDescription>
              Port your existing policy to Club Evexia and carry your benefits
              forward — no fresh waiting periods, no gap in protection for your
              family.
            </PortingDescription>
          </PortingText>
          <PortingButton
            onClick={handleExplore}
            startIcon={<SwapHorizRounded />}
          >
            Policy Porting
          </PortingButton>
        </PortingContent>
      </PortingCard>
    </PortingBannerWrapper>
  );
};

export default PolicyPortingBanner;
