import React from "react";
import { useNavigate } from "react-router-dom";
import CommonButton from "../../../../common/Button";
import { CONFIRMATION_ENROLLMENT_MODAL_MESSAGE, } from "../../../../constants";
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
  MetaInfo,
  RefId,
} from "./styles";
import ConfirmationIcon from "../../../../../assets/svgs/confirmationpage-border-image.svg";
import ConfirmationBannerImage from "../../../../../assets/svgs/confirmation-page-banner-image.svg";

type ConfirmationPageProps = {
  referenceNumber?: string | null;
  submissionCount?: number | string | null;
};

const ConfirmationPage = ({
  referenceNumber,
  submissionCount,
}: ConfirmationPageProps) => {
  const navigate = useNavigate();
  const hasSubmissionCount =
    submissionCount !== null && submissionCount !== undefined;
  const hasReferenceNumber = Boolean(referenceNumber);
  
  return (
    <Container>
      <ModalContainer>
        <BlueHeader>
          <CloseButton onClick={() => navigate("/dashboard")}>
            ×
          </CloseButton>
          <HeaderImage src={ConfirmationBannerImage} alt="Confirmation Banner" />
        </BlueHeader>
        <ModalContent>
          <ContentWrapper>
            <ConfirmationPageIcon src={ConfirmationIcon} alt="Confirmation Icon" />
            <Title>{CONFIRMATION_ENROLLMENT_MODAL_MESSAGE.TITLE}</Title>
            {(hasReferenceNumber || hasSubmissionCount) && (
              <MetaInfo>
                {hasReferenceNumber ? <>Ref Id: <RefId>{referenceNumber}</RefId></> : null}
                {hasSubmissionCount ? (
                  <>
                    <br />
                    Submission <RefId>#{submissionCount}</RefId>
                  </>
                ) : null}
              </MetaInfo>
            )}
            <Description>
              {CONFIRMATION_ENROLLMENT_MODAL_MESSAGE.DESCRIPTION}
            </Description>
            <ButtonWrapper>
              <CommonButton
                label={CONFIRMATION_ENROLLMENT_MODAL_MESSAGE.BUTTON_TEXT}
                variant="gradient-outlined"
                buttonType="primary"
                onClick={() => navigate("/dashboard")}
              />
            </ButtonWrapper>
          </ContentWrapper>
        </ModalContent>
      </ModalContainer>
    </Container>
  );
};

export default ConfirmationPage;
