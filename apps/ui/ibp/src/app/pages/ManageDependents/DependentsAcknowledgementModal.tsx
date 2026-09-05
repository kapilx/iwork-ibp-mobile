import { useNavigate } from "react-router-dom";
import CommonButton from "../../common/Button";
import {
  Container,
  ModalContainer,
  ModalContent,
  BlueHeader,
  ContentWrapper,
  Title,
  Description,
  ButtonWrapper,
  CloseButton,
  ConfirmationPageIcon,
  HeaderImage,
} from "../../components/MultiEnrollment/VerifyIdentityFlow/ConfirmationPage/styles";
import ConfirmationIcon from "../../../assets/svgs/confirmationpage-border-image.svg";
import ConfirmationBannerImage from "../../../assets/svgs/confirmation-page-banner-image.svg";

// Acknowledgement modal shown after submitting the Manage Dependents page.
// Kept separate from the enrollment ConfirmationPage so the two evolve
// independently; only the shared visual styles/assets are reused.
type DependentsAcknowledgementModalProps = {
  onClose?: () => void;
};

const DependentsAcknowledgementModal = ({
  onClose,
}: DependentsAcknowledgementModalProps) => {
  const navigate = useNavigate();
  const close = onClose ?? (() => navigate("/"));

  return (
    <Container>
      <ModalContainer>
        <BlueHeader>
          <CloseButton onClick={close}>×</CloseButton>
          <HeaderImage src={ConfirmationBannerImage} alt="Confirmation Banner" />
        </BlueHeader>
        <ModalContent>
          <ContentWrapper>
            <ConfirmationPageIcon src={ConfirmationIcon} alt="Confirmation Icon" />
            <Title>Enrolment Submitted Successfully</Title>
            <Description>
              Thank you for completing your enrolment. We are pleased to confirm that your insurance enrolment has been successfully submitted.
            </Description>
            <ButtonWrapper>
              <CommonButton
                label="Go back to Dashboard"
                variant="gradient-outlined"
                buttonType="primary"
                onClick={close}
              />
            </ButtonWrapper>
          </ContentWrapper>
        </ModalContent>
      </ModalContainer>
    </Container>
  );
};

export default DependentsAcknowledgementModal;
