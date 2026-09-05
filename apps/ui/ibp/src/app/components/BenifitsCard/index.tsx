import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import checkedGreenIcon from "../../assets/svgs/checked-green-icon.svg";
import {
  StyledBenefitCard,
  CardHeader,
  BenefitTitle,
  PolicyPeriodBadge,
  PolicyPeriodText,
  ArrowButton,
  FeaturesGrid,
  FeatureItem,
  CheckIconWrapper,
  FeatureText,
  SummaryGrid,
  SummaryItem,
  SummaryLabel,
  SummaryValue,
  CardFooter,
  ViewDetailsText,
  StyledCardContent,
  PolicyIcon,
} from "./styles";
import { Box } from "@mui/material";
import { getPolicyIcon } from "../PolicySummaryCard";
import { useLocalization, formatAmountWithCurrency } from "@ui/ui-lib";

type BenefitCardProps = {
  name: string;
  policyStartDate?: string;
  policyEndDate?: string;
  features: string[];
  highlighted?: boolean;
  buttonText?: string;
  isEnrolled?: boolean;
  isEditable?: boolean;
  onEnroll?: () => void;
  onViewSummary?: () => void;
  policyData?: any;
  sumInsured?: string | number | null | (string | number)[];
  membersCovered?: string | null;
  eligibleRelations?: string[];
  isActionDisabled?: boolean;
};


const BenefitCard = ({
  name,
  policyStartDate,
  policyEndDate,
  features,
  highlighted = false,
  buttonText = "View Policy Details",
  isEnrolled = false,
  isEditable = false,
  onEnroll,
  onViewSummary,
  policyData,
  sumInsured,
  membersCovered,
  eligibleRelations,
  isActionDisabled = false,
}: BenefitCardProps) => {
  const { localizationData } = useLocalization();

  const handleCardClick = () => {
    if (isActionDisabled) {
      return;
    }

    if (isEditable && onEnroll) {
      onEnroll();
    } else if (isEnrolled && onViewSummary) {
      onViewSummary();
    } else if (onEnroll) {
      onEnroll();
    }
  };

  const policyIconData = getPolicyIcon(policyData?.policyName || name);

  // Normalize sumInsured to array format for consistent rendering
  const sumInsuredArray = Array.isArray(sumInsured)
    ? sumInsured
    : sumInsured
    ? [sumInsured]
    : [];

  return (
    <StyledBenefitCard>
          {/* <PolicyPeriodBadge>
            <PolicyPeriodText>Policy Period - {formatDate(policyStartDate, "DD/MM/YYYY")} to {formatDate(policyEndDate, "DD/MM/YYYY")}</PolicyPeriodText>
          </PolicyPeriodBadge> */}
      <StyledCardContent>
        <Box sx={{display: "flex", flexDirection: "column", gap: 2}}>
        <CardHeader className="card-header">
          <PolicyIcon gradient={policyIconData.gradient}>
                                    {policyIconData.initials}
          </PolicyIcon>
          <BenefitTitle className="benefit-title">{name}</BenefitTitle>
          </CardHeader>

          {(sumInsuredArray.length > 0 || membersCovered || (eligibleRelations && eligibleRelations.length > 0)) && (
            <SummaryGrid>
              {sumInsuredArray.length > 0 && (
                <SummaryItem>
                  <SummaryLabel>Sum Insured</SummaryLabel>
                  <SummaryValue>
                    {sumInsuredArray
                      .map((value) =>
                        // Already-formatted currency string (e.g. "Rs 1,000,000" for Sri
                        // Lanka, "₹10,00,000" for India) — any leftover non-digit/comma/
                        // period/space char means it's pre-formatted. Checking only for a
                        // hardcoded "₹" breaks for every non-Indian symbol.
                        typeof value === 'string' && /[^\d.,\s]/.test(value)
                          ? value
                          : `${formatAmountWithCurrency(Number(value), localizationData?.data)}`
                      )
                      .join(' / ')}
                  </SummaryValue>
                </SummaryItem>
              )}
              {membersCovered && (
                <SummaryItem>
                  <SummaryLabel>Members covered</SummaryLabel>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', mt: 0.5 }}>
                    {membersCovered.split(' + ').map((part) => {
                      const trimmed = part.trim();
                      const match = trimmed.match(/^(\d+)\s+(.+)$/);
                      let label: string;
                      if (match) {
                        const count = Number(match[1]);
                        const word = match[2].toLowerCase();
                        if (word === 'child' || word === 'children') {
                          label = `${count} ${count > 1 ? 'Children' : 'Child'}`;
                        } else {
                          const capitalized = word.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                          label = `${count} ${capitalized}`;
                        }
                      } else {
                        label = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                      }
                      return (
                      <Box
                        key={part}
                        sx={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          backgroundColor: '#fff',
                          border: '1px solid #BFDBFE',
                          color: '#093F84',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </Box>
                      );
                    })}
                  </Box>
                </SummaryItem>
              )}
            </SummaryGrid>
          )}

        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureItem key={index}>
              <CheckIconWrapper>
                {/* <CheckCircleIcon /> */}
                <img src={checkedGreenIcon} alt="check icon" />
              </CheckIconWrapper>
              <FeatureText>{feature}</FeatureText>
            </FeatureItem>
          ))}
        </FeaturesGrid>
</Box>
        <CardFooter>
          <ArrowButton
            $disabled={isActionDisabled}
            aria-disabled={isActionDisabled}
            className={`arrow-button${isActionDisabled ? " is-disabled" : ""}`}
            onClick={handleCardClick}
          >
            <ViewDetailsText className="view-details-text">
              {buttonText}
            </ViewDetailsText>
            {/* <ArrowForwardIcon /> */}
          </ArrowButton>
        </CardFooter>
      </StyledCardContent>
    </StyledBenefitCard>
  );
};

export default BenefitCard;
