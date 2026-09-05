import { capitalizeFirst } from "../../utils";
import {
  BACK,
  CANCEL,
  COMPANY_CONTRIBUTION,
  COMPANY_PAYS,
  CONFIRM_ENROLLMENT,
  EDIT,
  MEMBERS_COVERED,
  MEMBERS_SELECTED,
  PREMIUM,
  SAVE,
  SUM_INSURED,
  VIEW_ENROLLMENT_SUMMARY,
  YOUR_CONTRIBUTION,
  YOUR_SELECTED_PLANS,
  DECLARATION_DATA,
  PREMIUM_PER_FAMILY,
  PREMIUM_PER_LIFE,
} from "../../constants";
import {
  BannerBackGround,
  BannerBox,
  BannerContainer,
  BannerContainerDetails,
  BannerMainBackground,
  BannerNumberTypography,
  BannerTypography,
  ButtonContainer,
  ChipsContainer,
  CommonBannerContainer,
  CommonHolder,
  CommonLabelTypography,
  CommonNumberTypography,
  CommonSummaryContainer,
  Container,
  DeclarationCheckbox,
  DeclarationContent,
  DeclarationPoint,
  DeclarationPointLabel,
  DeclarationSection,
  DeclarationTitle,
  HeaderTypography,
  Holder,
  HoriZontalDivider,
  MainContainer,
  MembersContainer,
  PlanTypography,
  StyledSpan,
  SubBannerContainer,
  SubBannerWrapper,
  SubMembersContainer,
  SubSummaryContainer,
  SummaryHeading,
  ValueHolder,
  VerticalDivider,
  ViewSummaryContainer,
} from "./styles";
import DownBackGround from "../../assets/svgs/enrollment-summary-banner-down.svg";
import MainBackGroundImg from "../../assets/svgs/summary-card-lines.svg";
import ColoredShiledIcon from "../../assets/svgs/colored-shield-icon.svg";
import { Box } from "@mui/material";
import CommonChip from "../../common/CommonChip";
import CommonButton from "../../common/Button";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { endPoints, getPayrollInstallments, useApiQuery } from "@ui/ui-lib";
import CommonLoader from "../../common/CommonLoader";
import { generatePolicySummaryFromConfig } from "./utils";
import { useLocalization, formatAmountWithCurrency } from "@ui/ui-lib";

export interface EnrollmentSummaryProps {
  policyConfigurationData: any[];
  summaryData: any;
  handleSave: (action: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onCancel: () => void;
  loading: boolean;
  isLoading: boolean;
  isViewOnly?: boolean;
  isViewOnlyFromEnrolled?: boolean;
}

// Bolds "<n> equal instalments" inside a declaration line. Done at render time,
// not in the string: React escapes text nodes, so `<b>` in the content would
// show up literally — and that same string is persisted to `disclaimersAccepted`
// on submit, where markup has no business being.
const withBoldInstallments = (text: string) =>
  String(text ?? "")
    .split(/(\d+ equal instalments)/)
    .map((part, index) =>
      /^\d+ equal instalments$/.test(part) ? (
        <b key={`inst-${index}`}>{part}</b>
      ) : (
        part
      ),
    );

const EnrollmentSummary: React.FC<EnrollmentSummaryProps> = ({
  policyConfigurationData,
  summaryData,
  handleSave,
  onBack,
  onContinue,
  onCancel,
  loading,
  isLoading,
  isViewOnly = false,
  isViewOnlyFromEnrolled = false,
}) => {
  const { localizationData } = useLocalization();
  const [plans, setPlans] = useState<any[]>([]);
  const [enrollmentInfo, setEnrollmentInfo] = useState<any>({
    policyConsumers: [],
    premium: formatAmountWithCurrency(0, localizationData?.data),
    companyContribution: formatAmountWithCurrency(0, localizationData?.data),
    yourContribution: formatAmountWithCurrency(0, localizationData?.data),
    showCompanyContribution: true,
  });
  const showDeclarations =
    summaryData?.constraints?.enrollmentConfirmationRequired ||
    Boolean(summaryData?.constraints?.customDisclaimerBeforeSubmission?.trim());

  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData,
  );
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");

  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", userDetails?.id],
    url: userDetails?.id ? endPoints.employeeDetails : "",
    enabled: Boolean(userDetails?.id),
  });

  // Payroll installments are derived from dates, not read from the policy
  // constraints: the inclusive month span from the employee's effective date to
  // this policy's end date, falling back to the policy start date when the
  // company has not configured an effective date.
  const payrollInstallments = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const additionalDetails =
      payload?.data?.additionalDetails ??
      payload?.data?.data?.additionalDetails;
    const effectiveDate =
      additionalDetails?.["Effective Date"]
    const policyId = summaryData?.policyId;
    const policy = [
      ...(policiesData?.employeePolicies ?? []),
      ...(policiesData?.enrolledPolicies ?? []),
    ].find((p: any) => String(p?.policyId) === String(policyId));

    return getPayrollInstallments(
      effectiveDate ?? policy?.startDate,
      policy?.dueDate,
      // Dates come from the policies list; the configured cap comes from the
      // summary's own constraints — the policies list carries no `configuration`.
      summaryData?.constraints?.payrollInstallments,
    );
  }, [
    employeeDetailsResponse,
    policiesData,
    summaryData?.policyId,
    summaryData?.constraints?.payrollInstallments,
  ]);

  // Dynamic declaration data based on API response
  const dynamicDeclarationData = useMemo(() => {
    const points: { content: string; isMandatory: boolean }[] = [];
    const enrollmentConfirmationRequired = Boolean(
      summaryData?.constraints?.enrollmentConfirmationRequired,
    );

    // Add payroll installments as first disclaimer
    if (payrollInstallments > 1) {
      points.push({
        content: `Your contribution will be deducted in ${payrollInstallments} equal instalments from your monthly salary`,
        isMandatory: true,
      });
    }

    // Custom disclaimer: mandatory only when enrollment confirmation is required,
    // otherwise optional.
    const customDisclaimer =
      summaryData?.constraints?.customDisclaimerBeforeSubmission?.trim();
    if (customDisclaimer) {
      points.push({
        content: customDisclaimer,
        isMandatory: enrollmentConfirmationRequired,
      });
    }

    return {
      title: DECLARATION_DATA.title,
      points,
    };
  }, [summaryData?.constraints?.customDisclaimerBeforeSubmission, payrollInstallments, summaryData?.constraints?.enrollmentConfirmationRequired]);

  const [checkedDeclarations, setCheckedDeclarations] = useState<boolean[]>([]);

  const handleDeclarationChange = (index: number) => {
    const updatedCheckedDeclarations = [...checkedDeclarations];
    updatedCheckedDeclarations[index] = !updatedCheckedDeclarations[index];
    setCheckedDeclarations(updatedCheckedDeclarations);
  };

  const areAllDeclarationsChecked = dynamicDeclarationData.points.every(
    (point, index) => !point.isMandatory || checkedDeclarations[index]
  );

  // Update checkedDeclarations when summaryData changes
  useEffect(() => {
    setCheckedDeclarations(
      dynamicDeclarationData.points.map(
        () => isViewOnly || showDeclarations === false
      )
    );
  }, [
    dynamicDeclarationData,
    isViewOnlyFromEnrolled,
    summaryData,
    showDeclarations,
  ]);

  useEffect(() => {
    const { plans, enrollmentInfo } = generatePolicySummaryFromConfig(
      policyConfigurationData,
      summaryData?.dependents || [],
      localizationData?.data
    );
    setPlans(plans);
    setEnrollmentInfo(enrollmentInfo);
  }, [policyConfigurationData, summaryData?.dependents, localizationData]);

  return (
    <ViewSummaryContainer>
      {isLoading ? (
        <CommonLoader />
      ) : (
        <Container data-testid="enrollment-summary-container">
          <MainContainer>
            <BannerContainer>
              <HeaderTypography>{VIEW_ENROLLMENT_SUMMARY}</HeaderTypography>
              <BannerBox data-testid="enrollment-summary-banner-box">
                <BannerBackGround
                  src={DownBackGround}
                  alt="Banner Background"
                />
                <BannerMainBackground
                  src={MainBackGroundImg}
                  alt="Main Background"
                />
                <CommonBannerContainer>
                  <BannerContainerDetails>
                    <BannerTypography data-testid="banner-container-details">
                      {enrollmentInfo?.policyConsumers?.map(
                        (consumer, index) => (
                          <span key={index}>
                            {consumer.info}
                            {index < enrollmentInfo?.policyConsumers.length - 1
                              ? " + "
                              : " "}
                          </span>
                        )
                      )}
                      {!isViewOnly && (
                        <StyledSpan
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onBack();
                          }}
                        >
                          {EDIT}
                        </StyledSpan>
                      )}
                    </BannerTypography>
                    <BannerTypography>{MEMBERS_SELECTED}</BannerTypography>
                  </BannerContainerDetails>
                  <VerticalDivider />
                </CommonBannerContainer>
                <SubBannerWrapper>
                  <SubBannerContainer>
                    <BannerNumberTypography>
                      {enrollmentInfo?.premium}
                    </BannerNumberTypography>
                    <BannerTypography>{PREMIUM}</BannerTypography>
                  </SubBannerContainer>
                  {enrollmentInfo?.showCompanyContribution === true && (
                    <SubBannerContainer>
                      <BannerNumberTypography>
                        {enrollmentInfo?.companyContribution}
                      </BannerNumberTypography>
                      <BannerTypography>
                        {COMPANY_CONTRIBUTION}
                      </BannerTypography>
                    </SubBannerContainer>
                  )}
                  <SubBannerContainer>
                    <BannerNumberTypography>
                      {enrollmentInfo?.yourContribution}
                    </BannerNumberTypography>
                    <BannerTypography>{YOUR_CONTRIBUTION}</BannerTypography>
                  </SubBannerContainer>
                </SubBannerWrapper>
              </BannerBox>
            </BannerContainer>
            {/* <SummaryPlans> 
              {summaryPlans.map((plan) => {})}
            </SummaryPlans> */}
            <Box data-testid="your-selected-plans-box">
              {/* <HeaderTypography>{YOUR_SELECTED_PLANS}</HeaderTypography> */}
              <CommonSummaryContainer data-testid="common-summary-container">
                {plans?.map((plan, index) => (
                  <>
                    <SummaryHeading>
                      {plan.id === "basePlan"
                        ? "Employee Coverage"
                        : "Parent Coverage"}
                    </SummaryHeading>
                    <SubSummaryContainer data-testid="sub-summary-container">
                      {plan?.selectedPlans?.map(
                        (selectedPlan: any, idx: number) => (
                          <>
                            <Holder
                              key={`${index}-${idx}`}
                              data-testid="plan-holder"
                            >
                              <PlanTypography data-testid="selected-plan-name">
                                {selectedPlan?.name}
                              </PlanTypography>
                              <ValueHolder>
                                <CommonHolder data-testid="common-holder">
                                  <CommonNumberTypography>
                                    {selectedPlan?.sumInsured}
                                  </CommonNumberTypography>
                                  <CommonLabelTypography>
                                    {SUM_INSURED}
                                  </CommonLabelTypography>
                                </CommonHolder>
                                <CommonHolder data-testid="common-holder">
                                  <CommonNumberTypography>
                                    {selectedPlan?.premium}
                                  </CommonNumberTypography>
                                  <CommonLabelTypography>
                                    {selectedPlan?.premiumPerLife
                                      ? PREMIUM_PER_LIFE
                                      : PREMIUM_PER_FAMILY}
                                  </CommonLabelTypography>
                                </CommonHolder>
                                {
                                  <CommonHolder data-testid="common-holder">
                                    {selectedPlan?.showCompanyContribution ===
                                    true ? (
                                      <>
                                        <CommonNumberTypography>
                                          {selectedPlan?.companyContribution}
                                        </CommonNumberTypography>
                                        <CommonLabelTypography>
                                          {COMPANY_PAYS}
                                        </CommonLabelTypography>
                                      </>
                                    ) : null}
                                  </CommonHolder>
                                }
                                <CommonHolder data-testid="common-holder">
                                  <CommonNumberTypography>
                                    {selectedPlan?.yourContribution}
                                  </CommonNumberTypography>
                                  <CommonLabelTypography>
                                    {YOUR_CONTRIBUTION}
                                  </CommonLabelTypography>
                                </CommonHolder>
                              </ValueHolder>
                            </Holder>
                            <HoriZontalDivider />
                          </>
                        )
                      )}
                      <MembersContainer data-testid="members-container">
                        {plan?.membersCovered?.length > 0 && (
                          <SubMembersContainer>
                            <img
                              src={ColoredShiledIcon}
                              alt="Shield Icon"
                              width={16}
                              height={20}
                            />
                            <CommonLabelTypography>
                              {MEMBERS_COVERED}
                            </CommonLabelTypography>
                          </SubMembersContainer>
                        )}
                        <ChipsContainer>
                          {plan?.membersCovered
                            ?.sort((a: any, b: any) => {
                              // Sort "Self" first, then maintain original order for others
                              if (a.relation === "Self") return -1;
                              if (b.relation === "Self") return 1;
                              return 0;
                            })
                            ?.map((member: any) => (
                              <CommonChip
                                key={member.id || member.relation}
                                label={capitalizeFirst(member.relation)}
                                variant="outlined"
                                data-testid="member-chip"
                              />
                            ))}
                        </ChipsContainer>
                      </MembersContainer>
                    </SubSummaryContainer>
                  </>
                ))}
              </CommonSummaryContainer>
            </Box>
          </MainContainer>
          {/* declaration section */}
          {showDeclarations && (
            <DeclarationSection>
              <DeclarationTitle>
                {dynamicDeclarationData.title}
              </DeclarationTitle>
              <DeclarationContent>
                {dynamicDeclarationData.points.map((point, index) => (
                  <DeclarationPoint key={index}>
                    <DeclarationCheckbox
                      type="checkbox"
                      checked={checkedDeclarations[index]}
                      onChange={() => handleDeclarationChange(index)}
                      disabled={isViewOnlyFromEnrolled}
                    />
                    <DeclarationPointLabel>
                      {withBoldInstallments(point.content)}
                    </DeclarationPointLabel>
                  </DeclarationPoint>
                ))}
              </DeclarationContent>
            </DeclarationSection>
          )}
          <ButtonContainer>
            {!isViewOnly && (
              <CommonButton
                variant="outlined"
                buttonType="primary"
                label={CANCEL}
                onClick={onCancel}
              />
            )}
            <CommonButton
              variant="outlined"
              buttonType="primary"
              label={BACK}
              onClick={onBack}
            />
            {!isViewOnly && (
              <>
                {/* <CommonButton
                  variant="contained"
                  buttonType="secondary"
                  label={SAVE}
                  onClick={() => handleSave("save")}
                  loading={loading}
                  disabled={loading}
                /> */}
                <CommonButton
                  variant="contained"
                  buttonType="secondary"
                  label={CONFIRM_ENROLLMENT}
                  width={"180px"}
                  onClick={() => handleSave("submit")}
                  loading={loading}
                  disabled={
                    loading || !areAllDeclarationsChecked
                   
                  }
                />
              </>
            )}
          </ButtonContainer>
        </Container>
      )}
    </ViewSummaryContainer>
  );
};

export default EnrollmentSummary;
