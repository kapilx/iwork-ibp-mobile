import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import { useForm } from "react-hook-form";
import CommonButton from "../../common/Button";
import {
  apiRequest,
  ibpTheme as theme,
  endPoints,
  environment,
  REGEX_PATTERNS,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { AppDispatch } from "../../redux/store";
import store from "../../redux/store";
import { fetchTermsAndConditions } from "../../redux/tcSlice";
import { TOAST_MESSAGES, EMAIL_OTP_SCENARIOS } from "../../constants";
import axiosInstance from "@ui/ui-lib/utils/axiosInterceptors";
import { useNavigate } from "react-router-dom";
import {
  EMAIL_OTP_FORM_CONFIG,
  EMAIL_OTP_VERIFY_FORM_CONFIG,
  initialEmailOTPData,
  initialEmailOTPVerifyData,
} from "./formConfig";
import {
  MainContainer,
  ActionsContainer,
  ResendLink,
  ChangeEmailLink,
  ButtonContainer,
} from "./styles";
import { ButtonWrapper, OtpInput, OtpInputWrapper } from "../SignIn/styles";

interface CustomEmailOTPProps {
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  resendCooldownSeconds?: number;
  remainingResendCooldownSeconds?: number;
  initialEmail?: string;
  autoSendOnMount?: boolean;
  hideIdentifierEntry?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onOtpSent?: () => void; // New callback for when OTP is sent
}

const CustomEmailOTP: React.FC<CustomEmailOTPProps> = ({
  loading,
  setLoading,
  resendCooldownSeconds,
  remainingResendCooldownSeconds = 0,
  initialEmail,
  autoSendOnMount = false,
  hideIdentifierEntry = false,
  onBack,
  backLabel = "Change Email",
  onOtpSent,
}) => {
  const subdomain = window.location.hostname.split(".")[0];
  // If OTP was already sent (hideIdentifierEntry=true but autoSendOnMount=false means
  // we're within cooldown / OTP already sent), skip the loading screen and show input directly
  const alreadySentOtp = hideIdentifierEntry && !autoSendOnMount;
  const [email, setEmail] = useState(alreadySentOtp ? (initialEmail || "") : "");
  const [step, setStep] = useState<"email" | "otp">(alreadySentOtp ? "otp" : "email");
  const [otpSent, setOtpSent] = useState(alreadySentOtp);
  const [isResendDisabled, setIsResendDisabled] = useState(alreadySentOtp && remainingResendCooldownSeconds > 0);
  const [resendCountdown, setResendCountdown] = useState(alreadySentOtp ? remainingResendCooldownSeconds : 0);
  const [emailValue, setEmailValue] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // OTP verification states
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasOtpError, setHasOtpError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  // Guard against double-firing in React StrictMode / rapid re-mounts
  const hasSentOtpOnMountRef = useRef(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Form methods
  const [emailFormMethods, setEmailFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [otpFormMethods, setOtpFormMethods] =
    useState<ReturnType<typeof useForm>>();

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [resendCountdown]);

  const formatCountdown = (countdown: number) => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Watch for email changes and validation errors
  useEffect(() => {
    if (emailFormMethods) {
      const subscription = emailFormMethods.watch((value) => {
        setEmailValue(value.email || "");
      });
      return () => subscription.unsubscribe();
    }
  }, [emailFormMethods]);

  const trimmedEmailValue = emailValue?.trim() || "";
  const isEmailFormatValid = REGEX_PATTERNS.EMAIL.test(trimmedEmailValue);

  const handleSendOTP = async () => {
    if (isSendingOTP) return;

    let emailToSend: string;

    // If we have initialEmail (auto-send case), use it directly
    if (initialEmail && autoSendOnMount) {
      console.log(
        "handleSendOTP: Using initialEmail for auto-send:",
        initialEmail
      );
      emailToSend = initialEmail;

      // Validate the initial email format
      if (!REGEX_PATTERNS.EMAIL.test(initialEmail)) {
        dispatch(
          setToastMessage({
            message: "Please enter a valid email address",
            type: "error",
          })
        );
        return;
      }
    } else {
      // Manual send case - use form validation
      const isValid = await emailFormMethods?.trigger("email");

      // Check for validation errors
      if (!isValid || emailFormMethods?.formState.errors?.email) {
        dispatch(
          setToastMessage({
            message: "Please enter a valid email address",
            type: "error",
          })
        );
        return;
      }

      const emailValue = emailFormMethods?.getValues("email");
      if (!emailValue) {
        dispatch(
          setToastMessage({
            message: "Please enter a valid email address",
            type: "error",
          })
        );
        return;
      }
      emailToSend = emailValue;
    }

    setEmail(emailToSend); // Store for OTP verification
    setIsSendingOTP(true);
    setLoading?.(true);
    try {
      const response = await axiosInstance.post(
        `${environment.authUrl}/auth/email-otp/send`,
        {
          email: emailToSend,
          domain: subdomain,
          scenario: EMAIL_OTP_SCENARIOS.LOGIN,
        }
      );

      if (response.data?.statusCode === 200) {
        const cooldownSeconds = resendCooldownSeconds ?? 60;
        setStep("otp");
        setOtpSent(true);
        setIsResendDisabled(cooldownSeconds > 0);
        setResendCountdown(cooldownSeconds);

        // Notify parent component that OTP was sent
        onOtpSent?.();

        // Clear any error messages and show success message
        dispatch(setToastMessage(null));
        setTimeout(() => {
          dispatch(
            setToastMessage({
              message: "OTP sent to your email!",
              type: "success",
            })
          );
        }, 100);
      }
    } catch (error: any) {
      let errorMessage = "Failed to send OTP. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      dispatch(setToastMessage({ message: errorMessage, type: "error" }));
    } finally {
      setIsSendingOTP(false);
      setLoading?.(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setHasOtpError(true);
      dispatch(
        setToastMessage({
          message: "Please enter a valid 6-digit OTP",
          type: "error",
        })
      );
      return;
    }

    setHasOtpError(false);
    setIsVerifying(true);
    setLoading?.(true);

    try {
      // Verify OTP with backend
      const response = await axiosInstance.post(
        `${environment.authUrl}/auth/email-otp/verify`,
        { email, otp, domain: subdomain }
      );

      if (response.data?.statusCode === 200) {
        setIsOtpVerified(true);
        setHasOtpError(false);

        const { accessToken, refreshToken, user } = response.data.data;

        // Structure data to match simple auth format
        const authData = {
          accessToken: {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
          portal: "IBP",
          ...user,
        };

        // Store initial auth data
        sessionStorage.setItem("user", JSON.stringify(authData));

        const [, userDetailsResponse] = await Promise.all([
          environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT
            ? dispatch(fetchTermsAndConditions())
            : Promise.resolve(null),
          axiosInstance.get(endPoints.employeeDetails),
        ]);
        const combinedUser = {
          ...authData,
          ...userDetailsResponse.data?.data,
        };

        // Save combined user data and redirect
        sessionStorage.setItem("user", JSON.stringify(combinedUser));
        const loggedInUserId = combinedUser?.id || combinedUser?.userId;
        if (loggedInUserId) {
          await apiRequest(endPoints.getActivityLogs, {
            method: "POST",
            data: {
              activityKey: "LOGGED_IN",
              activityCategory: "AUTH",
              referenceId: loggedInUserId,
              referenceType: "USER",
              metadata: null,
            },
            headers: { userid: String(loggedInUserId) },
          });
        }
        dispatch(setToastMessage(TOAST_MESSAGES.LOGIN_SUCCESS));

        if (environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT) {
          const tcNotAccepted = !combinedUser?.isTCAccepted;
          const latestTcVersion = store.getState().tc.data?.version ?? null;
          const tcVersionMismatch =
            latestTcVersion !== null &&
            combinedUser?.tcAcceptedVersion !== latestTcVersion;
          if (tcNotAccepted || tcVersionMismatch) {
            sessionStorage.setItem("showLoginWelcomePopup", "true");
          }
        }

        // Delay navigation to show success state
        setTimeout(() => {
          if (combinedUser.roleKey === "PORTAL_CRM") {
            navigate("/hr-portal/portfolio");
          } else if (combinedUser.isHR && combinedUser.isEmployee && combinedUser.roleKey !== "EXTERNAL_HR") {
            navigate("/");
          } else if (combinedUser.isHR) {
            navigate("/hr-portal/portfolio");
          } else {
            navigate("/");
          }
        }, 1500);
      }
    } catch (error: any) {
      setHasOtpError(true);
      setIsOtpVerified(false);
      let errorMessage = "Invalid OTP. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      dispatch(setToastMessage({ message: errorMessage, type: "error" }));
    } finally {
      setIsVerifying(false);
      setLoading?.(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp("");
    setIsOtpVerified(false);
    setHasOtpError(false);
    setIsVerifying(false);
    await handleSendOTP();
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const nextDigit = value.replace(/[^0-9]/g, "").slice(-1);
    const nextOtp = otp.split("");
    nextOtp[index] = nextDigit;
    const normalizedOtp = Array.from(
      { length: 6 },
      (_, idx) => nextOtp[idx] || ""
    ).join("");
    setOtp(normalizedOtp);
    if (nextDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    if (normalizedOtp.length < 6) {
      setHasOtpError(false);
      setIsOtpVerified(false);
    }
  };

  const handleOtpDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (
      e.key === "Enter" &&
      otp.replace(/\s/g, "").length === 6 &&
      !isVerifying
    ) {
      e.preventDefault();
      handleVerifyOTP();
    }
  };

  const handleOtpDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedOtp = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (!pastedOtp) return;
    setOtp(pastedOtp);
    const focusIndex = Math.min(pastedOtp.length, 6) - 1;
    if (focusIndex >= 0) {
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleChangeEmail = () => {
    if (hideIdentifierEntry && onBack) {
      onBack();
      return;
    }
    setEmail("");
    setStep("email");
    setOtpSent(false);
    emailFormMethods?.reset();
    otpFormMethods?.reset();
  };

  useEffect(() => {
    dispatch(setToastMessage(null));

    if (!initialEmail) return;
    setEmail(initialEmail);
    setEmailValue(initialEmail);

    if (emailFormMethods) {
      emailFormMethods.reset({ email: initialEmail });
      emailFormMethods.clearErrors();
    }
  }, [initialEmail, emailFormMethods, dispatch]);

  useEffect(() => {
    if (!autoSendOnMount || !initialEmail || step !== "email" || isSendingOTP || hasSentOtpOnMountRef.current) {
      return;
    }

    hasSentOtpOnMountRef.current = true;
    void handleSendOTP();
  }, [autoSendOnMount, initialEmail, step, isSendingOTP]);

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !isSendingOTP &&
      !loading &&
      trimmedEmailValue &&
      !otpSent &&
      isEmailFormatValid
    ) {
      e.preventDefault();
      handleSendOTP();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6 && !isVerifying && !loading) {
      e.preventDefault();
      handleVerifyOTP();
    }
  };

  return (
    <MainContainer>
      {!hideIdentifierEntry && (
        <>
          <div onKeyDown={handleEmailKeyDown}>
            <DynamicForm
              formConfig={EMAIL_OTP_FORM_CONFIG}
              defaultValues={initialEmailOTPData}
              formMethods={setEmailFormMethods}
            />
          </div>
          <ButtonContainer>
            <ButtonWrapper
              variant="contained"
              buttonType="secondary"
              label={isSendingOTP ? "Sending..." : "Send OTP"}
              onClick={handleSendOTP}
              loading={isSendingOTP || loading}
              disabled={
                isSendingOTP ||
                loading ||
                !trimmedEmailValue ||
                otpSent ||
                !isEmailFormatValid
              }
              bgcolor={theme.palette.background.DarkBlue}
              color={theme.palette.background.paper}
            />
          </ButtonContainer>
        </>
      )}

      {hideIdentifierEntry && !(step === "otp" && otpSent) && (
        <Box
          sx={{
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Sending OTP...
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Please wait while we send an OTP to your registered email.
          </Typography>
          <Typography
            onClick={handleChangeEmail}
            sx={{
              mt: 2.5,
              textAlign: "center",
              color: "#3B82F6",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {backLabel}
          </Typography>
        </Box>
      )}

      {/* OTP field - appears below email field after Send OTP success */}
      {step === "otp" && otpSent && hideIdentifierEntry ? (
        <>
          <OtpInputWrapper sx={{ mb: 3.5, mt: "20px" }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <OtpInput
                key={index}
                ref={(element: HTMLInputElement | null) => {
                  otpInputRefs.current[index] = element;
                }}
                type="text"
                autoFocus={index === 0}
                maxLength={1}
                value={otp[index] || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleOtpDigitChange(index, e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  handleOtpDigitKeyDown(index, e)
                }
                onPaste={handleOtpDigitPaste}
                inputMode="numeric"
              />
            ))}
          </OtpInputWrapper>
          <ButtonContainer>
            <ButtonWrapper
              variant="contained"
              buttonType="secondary"
              label={isVerifying ? "Verifying..." : "Verify OTP"}
              onClick={handleVerifyOTP}
              loading={isVerifying}
              disabled={otp.length !== 6 || isVerifying || loading}
              bgcolor={theme.palette.background.DarkBlue}
              color={theme.palette.background.paper}
            />
          </ButtonContainer>
          <Box sx={{ textAlign: "center", mt: "20px" }}>
            <Typography
              component="span"
              sx={{ fontSize: 18, color: "#2B2B2B" }}
            >
              Didn't receive OTP?{" "}
            </Typography>
            {isResendDisabled ? (
              <Typography
                component="span"
                sx={{ fontSize: 18, color: "#F26B1D", fontWeight: 500 }}
              >
                {formatCountdown(resendCountdown)}
              </Typography>
            ) : (
              <Typography
                component="span"
                sx={{
                  fontSize: 18,
                  color: "#3B82F6",
                  cursor: "pointer",
                }}
                onClick={handleResendOTP}
              >
                Resend OTP
              </Typography>
            )}
          </Box>
          <Typography
            onClick={handleChangeEmail}
            sx={{
              mt: 2,
              textAlign: "center",
              color: "#3B82F6",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {backLabel}
          </Typography>
        </>
      ) : step === "otp" && otpSent ? (
        <>
          <Typography variant="body1" sx={{ mb: 1, mt: 4, fontWeight: 500 }}>
            OTP *
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
              setOtp(value);
              if (value.length < 6) {
                setHasOtpError(false);
                setIsOtpVerified(false);
              }
            }}
            onKeyDown={handleOtpKeyDown}
            error={hasOtpError}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isOtpVerified ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#4CAF50" />
                      <path
                        d="m9 12 2 2 4-4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6 || isVerifying || loading}
                      sx={{
                        color:
                          otp.length === 6
                            ? theme.palette.background.buttonbackground
                            : "#999",
                        minWidth: "auto",
                        padding: "4px 8px",
                        fontSize: "14px",
                        textTransform: "none",
                      }}
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </Button>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "&.MuiTextField-root .MuiOutlinedInput-root": {
                backgroundColor: "transparent",
                borderRadius: "6px",
              },
            }}
            inputProps={{ maxLength: 6 }}
          />

          {/* Resend and Change Email Links */}
          <ActionsContainer>
            <ResendLink
              variant="body2"
              onClick={!isResendDisabled ? handleResendOTP : undefined}
              disabled={isResendDisabled}
            >
              {isResendDisabled
                ? `Resend OTP in ${formatCountdown(resendCountdown)}`
                : "Resend OTP"}
            </ResendLink>
            <ChangeEmailLink variant="body2" onClick={handleChangeEmail}>
              {backLabel}
            </ChangeEmailLink>
          </ActionsContainer>
        </>
      ) : null}
    </MainContainer>
  );
};

export default CustomEmailOTP;
