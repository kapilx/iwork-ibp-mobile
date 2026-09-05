import React, { useState, useRef } from "react";
import { CircularProgress } from "@mui/material";
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
  AlternateAuthLink,
  TitleSpan,
  OtpInputContainer,
  OtpInput,
} from "./styles";
import VerifyIdentityImage from "../../../../../assets/svgs/verify-identity-icon.svg";
import {
  CancelButton,
  FormButtonsContainer,
  SubmitButton,
} from "../../../../common/SupportFormSection/styles";
import { VERIFY_IDENTITY } from "../../../../constants";
import { maskMobileNumber, maskEmail } from "@ui/ui-lib";

export interface VerifyLoginOtpPageProps {
  onVerify: (otp: string) => void;
  onBack: () => void;
  onClose: () => void;
  onResendOtp?: () => void;
  method?: "mobile" | "email" | "both" | null;
  mobileNumber?: string;
  email?: string;
  loading?: boolean;
  isResendingOtp?: boolean;
  isResendDisabled?: boolean;
  resendCountdown?: number;
}

const VerifyLoginOtpPage: React.FC<VerifyLoginOtpPageProps> = ({
  onVerify,
  onBack,
  onClose,
  onResendOtp,
  method = "mobile",
  mobileNumber,
  email,
  loading = false,
  isResendingOtp = false,
  isResendDisabled = false,
  resendCountdown = 0,
}) => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Extracted recipient string for OTP
  let otpRecipient: string;
  if (method === "email") {
    otpRecipient = maskEmail(email || "");
  } else if (method === "both") {
    otpRecipient = `${maskMobileNumber(mobileNumber || "")} and ${maskEmail(
      email || "",
    )}`;
  } else {
    otpRecipient = maskMobileNumber(mobileNumber || "");
  }

  const isResendBlocked = isResendingOtp || isResendDisabled;

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      onVerify(otp.join(""));
    }
  };

  return (
    <Container
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      style={{ outline: "none" }}
    >
      <ModalContainer>
        <BlueHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <Title>{VERIFY_IDENTITY.TITLE}</Title>
          <HeaderImage src={VerifyIdentityImage} alt="Verify Identity" />
        </BlueHeader>
        <ModalContent>
          <ContentWrapper>
            <Description>
              We've sent a 6-digit OTP to <TitleSpan> {otpRecipient}</TitleSpan>
            </Description>

            <OtpInputContainer>
              {otp.map((digit, index) => (
                <OtpInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  autoFocus={index === 0}
                />
              ))}
            </OtpInputContainer>

            <AlternateAuthLink
              onClick={isResendBlocked ? undefined : onResendOtp}
              style={{
                cursor: isResendBlocked ? "not-allowed" : "pointer",
                opacity: isResendBlocked ? 0.6 : 1,
              }}
            >
              <TitleSpan>{VERIFY_IDENTITY.DIDNT_RECEIVE_OTP} </TitleSpan>
              {isResendingOtp
                ? "Sending..."
                : isResendDisabled
                ? `Resend OTP in ${resendCountdown}s`
                : VERIFY_IDENTITY.RESEND_OTP}
            </AlternateAuthLink>
            <FormButtonsContainer>
              <CancelButton variant="outlined" onClick={onBack} disabled={loading}>
                {VERIFY_IDENTITY.BACK}
              </CancelButton>
              <SubmitButton
                variant="contained"
                onClick={() => onVerify(otp.join(""))}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : VERIFY_IDENTITY.VERIFY_OTP}
              </SubmitButton>
            </FormButtonsContainer>
          </ContentWrapper>
        </ModalContent>
      </ModalContainer>
    </Container>
  );
};

export default VerifyLoginOtpPage;
