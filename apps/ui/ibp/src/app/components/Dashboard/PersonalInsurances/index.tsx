import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { RootState } from "../../../redux/store";
import { personalInsuranceData } from "../constants";
import {
  InsuranceLabel,
  InsuranceSubHeading,
  StyledContainer,
  StyledContent,
  StyledHeaderContainer,
  StyledHeading,
  StyledImgcontainer,
  StyledInsuranceCard,
  StyledInsuranceContainer,
  StyledInsuranceData,
  StyledInsuranceNo,
  StyledInsuranceType,
  StyledTypeText,
  StyledViewMoreBtn,
} from "./styles";
import carSvg from "../../../assets/svgs/car-insurance-icon.svg";
import travelsvg from "../../../assets/svgs/travel.svg";

interface InsuranceData {
  id: string;
  type: string;
  policyNumber: string;
  details: {
    item: string;
    itemLabel: string;
    insuredValue: string;
    insuredValueLabel: string;
    expiryDate: string;
    expiryLabel: string;
  };
  icon: string;
  altText: string;
}

interface PersonalInsurancesProps {
  insuranceData?: InsuranceData[];
  totalPolicies?: number;
  heading?: string;
}

const PRODUCT_LABEL_MAP: Record<
  string,
  { label: string; icon: string; alt: string }
> = {
  moneyInsurance: {
    label: "Money Insurance",
    icon: travelsvg,
    alt: "Money insurance",
  },
  motorInsurance: {
    label: "Motor Insurance",
    icon: carSvg,
    alt: "Motor insurance",
  },
  motorTwoWheeler: {
    label: "Motor Two Wheeler",
    icon: carSvg,
    alt: "Two wheeler insurance",
  },
  travelInsurance: {
    label: "Travel Insurance",
    icon: travelsvg,
    alt: "Travel insurance",
  },
  individualTravel: {
    label: "Individual Travel",
    icon: travelsvg,
    alt: "Individual travel insurance",
  },
  electronicAllRisk: {
    label: "Electronic All Risk",
    icon: travelsvg,
    alt: "Electronic all risk insurance",
  },
  electricTwoWheeler: {
    label: "Electric Two Wheeler",
    icon: carSvg,
    alt: "Electric two wheeler insurance",
  },
};

function PersonalInsurances({
  insuranceData = personalInsuranceData,
  totalPolicies = 4,
  heading,
}: PersonalInsurancesProps) {
  const { data: portalConfig, loading: portalConfigLoading } = useSelector(
    (state: RootState) => state.portalConfig
  );

  const retailConfig =
    portalConfig?.companyPortalDashboardConfig?.insurance?.retailInsurance ??
    portalConfig?.companyPortalDashboardConfig?.retailInsurance;

  const portalConfigAvailable =
    portalConfig !== null &&
    portalConfig !== undefined &&
    Object.prototype.hasOwnProperty.call(
      portalConfig,
      "companyPortalDashboardConfig"
    );

  const derivedInsuranceData = useMemo(() => {
    if (!retailConfig?.enabled) return [];

    const baseTemplate = personalInsuranceData[1] || personalInsuranceData[0];
    if (!baseTemplate) return [];

    const enabledProducts = Object.entries(retailConfig.products || {}).filter(
      ([, enabled]) => enabled === true
    );

    return enabledProducts.map(([productKey], index) => {
      const { label, icon, alt } =
        PRODUCT_LABEL_MAP[productKey] || PRODUCT_LABEL_MAP.travelInsurance;

      return {
        ...baseTemplate,
        id: `${productKey}-${index}`,
        type: label,
        icon,
        altText: alt,
      };
    });
  }, [retailConfig]);

  const insuranceList =
    derivedInsuranceData.length > 0
      ? derivedInsuranceData
      : portalConfigAvailable
      ? []
      : insuranceData;
  const additionalPoliciesCount =
    totalPolicies && totalPolicies > insuranceList.length
      ? totalPolicies - insuranceList.length
      : 0;

  // Don't render the section if there are no insurance items
  if (insuranceList.length === 0) {
    return null;
  }

  return (
    <StyledContainer>
      <StyledHeaderContainer>
        <StyledHeading>{heading ?? "Personal insurances"}</StyledHeading>
        {/* {insuranceList.length > 3 && additionalPoliciesCount > 0 && (
          <StyledViewMoreBtn>
            View {additionalPoliciesCount} more{" "}
            {additionalPoliciesCount === 1 ? "policy" : "policies"}
          </StyledViewMoreBtn>
        )} */}
      </StyledHeaderContainer>
      <StyledInsuranceContainer>
        {insuranceList.length === 0 ? (
          <Box width="100%" textAlign="center" py={2}>
            <Typography variant="body2">
              No insurance cards are available.
            </Typography>
          </Box>
        ) : (
          insuranceList.map((insurance) => (
            <StyledInsuranceCard
              key={insurance.id}
              data-testid="ibp-personal-insurance-card"
            >
              <StyledContent>
                <StyledInsuranceType>
                  <StyledTypeText title={insurance.type}>
                    {insurance.type}
                  </StyledTypeText>
                  <StyledInsuranceNo title={insurance.policyNumber}>
                    {insurance.policyNumber}
                  </StyledInsuranceNo>
                </StyledInsuranceType>
                <StyledInsuranceData>
                  <InsuranceLabel>{insurance.details.item}</InsuranceLabel>
                  <InsuranceSubHeading>
                    {insurance.details.itemLabel}
                  </InsuranceSubHeading>
                </StyledInsuranceData>
                <StyledInsuranceData>
                  <InsuranceLabel>
                    {insurance.details.insuredValue}
                  </InsuranceLabel>
                  <InsuranceSubHeading>
                    {insurance.details.insuredValueLabel}
                  </InsuranceSubHeading>
                </StyledInsuranceData>
                <StyledInsuranceData>
                  <InsuranceLabel>
                    {insurance.details.expiryDate}
                  </InsuranceLabel>
                  <InsuranceSubHeading>
                    {insurance.details.expiryLabel}
                  </InsuranceSubHeading>
                </StyledInsuranceData>
              </StyledContent>
              <StyledImgcontainer>
                <img src={insurance.icon} alt={insurance.altText} />
              </StyledImgcontainer>
            </StyledInsuranceCard>
          ))
        )}
      </StyledInsuranceContainer>
    </StyledContainer>
  );
}

export default PersonalInsurances;
