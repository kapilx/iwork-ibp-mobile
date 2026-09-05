import { policyTypeKeys } from "../../../components/WelllnessBenefitSection/constants";
import {
  DiagnosisHeading,
  DiagnosisSubHeading,
  StyledDiagnosisContainer,
} from "./styles";

type DiagnosisClaimStepProps = {
  policyTypeKey?: string;
};

export const DiagnosisClaimStep = ({
  policyTypeKey,
}: DiagnosisClaimStepProps) => {
  const isGpaPolicy = policyTypeKey === policyTypeKeys.GPA;

  return (
    <StyledDiagnosisContainer>
      <DiagnosisHeading>
        {isGpaPolicy ? "Accident & Claim Details" : "Diagnosis & Claim Details"}
      </DiagnosisHeading>
      <DiagnosisSubHeading>
        {isGpaPolicy
          ? "Provide accident details for the claim"
          : "Provide medical diagnosis and estimated claim amount"}
      </DiagnosisSubHeading>
    </StyledDiagnosisContainer>
  );
};
