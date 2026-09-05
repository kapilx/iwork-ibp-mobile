import React from "react";
import {
  Container,
  ModalContainer,
  BlueHeader,
  HeaderImage,
  CloseButton,
  ModalContent,
  ContentWrapper,
  Title,
  Description,
  OptionsContainer,
  AlternateAuthLink,
} from "./styles";
import VerifyIdentityImage from "../../../../../assets/svgs/verify-identity-icon.svg";
import EmailIcon from "../../../../../assets/svgs/email-support-icon.svg";
import CallIcon from "../../../../../assets/svgs/call-support-icon.svg";
import BothIcon from "../../../../../assets/svgs/verify-identity-both-image.svg";
import OptionCard from "../../../../common/OptionCard";
import { VERIFY_IDENTITY, getVerificationOptions } from "../../../../constants";
import { maskEmail, maskMobileNumber } from "@ui/ui-lib";

export interface VerifyLoginPageProps {
  mobileNumber?: string;
  email?: string;
  onClose: () => void;
  onSelectMethod: (method: "mobile" | "email") => void;
  onAlternateAuth?: () => void;
  isSendingOtp?: boolean;
  allowedMethods?: Array<"mobile" | "email">;
}

const VerifyLoginPage: React.FC<VerifyLoginPageProps> = ({
  mobileNumber,
  email,
  onClose,
  onSelectMethod,
  onAlternateAuth,
  isSendingOtp = false,
  allowedMethods = ["mobile", "email"],
}) => {
  const userDetails = sessionStorage.getItem("user");
  const parsedUserDetails = userDetails ? JSON.parse(userDetails) : null;
  const mobile = maskMobileNumber(parsedUserDetails?.phone) || mobileNumber;
  const emailId = maskEmail(parsedUserDetails?.email) || email;
  const verificationOptions = getVerificationOptions({
    mobileNumber: mobile,
    email: emailId,
    CallIcon,
    EmailIcon,
    BothIcon,
  }).filter(
    (option) =>
      option.method !== "both" &&
      allowedMethods.includes(option.method as "mobile" | "email"),
  );
  console.log("verificationOptions",  getVerificationOptions({
    mobileNumber: mobile,
    email: emailId,
    CallIcon,
    EmailIcon,
    BothIcon,
  }));
  return (
    <Container>
      <ModalContainer>
        <BlueHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <Title>{VERIFY_IDENTITY.TITLE}</Title>
          <HeaderImage src={VerifyIdentityImage} alt="Verify Identity" />
        </BlueHeader>
        <ModalContent>
          <ContentWrapper>
            <Description>{VERIFY_IDENTITY.DESCRIPTION}</Description>
            <OptionsContainer
              sx={{
                justifyContent:
                  verificationOptions.length <= 2 ? "center" : "flex-start",
              }}
            >
              {verificationOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  title={option.title}
                  subtext={option.subtext}
                  backgroundColor={option.backgroundColor}
                  onClick={() => {
                    if (isSendingOtp) return;
                    if (option.method === "both") return;
                    onSelectMethod(option.method as "mobile" | "email");
                  }}
                />
              ))}
            </OptionsContainer>

            {isSendingOtp && (
              <Description>Sending OTP...</Description>
            )}
            {/* <AlternateAuthLink onClick={isSendingOtp ? undefined : onAlternateAuth}>
              {VERIFY_IDENTITY.ALTERNATE_AUTH}
            </AlternateAuthLink> */}
          </ContentWrapper>
        </ModalContent>
      </ModalContainer>
    </Container>
  );
};

export default VerifyLoginPage;
