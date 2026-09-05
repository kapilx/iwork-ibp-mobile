import React from "react";
import {
  ButtonContainer,
  LifeEventsTitleCard,
  SimpleSuccessBanner,
  SimpleSuccessBannerImage,
  SimpleSuccessButton,
  SimpleSuccessContainer,
  SimpleSuccessSubtitle,
  SimpleSuccessTitle,
} from "./styles";
import ConfirmationBannerImage from "../../../assets/svgs/confirmation-page-banner-image.svg";

type FlowType = "addition" | "deletion";

export interface LifeEventsSubmissionMeta {
  requestId?: string | null;
  submittedAt?: string | null;
  reasonTitle?: string | null;
  newAnnualPremium?: number | null;
}

interface LifeEventsSuccessPageProps {
  flowType: FlowType;
  submissionMeta?: LifeEventsSubmissionMeta | null;
  onReturnHome: () => void;
}

const getSubtitle = (flowType: FlowType) =>
  flowType === "addition"
    ? "Your dependent addition request has been submitted for approval"
    : "Your dependent removal request has been submitted for approval";

const LifeEventsSuccessPage: React.FC<LifeEventsSuccessPageProps> = ({
  flowType,
  submissionMeta: _submissionMeta,
  onReturnHome,
}) => {
  return (
    <SimpleSuccessContainer>
      <SimpleSuccessBanner>
        <SimpleSuccessBannerImage
          src={ConfirmationBannerImage}
          alt="Success banner"
        />
      </SimpleSuccessBanner>

      <LifeEventsTitleCard>
        <SimpleSuccessTitle variant="h6">
          Request Submitted Successfully!
        </SimpleSuccessTitle>
        <SimpleSuccessSubtitle>{getSubtitle(flowType)}</SimpleSuccessSubtitle>
        <ButtonContainer>
          <SimpleSuccessButton onClick={onReturnHome} variant="outlined">
            Back to Life Event Management
          </SimpleSuccessButton>
        </ButtonContainer>
      </LifeEventsTitleCard>
    </SimpleSuccessContainer>
  );
};

export default LifeEventsSuccessPage;
