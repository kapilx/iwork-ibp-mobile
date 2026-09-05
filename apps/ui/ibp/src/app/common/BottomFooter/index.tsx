import React from "react";
import enrollmentFooterImage from "../../assets/svgs/enrollment-footer-image.svg";
import { CONTINUE, SAVE_EXIT, EDIT } from "../../constants";
import CommonButton from "../Button";
import {
  ButtonContainer,
  ContinueButton,
  FooterBanner,
  FooterBannerLeft,
  StyledImage,
  StyledRightContainer,
} from "./styles";
import { useLocation } from "react-router-dom";
import DashboardEnrollmentSummary from "../../components/DashboardEnrollmentSummary";

interface FooterStats {
  plansSelected: number;
  membersCover: number;
  totalPremium: string;
  companyPays: string;
  yourPay: string;
}

interface BottomFooterProps {
  stats: FooterStats;
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
  loading?: boolean;
  isContinueDisabled?: boolean;
  overAllData?: any;
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  isReadOnly?: boolean;
  resetData: () => void;
  isMultiEnrollment?: boolean;
  showActionBanner?: boolean;
  enrollmentSummaryData?: any;
}

function Bottomfooter({
  stats,
  onBack,
  onSave,
  onContinue,
  loading = false,
  isContinueDisabled = false,
  overAllData,
  setIsReadOnly,
  isReadOnly = false,
  resetData,
  isMultiEnrollment = false,
  showActionBanner = true,
  enrollmentSummaryData,
}: BottomFooterProps) {
  const { plansSelected, membersCover, totalPremium, companyPays, yourPay } =
    stats;

  const location = useLocation();

  // Format single digits with leading zero (1 -> 01, 10 -> 10)
  const formatWithLeadingZero = (num: number): string => {
    return num < 10 ? `0${num}` : num.toString();
  };

  const isPolicyAlreadyEnrolled =
    location.state?.policyInfo?.isEditable ?? false;

  let showEmployeeContribution = false;

  if (isMultiEnrollment) {
    showEmployeeContribution = Array.isArray(overAllData)
      ? overAllData.some(
          (policy: any) =>
            policy?.configuration?.constraints?.showEmployeeContribution
        )
      : false;
  } else {
    showEmployeeContribution =
      overAllData?.constraints?.showEmployeeContribution;
  }

  const handleButtonClick = () => {
    if (isPolicyAlreadyEnrolled) {
      //back to read only mode
      setIsReadOnly(true);
      resetData();
    } else {
      // Save & Exit action
      onSave();
    }
  };

  return (
    <StyledRightContainer>
      <DashboardEnrollmentSummary
        enrollmentSummaryData={enrollmentSummaryData}
      />
      {/* <FooterContainer data-testid="ibp-bottom-footer">
        <LabelValueContainer data-testid="ibp-bottom-footer-label-value-container">
          <LabelValueHolder data-testid="footer-value-holder">
            <FooterNumberTypography>
              {formatWithLeadingZero(plansSelected)}
            </FooterNumberTypography>
            <FooterLabelTypography>
              {BOTTOM_FOOTER.PLANS_SELECTED}
            </FooterLabelTypography>
          </LabelValueHolder>
          <LabelValueHolder data-testid="footer-value-holder">
            <FooterNumberTypography>
              {formatWithLeadingZero(membersCover)}
            </FooterNumberTypography>
            <FooterLabelTypography>
              {BOTTOM_FOOTER.MEMBERS_COVER}
            </FooterLabelTypography>
          </LabelValueHolder>
          <LabelValueHolder data-testid="footer-value-holder">
            <FooterNumberTypography>{totalPremium}</FooterNumberTypography>
            <FooterLabelTypography>
              {BOTTOM_FOOTER.TOTAL_PREMIUM}
            </FooterLabelTypography>
          </LabelValueHolder>
          {showEmployeeContribution && (
            <LabelValueHolder data-testid="footer-value-holder">
              <FooterNumberTypography>{companyPays}</FooterNumberTypography>
              <FooterLabelTypography>
                {BOTTOM_FOOTER.COMPANY_PAYS}
              </FooterLabelTypography>
            </LabelValueHolder>
          )}
          <LabelValueHolder data-testid="footer-value-holder">
            <FooterNumberTypography>{yourPay}</FooterNumberTypography>
            <FooterLabelTypography>
              {BOTTOM_FOOTER.YOUR_PAY}
            </FooterLabelTypography>
          </LabelValueHolder>
        </LabelValueContainer>
        <StyledImage src={groupPolicyImage} alt="group" />
      </FooterContainer> */}
      {showActionBanner && (
        <FooterBanner>
          <FooterBannerLeft>
            <StyledImage src={enrollmentFooterImage} alt="enrollment footer" />
          </FooterBannerLeft>
          <ButtonContainer>
            {isReadOnly ? (
              <CommonButton
                variant="contained"
                buttonType="secondary"
                label={EDIT}
                onClick={() => setIsReadOnly(false)}
                loading={loading}
                fullWidth={true}
                width={"100%"}
              />
            ) : (
              <>
                <CommonButton
                  variant="outlined"
                  buttonType="primary"
                  label={isPolicyAlreadyEnrolled ? "Cancel" : SAVE_EXIT}
                  onClick={handleButtonClick}
                  loading={loading}
                  disabled={isReadOnly}
                  fullWidth={true}
                  width={"100%"}
                />
                <ContinueButton
                  variant="contained"
                  buttonType="secondary"
                  label={CONTINUE}
                  onClick={onContinue}
                  disabled={isContinueDisabled || isReadOnly}
                  fullWidth={true}
                  width={"100%"}
                />
              </>
            )}
          </ButtonContainer>
        </FooterBanner>
      )}
    </StyledRightContainer>
  );
}

export default Bottomfooter;
