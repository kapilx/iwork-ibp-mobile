import { Box, Typography } from "@mui/material";
import {
  CommonCardContainer,
  CommonCardNumberTypography,
  CommonCardTypography,
  CommonMainNumberTypography,
  CommonMainTypography,
  Container,
  ContainerHolder,
  LogoContainer,
  MyPayContainer,
  MyPayNumberTypography,
  MyPayTypography,
  ShieldImg,
  SubContainer,
  SumInsuredContainer,
  CommonContainerStyles,
  CommonCardDivider,
  ShieldImgUnselected,
  PolicyDisplayNameContainer,
  PolicyDisplayNameTypography,
} from "./styles";
import BaseHealthPlanIcon from "../../assets/svgs/base-health-plan.svg";
import BaseHealthPlanFilledIcon from "../../assets/svgs/base-health-plan-filled.svg";
import {
  CLICKED,
  COMPANY_PAYS,
  PREMIUM_PER_FAMILY,
  PREMIUM_PER_LIFE,
  TOTAL_PREMIUM,
} from "../../constants";
import {
  formatAmountWithCurrency,
  getCurrencySymbolPrefix,
  formatNumberInputByLocalization,
  type LocalizationConfig,
} from "@ui/ui-lib";

export interface PremiumBreakdownEntry {
  label: string;
  isEmployee: boolean;
  companyPay: number;
  employeePay: number;
}

export interface SumInsuredBreakdown {
  base: number;
  enhancement: number;
}

export interface PolicyCardProps {
  sumInsured: string | number;
  premiumPerFamily: string | number;
  companyPays: string | number;
  myPay: string | number;
  state: "active" | "disabled" | "clicked";
  onClick?: () => void;
  premiumPerLife: boolean;
  showCompanyContribution: boolean;
  localization?: LocalizationConfig;
  isReadOnly?: boolean;
  isSingleChoice?: boolean;
  policyName?: string;
  policyDisplayName?: string;
  selectedMemberCount?: number;
  // Per-life premium composition (e.g. Self + each dependent priced at their
  // own band) for dependent-count/attribute-aware policies — shown instead of
  // the generic "per person × N" note when present.
  premiumBreakdown?: PremiumBreakdownEntry[];
  // Base Sum Insured + Dependent Count band enhancement, shown as a split.
  sumInsuredBreakdown?: SumInsuredBreakdown;
}

const CommonPolicyCard: React.FC<PolicyCardProps> = ({
  sumInsured,
  premiumPerFamily,
  companyPays,
  myPay,
  state,
  onClick,
  premiumPerLife = false,
  showCompanyContribution = true,
  localization,
  isReadOnly = false,
  isSingleChoice = false,
  policyName,
  policyDisplayName,
  selectedMemberCount,
  premiumBreakdown,
  sumInsuredBreakdown,
}) => {
  const hasPremiumBreakdown = Array.isArray(premiumBreakdown) && premiumBreakdown.length > 1;
  const hasSumInsuredBreakdown = Boolean(sumInsuredBreakdown && sumInsuredBreakdown.enhancement > 0);
  const baseMyPay = Number(myPay) || 0;
  const myPayDisplay = Number.parseFloat(baseMyPay.toFixed(2));
  const effectiveCount = premiumPerLife ? (selectedMemberCount || 1) : 1;
  // When a per-life breakdown is already present, myPay/premiumPerFamily/companyPays are already
  // the correctly-summed family total (each life's own age-bucket price added together) — multiplying
  // by effectiveCount again would double-count. Only apply the flat per-head multiplier for the
  // legacy case where myPay is a single flat per-person rate with no breakdown to back it up.
  const totalMyPay = hasPremiumBreakdown ? myPayDisplay : Number.parseFloat((baseMyPay * effectiveCount).toFixed(2));

  const basePremium = Number(premiumPerFamily) || 0;
  const premiumDisplay = Number.parseFloat(basePremium.toFixed(2));
  const totalPremium = hasPremiumBreakdown ? premiumDisplay : Number.parseFloat((basePremium * effectiveCount).toFixed(2));

  const baseCompanyPays = Number(companyPays) || 0;
  const companyPaysDisplay = Number.parseFloat(baseCompanyPays.toFixed(2));
  const totalCompanyPays = hasPremiumBreakdown ? companyPaysDisplay : Number.parseFloat((baseCompanyPays * effectiveCount).toFixed(2));
  return (
    <Container
      onClick={isSingleChoice && state === CLICKED ? undefined : onClick}
      state={state}
      isReadOnly={isReadOnly}
      isSingleChoice={isSingleChoice}
      data-testid="ibp-common-policy-card"
    >
      <ContainerHolder>
        <SubContainer>
          <LogoContainer>
            {state === CLICKED ? (
              <ShieldImg
                src={BaseHealthPlanFilledIcon}
                alt="Base Health Plan Filled Icon"
              />
            ) : (
              <ShieldImgUnselected src={BaseHealthPlanIcon} alt="Base Health Plan Icon" />
            )}
          </LogoContainer>
          <SumInsuredContainer data-testid="sum-insured-container">
            <CommonMainTypography>Sum Insured</CommonMainTypography>
            <CommonMainNumberTypography>
              {formatAmountWithCurrency(Number(sumInsured), localization, 2)}
            </CommonMainNumberTypography>
            {hasSumInsuredBreakdown && (
              <Typography sx={{ fontSize: '12px', color: '#187FE2' }}>
                ({formatAmountWithCurrency(sumInsuredBreakdown!.base, localization, 2)} base + {formatAmountWithCurrency(sumInsuredBreakdown!.enhancement, localization, 2)} for dependents)
              </Typography>
            )}
          </SumInsuredContainer>
        </SubContainer>
        <CommonContainerStyles>
          {showCompanyContribution && (
            <>
            <CommonCardDivider />
              <CommonCardContainer>
                <CommonCardTypography>
                  {TOTAL_PREMIUM}
                </CommonCardTypography>
                 <CommonCardNumberTypography>
                  {formatAmountWithCurrency(
                    Number(premiumPerFamily),
                    localization,
                    2,
                  )}
                </CommonCardNumberTypography>
              </CommonCardContainer>
              <CommonCardDivider />
            </>
          )}
          {showCompanyContribution && (
            <CommonCardContainer>
              <CommonCardTypography>{COMPANY_PAYS}</CommonCardTypography>
               <CommonCardNumberTypography>
                {formatAmountWithCurrency(Number(companyPays), localization, 2)}
              </CommonCardNumberTypography>
              {hasPremiumBreakdown ? (
                <Typography sx={{ fontSize: '12px', color: '#187FE2' }}>
                  ({premiumBreakdown!
                    .map((life) => `${life.label}: ${formatAmountWithCurrency(life.companyPay, localization, 2)}`)
                    .join(' + ')})
                </Typography>
              ) : (
                premiumPerLife && effectiveCount > 1 && (
                  <Typography sx={{ fontSize: '12px', color: '#187FE2' }}>
                    ({formatAmountWithCurrency(companyPaysDisplay, localization, 2)} per person × {effectiveCount})
                  </Typography>
                )
              )}
            </CommonCardContainer>
          )}
        </CommonContainerStyles>
      </ContainerHolder>
      <MyPayContainer state={state}>
        <MyPayTypography state={state}>Your contribution</MyPayTypography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: (hasPremiumBreakdown || (premiumPerLife && effectiveCount > 1)) ? '15px' : 0 }}>
          <MyPayNumberTypography state={state}>
            {getCurrencySymbolPrefix(localization)}{formatNumberInputByLocalization(totalMyPay, localization, 2, 2)}
          </MyPayNumberTypography>
          {hasPremiumBreakdown ? (
            <Typography sx={{ fontSize: '12px', color: '#187FE2' }}>
              ({premiumBreakdown!
                .map((life) => `${life.label}: ${formatAmountWithCurrency(life.employeePay, localization, 2)}`)
                .join(' + ')})
            </Typography>
          ) : (
            premiumPerLife && effectiveCount > 1 && (
              <Typography sx={{ fontSize: '12px', color: '#187FE2' }}>
                ({formatAmountWithCurrency(myPayDisplay, localization, 2)} per person × {effectiveCount})
              </Typography>
            )
          )}
        </Box>
      </MyPayContainer>
    </Container>
  );
};

export default CommonPolicyCard;
