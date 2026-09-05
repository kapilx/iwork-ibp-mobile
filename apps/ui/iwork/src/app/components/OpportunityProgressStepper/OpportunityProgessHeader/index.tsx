import React, { useEffect, useState } from "react";
import {
  Button,
  ChipRenderer,
  DATE_FORMATS,
  FeatureKey,
  LocalizationConfig,
  formatCurrencyByLocalization,
  formatLargeNumber,
  formatDate,
  selectHasPermission,
  useLocalization,
  formatLargeCurrency,
} from "@ui/ui-lib";
import { Typography } from "@mui/material";
import { priorityStyleMap } from "../../../pages/CompanyPage/CompanyListing/tableConfig";
import {
  OpportunityCompanyTypeStyleMap,
  OpportunitycrmLeadStyleMap,
  OpportunityDateStyleMap,
  OpportunityHeaderDetails,
} from "../opportunityCardTypes";
import {
  BrokerageSection,
  BrokerageSectionBox,
  BrokerageTypography,
  ChipContainer,
  OpportunityStepperCompanyName,
  CompanyPrimarySection,
  CompanySecondarySection,
  CompanySection,
  CompanyTypeTypography,
  OpportunityProgressHeaderContainer,
  PolicyType,
  PolicyTypeTypography,
  SpanTypography,
  PolicytypeLabelStyles,
  LabelStyles,
  ValueStyles,
  OpportunityStatusContainer,
  OpportunityStatusTypography,
  OpportunityStatusAndBrokerageContainer,
  ExpiryDateContainer,
  ReOpenButton,
} from "./styles";
import {
  BROKERAGE,
  EXPIRY_DATE,
  IN_PROGRESS,
  LOST,
  OPEN,
  POLICY_TYPE,
  PREMIUM,
  SO_EXPIRY_DATE,
  WON,
} from "../../../constants";
import OpportunityWonIcon from "../../../assets/svgs/opportunity-won-icon.svg";
import OpportunityLostIcon from "../../../assets/svgs/opportunity-lost-icon.svg";
import OpportunityOpenIcon from "../../../assets/svgs/opportunity-open-icon.svg";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const OpportunityProgressHeader: React.FC<
  OpportunityHeaderDetails & { onEditExpiryDate?: () => void }
> = ({
  opportunityDetails,
  isOpportunityLost = false,
  isOpportunityWon = false,
  isOptyWorkInProgress = false,
  onEditExpiryDate,
}) => {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const localization: LocalizationConfig | undefined = localizationData?.data;
  const canUpdateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXTEND_OPPORTUNITY_EXPIRY)(state)
  );
  const status = opportunityDetails?.opportunityStatus?.toLowerCase();
  const isRenewal = opportunityDetails?.opportunityType === "RO";

  const [actionButtonType, setActionButtonType] = useState<
    "reopen" | "extend" | null
  >(null);
  useEffect(() => {
    if (status === "lost" || isOpportunityLost) {
      setActionButtonType("reopen");
    } else if (status === "work in progress" || isOptyWorkInProgress) {
      setActionButtonType("extend");
    } else {
      setActionButtonType(null);
    }
  }, [status, isOpportunityLost, isOptyWorkInProgress]);

  const isEditable = canUpdateOpportunity && !!actionButtonType;

  // Expiry strictly before today (date-only) -> expired; today/future -> active
  const isExpiryPast = (() => {
    if (!opportunityDetails?.expiryDate) return false;
    const expiry = new Date(opportunityDetails.expiryDate);
    const today = new Date();
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  })();

  return (
    <OpportunityProgressHeaderContainer data-testid="opportunity-header-card">
      <CompanySection>
        <CompanyPrimarySection data-testid="company-primary-section">
          <OpportunityStepperCompanyName
            onClick={() =>
              opportunityDetails?.companyId &&
              navigate(`/companies/${opportunityDetails.companyId}`)
            }
            style={{
              cursor: opportunityDetails?.companyId ? "pointer" : undefined,
            }}
          >
            {opportunityDetails?.companyName}
          </OpportunityStepperCompanyName>
          <ChipContainer>
            <ChipRenderer
              value={
                (opportunityDetails?.priority ?? "").charAt(0).toUpperCase() +
                (opportunityDetails?.priority ?? "").slice(1)
              }
              styleMap={priorityStyleMap}
              size="small"
              variant="normal"
              padding="2px 4px"
              maxWidth="70px"
            />
            <ChipRenderer
              value={
                <Typography>
                  <b>{opportunityDetails?.crmLead}</b>
                </Typography>
              }
              styleMap={OpportunitycrmLeadStyleMap}
              size="small"
              variant="withImage"
              padding="4px 8px"
            />
          </ChipContainer>
        </CompanyPrimarySection>
        <CompanySecondarySection data-testid="company-secondary-section">
          <ChipRenderer
            value={
              <CompanyTypeTypography>
                {opportunityDetails?.opportunityType} -{" "}
                {opportunityDetails?.opportunityId}
              </CompanyTypeTypography>
            }
            styleMap={OpportunityCompanyTypeStyleMap}
            size="small"
            maxWidth="140px"
          />
          <PolicyType>
            <PolicyTypeTypography>{POLICY_TYPE}</PolicyTypeTypography>
            <PolicytypeLabelStyles>
              {opportunityDetails?.policyType}
            </PolicytypeLabelStyles>
          </PolicyType>
          <ChipRenderer
            value={
              <ExpiryDateContainer>
                <LabelStyles>
                  {opportunityDetails?.opportunityType === "RO"
                    ? EXPIRY_DATE
                    : SO_EXPIRY_DATE}{" "}
                  -{" "}
                </LabelStyles>
                <ValueStyles>
                  {formatDate(
                    opportunityDetails?.expiryDate,
                    DATE_FORMATS.DATE_MONTH_YEAR
                  )}
                </ValueStyles>
              </ExpiryDateContainer>
            }
            styleMap={{
              default:
                OpportunityDateStyleMap[isExpiryPast ? "expired" : "active"],
            }}
            size="small"
            variant="withDot"
          />
          {isEditable && actionButtonType === "extend" && (
            <Button variantType="link" onClick={onEditExpiryDate}>
              Extend
            </Button>
          )}
        </CompanySecondarySection>
      </CompanySection>
      <OpportunityStatusAndBrokerageContainer>
        <OpportunityStatusContainer data-testid="opportunity-status-container">
          {(() => {
            if (isOpportunityLost || status === "lost") {
              return (
                <>
                  <img src={OpportunityLostIcon} alt="Opportunity Lost" />
                  <OpportunityStatusTypography status={LOST}>
                    {LOST}
                  </OpportunityStatusTypography>
                </>
              );
            } else if (isOpportunityWon || status === "won") {
              return (
                <>
                  <img src={OpportunityWonIcon} alt="Opportunity Won" />
                  <OpportunityStatusTypography status={WON}>
                    {WON}
                  </OpportunityStatusTypography>
                </>
              );
            } else if (isOptyWorkInProgress || status === "work in progress") {
              return (
                <>
                  <img src={OpportunityOpenIcon} alt="Opportunity WIP" />
                  <OpportunityStatusTypography status={OPEN}>
                    {IN_PROGRESS}
                  </OpportunityStatusTypography>
                </>
              );
            } else {
              return (
                <>
                  <img src={OpportunityOpenIcon} alt="Opportunity Open" />
                  <OpportunityStatusTypography
                    status={OPEN}
                    data-testid="opportunity-status-open"
                  >
                    {status === "isg planning"
                      ? "ISG Planning"
                      : status === "bd planning"
                      ? isRenewal
                        ? "Renewal Planning"
                        : "BD Planning"
                      : OPEN}
                  </OpportunityStatusTypography>
                </>
              );
            }
          })()}
          {isEditable && actionButtonType === "reopen" && (
            <ReOpenButton
              variantType="link"
              onClick={onEditExpiryDate}
              className="reopen-button"
            >
              Re-Open
            </ReOpenButton>
          )}
        </OpportunityStatusContainer>
        <BrokerageSection data-testid="brokerage-section">
          <BrokerageSectionBox>
            <SpanTypography>{PREMIUM}</SpanTypography>
            <BrokerageTypography>
              {formatLargeCurrency(opportunityDetails?.premium, localization)}
            </BrokerageTypography>
          </BrokerageSectionBox>
          <BrokerageSectionBox>
            <SpanTypography>{BROKERAGE}</SpanTypography>
            <BrokerageTypography>
              {formatLargeCurrency(opportunityDetails?.brokerage, localization)}
            </BrokerageTypography>
          </BrokerageSectionBox>
        </BrokerageSection>
      </OpportunityStatusAndBrokerageContainer>
    </OpportunityProgressHeaderContainer>
  );
};

export default OpportunityProgressHeader;
