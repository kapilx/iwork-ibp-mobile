import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Tooltip } from "@mui/material";
import { formatDate, formatAmountWithCurrency, useLocalization } from "@ui/ui-lib";
import checkedGreenIcon from "../../assets/svgs/checked-green-icon.svg";
import { FeaturesGrid, FeatureItem, CheckIconWrapper, FeatureText, FeaturesGridEnrolledPolicies } from "../BenifitsCard/styles";
import {
  ActionButton,
  ActionLink,
  ActionLinkText,
  CardBadge,
  CardContainer,
  CardFooter,
  CardHeader,
  CardTitle,
  DetailsGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  LeftContainer,
  ButtonContainer,
  PolicyIcon,
} from "./styles";
import { DATE_FORMATS } from "../../constants";

export type PolicySummaryCardProps = {
  name: string;
  policyName?: string;
  badgeText?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  sumInsured?: string | number | null;
  claimIntimatedAmount?: number | null;
  amountClaimed?: number | null;
  amountAvailable?: string | number | null;
  membersCovered?: string | null;
  ctaVariant?: "button" | "link";
  ctaLabel?: string;
  onCtaClick?: () => void;
  isCtaDisabled?: boolean;
  showCta?: boolean;
  showAmountAvailable?: boolean;
  features?: string[];
};

export const getPolicyIcon = (policyName?: string) => {
  const name = policyName || "";

  const normalizedName = name.toLowerCase();

  // Special cases for parental policies
  if (normalizedName === "group mediclaim parental") {
    return {
      initials: "GMC-P",
      gradient: "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)",
    };
  }
  if (normalizedName === "group term life parental") {
    return {
      initials: "GTL-P",
      gradient: "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)",
    };
  }
  if (normalizedName === "group personal accident parental") {
    return {
      initials: "GPA-P",
      gradient: "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
    };
  }

  // Initials: first letter of each of the first 3 alphabetic words (ignores &, -, numbers, etc.)
  const words = name.split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w));
  const initials =
    words
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join("") || "POL";

  // Fixed colours for known initials
  if (initials === "POL") return { initials, gradient: "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)" };
  if (initials === "GTL") return { initials, gradient: "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)" };
  if (initials === "GMC") return { initials, gradient: "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)" };
  if (initials === "GPA") return { initials, gradient: "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)" };

  // Gradient: deterministic alphabetical pattern so the same policy always gets the same colour
  const gradients = [
    "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)", // gold
    "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)",          // green
    "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)", // orange
  ];
  const firstAlphaChar = name.match(/[a-zA-Z]/)?.[0]?.toUpperCase() ?? "";
  const alphaIndex = firstAlphaChar
    ? firstAlphaChar.charCodeAt(0) - "A".charCodeAt(0)
    : 0;
  const gradient = gradients[((alphaIndex % 3) + 3) % 3];

  return { initials, gradient };
};


const PolicySummaryCard = ({
  name,
  policyName,
  badgeText,
  policyStartDate,
  policyEndDate,
  sumInsured,
  claimIntimatedAmount,
  amountClaimed,
  amountAvailable,
  membersCovered,
  ctaVariant = "button",
  ctaLabel = "View More Details",
  onCtaClick,
  isCtaDisabled = false,
  showCta = true,
  showAmountAvailable = true,
  features = [],
}: PolicySummaryCardProps) => {
  const { localizationData } = useLocalization();
  const formattedStart = policyStartDate
    ? formatDate(policyStartDate, DATE_FORMATS.DAY_SHORT_MONTH_YEAR) ?? "--"
    : "--";
  const formattedEnd = policyEndDate
    ? formatDate(policyEndDate, DATE_FORMATS.DAY_SHORT_MONTH_YEAR) ?? "--"
    : "--";
  const policyPeriod = `${formattedStart} - ${formattedEnd}`;

  const claimIntimatedValue =
    typeof claimIntimatedAmount === "number" && Number.isFinite(claimIntimatedAmount) && claimIntimatedAmount > 0
      ? `${formatAmountWithCurrency(claimIntimatedAmount, localizationData?.data)}`
      : null;

  const hasClaims =
    typeof claimIntimatedAmount === "number" &&
    Number.isFinite(claimIntimatedAmount) &&
    claimIntimatedAmount > 0;

  const claimedValue =
    hasClaims
      ? `${formatAmountWithCurrency(
          typeof amountClaimed === "number" && Number.isFinite(amountClaimed)
            ? amountClaimed
            : 0,
          localizationData?.data,
        )}`
      : null;
  // Detects a value that's already a formatted currency string (e.g. "₹10,00,000"
  // for India or "Rs 1,000,000" for Sri Lanka) so it isn't re-parsed through
  // Number(...) and re-formatted — any leftover non-digit/comma/period/space
  // character (a currency symbol or word like "Rs") means it's pre-formatted.
  // Checking for a hardcoded "₹" here would break for every non-Indian symbol.
  const isPreformattedAmount = (value: unknown): value is string =>
    typeof value === "string" && /[^\d.,\s]/.test(value);

  const sumInsuredValue =
    sumInsured !== null && sumInsured !== undefined
      ? (isPreformattedAmount(sumInsured)
          ? sumInsured
          : `${formatAmountWithCurrency(Number(sumInsured), localizationData?.data)}`)
      : "--";

  const availableValue =
    amountAvailable !== null && amountAvailable !== undefined
      ? (isPreformattedAmount(amountAvailable)
          ? amountAvailable
          : `${formatAmountWithCurrency(Number(amountAvailable), localizationData?.data)}`)
      : "--";

  const formatMembersCovered = (members: string | null | undefined): string => {
    if (!members) return '--';
    
    const regex = /^1\s+([a-zA-Z].*)$/;
    return members
      .split('+')
      .map(part => part.trim())
      .map(part => {
        // Remove leading "1 " if followed by a letter
        const match = regex.exec(part);
        if (match) {
          return match[1];
        }
        return part;
      })
      .join('+');
  };
      
  const policyIconData = getPolicyIcon(policyName || name);

  return (
    <CardContainer variant={ctaVariant}>
      <CardHeader className="card-header" variant={ctaVariant}>
        <PolicyIcon gradient={policyIconData.gradient}>
              {policyIconData.initials}
        </PolicyIcon>
        <CardTitle className="benefit-title">{name}</CardTitle>
        {/* {badgeText ? <CardBadge>{badgeText}</CardBadge> : null} */}
      </CardHeader>
      <DetailsGrid>
        <LeftContainer>
          <DetailItem>
            <DetailLabel>Sum Insured</DetailLabel>
            <DetailValue>{sumInsuredValue}</DetailValue>
          </DetailItem>
          {claimIntimatedValue !== null && (
            <DetailItem>
              <DetailLabel>Amount Intimated</DetailLabel>
              <DetailValue colorVariant="claimed">{claimIntimatedValue}</DetailValue>
            </DetailItem>
          )}
          {claimedValue !== null && (
            <DetailItem>
              <DetailLabel>Amount Claimed</DetailLabel>
              <DetailValue colorVariant="claimed">{claimedValue}</DetailValue>
            </DetailItem>
          )}
          {showAmountAvailable && (
            <DetailItem>
              <DetailLabel>Amount Available</DetailLabel>
              <DetailValue
                colorVariant="available"
                isZero={Number(amountAvailable) === 0}
              >
                {availableValue}
              </DetailValue>
            </DetailItem>
          )}
          <DetailItem>
            <DetailLabel>Policy Period</DetailLabel>
            <DetailValue>{policyPeriod}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Members Covered</DetailLabel>
            <DetailValue>{formatMembersCovered(membersCovered)}</DetailValue>
          </DetailItem>
        </LeftContainer>
        <ButtonContainer>
          {showCta && ctaVariant === "button" ? (
            <DetailItem alignRight>
              <ActionButton className="arrow-button" disabled={isCtaDisabled} onClick={onCtaClick}>
                {ctaLabel}
              </ActionButton>
            </DetailItem>
            
          ) : null}
        </ButtonContainer>
      </DetailsGrid>
      {features.length > 0 && (
        <FeaturesGridEnrolledPolicies>
          {features.map((feature, index) => (
            <FeatureItem key={index}>
              <CheckIconWrapper>
                <img src={checkedGreenIcon} alt="check icon" />
              </CheckIconWrapper>
              <FeatureText>{feature}</FeatureText>
            </FeatureItem>
          ))}
        </FeaturesGridEnrolledPolicies>
      )}
      {showCta && ctaVariant === "link" ? (
        <CardFooter>
          <ActionLink disabled={isCtaDisabled} onClick={onCtaClick}>
            <ActionLinkText>{ctaLabel}</ActionLinkText>
            <ArrowForwardIcon fontSize="small" />
          </ActionLink>
        </CardFooter>
      ) : null}
    </CardContainer>
  );
};

export default PolicySummaryCard;
