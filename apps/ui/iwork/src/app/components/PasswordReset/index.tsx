import {
  DynamicForm,
  ToastMessage,
  endPoints,
  useApi,
  useApiQuery,
  useCaptcha,
  CaptchaComponent,
  environment,
} from "@ui/ui-lib";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  GuidelinesContainer,
  GuidelinesHeading,
  GuidelineRow,
  GuidelineIcon,
  GuidelineText,
  CaptchaContainer,
} from "./styles";
import { PasswordResetFormData } from "./types";
import IIRM_LOGO from "../../assets/svgs/iirm-logo.svg"; // Logo import
import {
  initialPasswordResetData,
  PASSWORD_RESET_FORM_CONFIG,
} from "./formConfig";
import LoginBanner from "../LoginBanner";
import CircularCheckBox from "../../assets/svgs/circular-check-box.svg";
import AccordionSelected from "../../assets/svgs/accordion-selected.svg";
import { PASSWORD_GUIDELINES } from "@ui/ui-lib";
import { CREATE_A_PASSWORD_THAT } from "../../constants";

const PasswordReset: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  const captcha = useCaptcha();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { doFetch, data, error } = useApi();

  const { error: validationError } = useApiQuery({
    url: endPoints.validateResetToken(token),
    queryKey: token ? ["validate", token] : null,
    enabled: Boolean(token),
    config: { onError: () => setErrorMessage("Invalid or expired link") },
  });
  useEffect(() => {
    if (validationError) {
      setErrorMessage(validationError.message);
    }
  }, [validationError]);
  const onSubmit: SubmitHandler<PasswordResetFormData> = async (form) => {
    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    // Skip CAPTCHA check if environment variable is set
    if (environment.enableCaptcha && !captcha.isCaptchaValid()) {
      setToastMessage("Please complete the CAPTCHA verification");
      return;
    }

    const payload: any = { token, password: form.newPassword };
    
    // Only add captchaToken if not skipping captcha
    if (environment.enableCaptcha && captcha.captchaToken) {
      payload.captchaToken = captcha.captchaToken;
    }

    doFetch(endPoints.resetPassword, {
      method: "POST",
      data: payload,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    if (data && data.message === "Invalid or expired token") {
      setToastMessage(data.message);
      // Reset CAPTCHA state
      captcha.resetCaptcha();
      // navigate("/login");
    }
    if (data && data.message === "Password updated successfully") {
      setToastMessage(data.message);
      navigate("/login");
    }
    if (error) {
      setToastMessage(error?.message);
      // Reset CAPTCHA state
      captcha.resetCaptcha();
      // navigate("/login");
    }
  }, [data, error, navigate]);

  useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((values) => {
        setPasswordValue(values.newPassword || "");
        setConfirmPasswordValue(values.confirmPassword || "");
      });
      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  const allGuidelinesPassed = PASSWORD_GUIDELINES.every((rule) =>
    rule.test(passwordValue),
  );
  const canSubmit =
    allGuidelinesPassed &&
    passwordValue.length > 0 &&
    confirmPasswordValue.length > 0 &&
    passwordValue === confirmPasswordValue &&
  (environment.enableCaptcha === true ? captcha.isCaptchaVerified : true);

  return (
    <>
      <BrandRibbon>Empowering Insurance Excellence | India Insure</BrandRibbon>
      <PasswordResetStyledContainer>
        <LoginBanner />
        <LoginContainer
          tabIndex={0}
          data-testid="login-container"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (environment.enableCaptcha || captcha.isCaptchaVerified)) {
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
              Create strong password to secure your account
            </SubtitleContainer>
          </HeadingContainer>
          {errorMessage && (
            <>
              <StyledAlert>{errorMessage}</StyledAlert>
              <PasswordResetStyledButton
                variantType="primary"
                onClick={() => navigate("/request-password-reset")}
                sx={{ marginTop: "16px", width: "48%" }}
              >
                Request Reset Password
              </PasswordResetStyledButton>
            </>
          )}

          {!errorMessage && (
            <>
              <DynamicForm
                formConfig={PASSWORD_RESET_FORM_CONFIG}
                defaultValues={initialPasswordResetData}
                formMethods={setFormMethods}
                sx={{
                  maxWidth: "372px",
                }}
              />

              {environment.enableCaptcha && (
                <CaptchaContainer
                  sx={{
                    minHeight: captcha.isCaptchaVerified ? 0 : "65px",
                    marginTop: captcha.isCaptchaVerified ? 0 : "25px",
                    opacity: captcha.isCaptchaVerified ? 0 : 1,
                    height: captcha.isCaptchaVerified ? 0 : "auto",
                    overflow: "hidden",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <CaptchaComponent
                    captchaKey={captcha.captchaKey}
                    captchaRef={captcha.captchaRef}
                    onVerify={captcha.handleCaptchaVerify}
                  />
                </CaptchaContainer>
              )}

              <GuidelinesContainer>
                <GuidelinesHeading>{CREATE_A_PASSWORD_THAT}</GuidelinesHeading>
                {PASSWORD_GUIDELINES.map((rule, idx) => {
                  const passed = rule.test(passwordValue);
                  return (
                    <GuidelineRow key={idx}>
                      <GuidelineIcon
                        src={passed ? AccordionSelected : CircularCheckBox}
                        alt={passed ? "Passed" : "Not passed"}
                      />
                      <GuidelineText passed={passed}>{rule.label}</GuidelineText>
                    </GuidelineRow>
                  );
                })}
              </GuidelinesContainer>
              <ButtomContainer>
                <PasswordResetStyledButton
                  variantType="secondary"
                  disabled={!canSubmit}
                  onClick={
                    formMethods ? formMethods.handleSubmit(onSubmit) : undefined
                  }
                >
                  Submit
                </PasswordResetStyledButton>
              </ButtomContainer>
            </>
          )}

          {toastMessage && (
            <ToastMessage
              vertical="top"
              horizontal="center"
              message={toastMessage}
              open={Boolean(toastMessage)}
              onClose={() => setToastMessage(null)}
              autoHideDuration={4000}
            />
          )}
        </LoginContainer>
      </PasswordResetStyledContainer>
    </>
  );
};

export default PasswordReset;
