import React from "react";
import NavigateNextIcon from "../../../assets/svgs/navigateNextIcon.svg";
import {
  CommonBreadcrumb,
  Step,
  ChipRenderer,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
} from "@ui/ui-lib";
import OpportunityProgressHeader from "../../../components/OpportunityProgressStepper/OpportunityProgessHeader";
import { OpportunityHeaderDetails } from "../../../components/OpportunityProgressStepper/opportunityCardTypes";
import { StyledNextButton } from "../../OpportunitiesPage/OpportunitiesForm/styles";
import {
  ButtonContainer,
  PolicyStepperCompanyName,
  CompanyNameLabelStyles,
  CompanyNameTypography,
  PolicyProgressStepperContainer,
  ContainerForStepper,
  ContentWrapper,
  NextIcon,
  PolicycrmLeadStyleMap,
  PolicyName,
  PolicyPrimarySection,
  StepItem,
  StepsContainer,
  PolicyStepperWrapper,
} from "./styles";
import { Typography, Stack } from "@mui/material";
import path from "path";
interface PolicyProgressStepperProps {
  steps: Step[];
  activeStep: number;
  onStepChange?: (index: number) => void;
  data: any;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

const PolicyProgressStepper: React.FC<PolicyProgressStepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  data,
  showEditButton = false,
  onEditClick,
}) => {
  const progress = Math.floor(((activeStep + 1) / steps.length) * 100);
  const breadcrumbs = [
    { label: "Policies", path: "/policies" },
    { label: "Policy Details", path: `/policies/${data?.policyId}` },
    { label: "Policy Configure" },
  ];

  const headerDetails: OpportunityHeaderDetails = {
    companyName: data?.companyName,
    priority: data?.policyName,
    crmLead: data?.accountMangager,
  };
  const handleBreadcrumbClick = (index: number) => {
    onStepChange?.(index);
  };

  return (
    <PolicyProgressStepperContainer data-testid="policy-details-container">
      <ButtonContainer data-testid="policy-details-container-breadcrumbs">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <CommonBreadcrumb crumbs={breadcrumbs} />
          {showEditButton && onEditClick && (
            <StyledNextButton
              variantType={BUTTON_VARIANTS.SECONDARY}
              onClick={onEditClick}
              data-testid="edit-live-configuration-button"
            >
              Edit Configuration
            </StyledNextButton>
          )}
        </Stack>
      </ButtonContainer>
      <PolicyStepperWrapper data-testid="policy-details-container-summary-card">
        <ContainerForStepper data-testid="policy-details-container-header">
          <PolicyPrimarySection>
            <PolicyName>{data?.policyName || "Policy Name"}</PolicyName>

            <PolicyStepperCompanyName>
              <CompanyNameTypography>{"Company"} </CompanyNameTypography>
              <CompanyNameLabelStyles>
                {data?.companyName}
              </CompanyNameLabelStyles>
            </PolicyStepperCompanyName>
          </PolicyPrimarySection>
        </ContainerForStepper>
        <ContentWrapper data-testid="policy-details-container-steps">
          {/* <Breadcrumbs
            crumbs={steps.map((step) => ({ title: step.label }))}
            flag={activeStep}
            setBreadCumbStep={handleBreadcrumbClick}
          /> */}
          <StepsContainer>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index !== 0 && <NextIcon src={NavigateNextIcon} alt="next" />}
                <StepItem
                  active={index === activeStep}
                  completed={index < activeStep}
                  onClick={() => handleBreadcrumbClick(index)}
                  data-testid={`step-${index}`}
                >
                  {/* <StepIcon
                    src={index < activeStep ? DoneIcon : UpcommingIcon}
                    alt={index < activeStep ? 'done' : 'upcoming'}
                  /> */}
                  {step.label}
                </StepItem>
              </React.Fragment>
            ))}
          </StepsContainer>
        </ContentWrapper>
      </PolicyStepperWrapper>
    </PolicyProgressStepperContainer>
  );
};

export default PolicyProgressStepper;
