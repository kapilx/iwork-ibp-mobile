import { DynamicForm, ToastMessage, endPoints, useApi } from "@ui/ui-lib";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  StyledAlert,
  PasswordResetStyledButton,
  PasswordResetStyledContainer,
  LoginContainer,
  TitleContainer,
  LogoContainer,
  Logo,
  ButtomContainer,
  BrandRibbon,
  SubtitleContainer,
  HeadingContainer,
} from "../PasswordReset/styles";
import IIRM_LOGO from "../../assets/svgs/iirm-logo.svg";
import { initialResetMailData, RESET_MAIL_FORM_CONFIG } from "./formConfig";
import { ResetMailFormData } from "./types";
import LoginBanner from "../LoginBanner";

const PasswordResetMail: React.FC = () => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState<string>("Send");

  const { doFetch, data, error, loading } = useApi();

  const onSubmit: SubmitHandler<ResetMailFormData> = async (form) => {
    doFetch(endPoints.sendResetMailByEmail(form.email), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  };

  useEffect(() => {
    if (data) {
      setToastMessage(
        data.message ||
          "If this account exists, a password reset link has been sent to your registered email.",
      );
      setButtonText("Resend");
    }
    if (error) {
      setErrorMessage(error.message);
    }
  }, [data, error]);

  return (
    <>
      <BrandRibbon>Empowering Insurance Excellence | India Insure</BrandRibbon>
      <PasswordResetStyledContainer>
        <LoginBanner />
        <LoginContainer
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              e.preventDefault();
              if (formMethods) {
                formMethods.handleSubmit(onSubmit)();
              }
            }
          }}
        >
          <LogoContainer>
            <Logo src={IIRM_LOGO} alt="IIRM Logo" />
          </LogoContainer>
          <HeadingContainer>
            <TitleContainer variant="h1">Reset Password</TitleContainer>
            <SubtitleContainer>
              Enter your email to receive a password reset link
            </SubtitleContainer>
          </HeadingContainer>
          {errorMessage && <StyledAlert>{errorMessage}</StyledAlert>}
          <DynamicForm
            formConfig={RESET_MAIL_FORM_CONFIG}
            defaultValues={initialResetMailData}
            formMethods={setFormMethods}
            sx={{ maxWidth: "372px" }}
          />
          <ButtomContainer>
            <PasswordResetStyledButton
              variantType="secondary"
              loading={loading}
              disabled={loading}
              onClick={
                formMethods ? formMethods.handleSubmit(onSubmit) : undefined
              }
            >
              {buttonText}
            </PasswordResetStyledButton>
          </ButtomContainer>
          {toastMessage && (
            <ToastMessage
              vertical="top"
              horizontal="center"
              message={toastMessage}
              open={Boolean(toastMessage)}
              onClose={() => setToastMessage(null)}
              autoHideDuration={4000}
              variant="success"
            />
          )}
        </LoginContainer>
      </PasswordResetStyledContainer>
    </>
  );
};

export default PasswordResetMail;
