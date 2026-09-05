import {
  BALANCE,
  DEPENDENTS,
  EXPIRES,
  PROVIDED_BY,
  SUM_INSURED,
} from "../../constants";
import {
  CommonContainer,
  CommonNumberTypography,
  CommonTypography,
  Container,
  ContentContainer,
  FooterContainer,
  FooterTypography,
  FooterTypographyClaims,
  HeaderContainer,
  HeaderTypography,
  MainContainer,
  ShieldContainer,
} from "./styles";
import ActiveShield from "../../assets/svgs/active-shield.svg";
import ExpiredShield from "../../assets/svgs/expired-shield.svg";
import BackGround from "../../assets/svgs/background-for-insurance-card.svg";
import StarHealth from "../../assets/svgs/star-health-logo-icon.svg";
import { useEffect, useState } from "react";
import {
  apiRequest,
  endPoints,
  formatNumberByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";

export interface CommonInsuranceCardProps {
  title?: string;
  policyNumber?: string;
  sumInsured?: string | number;
  balance?: string | number;
  dependentsCount?: number;
  dueDate?: string;
  claimsCount?: number;
  fromDashboard?: boolean;
  containerStyles?: React.CSSProperties;
  localizationConfig?: LocalizationConfig;
  insurerLogoFileId?: string | number;
}
const CommonInsuranceCard: React.FC<CommonInsuranceCardProps> = ({
  title,
  policyNumber,
  sumInsured,
  balance,
  dependentsCount,
  dueDate,
  claimsCount,
  fromDashboard = false,
  containerStyles,
  localizationConfig,
  insurerLogoFileId,
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoFileId = insurerLogoFileId ? Number(insurerLogoFileId) : 0;

  // Calculate if insurance is expired
  const [isExpired, setIsExpired] = useState(false);
  useEffect(() => {
    if (dueDate) {
      // Parse dueDate as YYYY-MM-DD
      const due = new Date(dueDate);
      const now = new Date();
      // Set time to 00:00:00 for both dates for accurate comparison
      due.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const expired = due < now;
      setIsExpired(expired);
    }
  }, [dueDate]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const fetchLogo = async () => {
      if (!logoFileId) {
        setLogoUrl(null);
        setLogoFailed(false);
        return;
      }

      try {
        const response = await apiRequest(
          endPoints.ibpFileUploadDownloadById(logoFileId),
          { responseType: "blob" }
        );
        if (!active) return;
        const blobData = (response as any)?.data ?? response;
        objectUrl = URL.createObjectURL(blobData);
        setLogoUrl(objectUrl);
        setLogoFailed(false);
      } catch (error) {
        if (active) {
          setLogoUrl(null);
          setLogoFailed(true);
        }
      }
    };

    fetchLogo();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [logoFileId]);

  const logoSrc =
    logoUrl ||
    (logoFileId && !logoFailed
      ? endPoints.ibpFileUploadDownloadById(logoFileId)
      : null);

  return (
    <Container containerStyles={containerStyles}>
      <ShieldContainer>
        <img
          src={isExpired ? ExpiredShield : ActiveShield}
          alt={isExpired ? "Expired Shield" : "Active Shield"}
        />
      </ShieldContainer>
      <MainContainer>
        <HeaderContainer>
          <HeaderTypography isExpired={isExpired}>
            {title ?? ""}
          </HeaderTypography>
          <CommonNumberTypography>P No: {policyNumber}</CommonNumberTypography>
        </HeaderContainer>
        <ContentContainer>
          <CommonContainer>
            <CommonNumberTypography>
              {formatNumberByLocalization(
                typeof sumInsured === "string"
                  ? parseFloat(sumInsured)
                  : sumInsured,
                localizationConfig,
              )}
            </CommonNumberTypography>
            <CommonTypography>{SUM_INSURED}</CommonTypography>
          </CommonContainer>
          <CommonContainer>
            <CommonNumberTypography>
              {formatNumberByLocalization(
                typeof balance === "string" ? parseFloat(balance) : balance,
                localizationConfig,
              )}
            </CommonNumberTypography>
            <CommonTypography>{BALANCE}</CommonTypography>
          </CommonContainer>
        </ContentContainer>
        <ContentContainer>
          <CommonContainer>
            <CommonNumberTypography>{dependentsCount}</CommonNumberTypography>
            <CommonTypography>{DEPENDENTS}</CommonTypography>
          </CommonContainer>
          <CommonContainer>
            <CommonNumberTypography>{dueDate}</CommonNumberTypography>
            <CommonTypography>{EXPIRES}</CommonTypography>
          </CommonContainer>
        </ContentContainer>
      </MainContainer>
      <FooterContainer>
        {!fromDashboard ? (
          <FooterTypography>{PROVIDED_BY}</FooterTypography>
        ) : (
          <FooterTypographyClaims>
            {/* 
                Claims display logic:
                - claimsCount = 0: Don't display anything
                - claimsCount = 1-8: Display with leading zero (01, 02, ..., 08 Claims)
                - claimsCount >= 9: Display without leading zero (9, 10, 11+ Claims)
              */}
            {claimsCount && claimsCount > 0 && claimsCount < 9
              ? `0${claimsCount} Claims`
              : claimsCount && claimsCount >= 9
              ? `${claimsCount} Claims`
              : ""}
          </FooterTypographyClaims>
        )}
         {logoSrc && (
          <img
            src={logoSrc}
            alt={`${title ?? "Insurer"} logo`}
            height={50}
            width={100}
          />
        )}
      </FooterContainer>
    </Container>
  );
};

export default CommonInsuranceCard;
