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
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { AppDispatch } from "../../redux/store";
import store from "../../redux/store";
import { fetchTermsAndConditions } from "../../redux/tcSlice";
import { TOAST_MESSAGES } from "../../constants";
import axiosInstance from "@ui/ui-lib/utils/axiosInterceptors";
import { useNavigate } from "react-router-dom";
import {
  ButtonContainer,
  MainContainer,
  VerifyButtonContainer,
  ResendOTPContainer,
  ResendText,
  ResendLink,
  ResendChangeNumberLink,
} from "./styles";
import {
  createPhoneOTPFormConfig,
  OTP_FORM_CONFIG,
  initialPhoneOTPData,
  initialOTPData,
} from "./formConfig";
import { ButtonWrapper, OtpInput, OtpInputWrapper } from "../SignIn/styles";

interface OTPAuthProps {
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  resendCooldownSeconds?: number;
  remainingResendCooldownSeconds?: number;
  initialPhoneNumber?: string;
  autoSendOnMount?: boolean;
  hideIdentifierEntry?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onOtpSent?: () => void; // New callback for when OTP is sent
}

const OTPAuth: React.FC<OTPAuthProps> = ({
  loading,
  setLoading,
  resendCooldownSeconds,
  remainingResendCooldownSeconds = 0,
  initialPhoneNumber,
  autoSendOnMount = false,
  hideIdentifierEntry = false,
  onBack,
  backLabel = "Change phone number",
  onOtpSent,
}) => {
  const subdomain = window.location.hostname.split(".")[0];
  const alreadySentOtp = hideIdentifierEntry && !autoSendOnMount;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState(""); // Real-time tracking
  const [step, setStep] = useState<"phone" | "otp">(
    alreadySentOtp ? "otp" : "phone"
  );
  const [isResendDisabled, setIsResendDisabled] = useState(
    alreadySentOtp && remainingResendCooldownSeconds > 0
  );
  const [resendCountdown, setResendCountdown] = useState(
    alreadySentOtp ? remainingResendCooldownSeconds : 0
  );
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // OTP verification states
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasOtpError, setHasOtpError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasSentOtpOnMountRef = useRef(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Form methods
  const [phoneFormMethods, setPhoneFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [otpFormMethods, setOtpFormMethods] =
    useState<ReturnType<typeof useForm>>();

  // Create dynamic form config with real-time phone number tracking
  const [phoneOTPFormConfig, setPhoneOTPFormConfig] = useState(
    createPhoneOTPFormConfig(setPhoneNumberInput)
  );

  // Watch for form changes to update real-time state
  useEffect(() => {
    if (phoneFormMethods) {
      const subscription = phoneFormMethods.watch((value) => {
        if (value.phoneNumber !== phoneNumberInput) {
          setPhoneNumberInput(value.phoneNumber || "");
        }
      });
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, [phoneFormMethods, phoneNumberInput]);

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

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If it doesn't start with country code, add +91 for India
    if (!phone.startsWith("+")) {
      return `+91${cleaned}`;
    }

    return `+${cleaned}`;
  };

  const handleSendOTP = async () => {
    let phoneToSend: string;

    // If we have initialPhoneNumber (auto-send case), use it directly
    if (initialPhoneNumber && autoSendOnMount) {
      console.log(
        "handleSendOTP: Using initialPhoneNumber for auto-send:",
        initialPhoneNumber
      );
      phoneToSend = initialPhoneNumber;

      // Basic validation for phone length (should be at least 10 digits)
      const cleanPhone = phoneToSend.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 10) {
        dispatch(
          setToastMessage({
            message: "Please enter a valid phone number",
            type: "error",
          })
        );
        return;
      }
    } else {
      // Manual send case - use form validation
      const phone =
        phoneNumberInput || phoneFormMethods?.getValues("phoneNumber");
      if (!phone || phone.trim().length < 10) {
        dispatch(
          setToastMessage({
            message: "Please enter a valid phone number",
            type: "error",
          })
        );
        return;
      }
      phoneToSend = phone;
    }

    setLoading?.(true);
    setIsSendingOTP(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneToSend);
      setPhoneNumber(formattedPhone); // Store for OTP verification

      // Call backend to send OTP (no Firebase SDK required)
      const response = await axiosInstance.post(endPoints.sendPhoneOtp, {
        phoneNumber: formattedPhone,
        domain: subdomain,
      });

      if (response.data?.statusCode === 200) {
        const cooldownSeconds = resendCooldownSeconds ?? 60;
        setStep("otp");
        setIsResendDisabled(cooldownSeconds > 0);
        setResendCountdown(cooldownSeconds);

        // Notify parent component that OTP was sent
        onOtpSent?.();

        dispatch(
          setToastMessage({
            message: "OTP sent successfully!",
            type: "success",
          })
        );
      }
    } catch (error: any) {
      let errorMessage = "Failed to send OTP. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      dispatch(setToastMessage({ message: errorMessage, type: "error" }));
    } finally {
      setLoading?.(false);
      setIsSendingOTP(false);
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
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Verify OTP with backend (no Firebase SDK required)
      const response = await axiosInstance.post(endPoints.verifyPhoneOtp, {
        phoneNumber: formattedPhone,
        otp,
        domain: subdomain,
      });

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

  const handleChangePhone = () => {
    if (hideIdentifierEntry && onBack) {
      onBack();
      return;
    }
    hasSentOtpOnMountRef.current = false;
    setPhoneNumber("");
    setPhoneNumberInput("+91");
    setStep("phone");
    phoneFormMethods?.reset(initialPhoneOTPData);
    otpFormMethods?.reset();
  };

  useEffect(() => {
    dispatch(setToastMessage(null));

    if (!initialPhoneNumber) return;
    setPhoneNumberInput(initialPhoneNumber);
    setPhoneNumber(initialPhoneNumber);
    phoneFormMethods?.reset({ phoneNumber: initialPhoneNumber });
  }, [initialPhoneNumber, phoneFormMethods, dispatch]);

  useEffect(() => {
    if (
      !autoSendOnMount ||
      !initialPhoneNumber ||
      step !== "phone" ||
      isSendingOTP ||
      hasSentOtpOnMountRef.current
    ) {
      return;
    }

    hasSentOtpOnMountRef.current = true;
    void handleSendOTP();
  }, [autoSendOnMount, initialPhoneNumber, step, isSendingOTP]);

  return (
    <MainContainer>
      {!hideIdentifierEntry && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === "phone" && !loading) {
                handleSendOTP();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && step === "phone" && !loading) {
                e.preventDefault();
                handleSendOTP();
              }
            }}
          >
            <DynamicForm
              formConfig={phoneOTPFormConfig}
              defaultValues={initialPhoneOTPData}
              formMethods={setPhoneFormMethods}
              disableAllFields={step === "otp"}
            />
          </form>

          <ButtonContainer>
            <ButtonWrapper
              variant="contained"
              buttonType="secondary"
              label="Send OTP"
              onClick={handleSendOTP}
              loading={loading && step === "phone"}
              disabled={
                loading ||
                step === "otp" ||
                (() => {
                  const currentPhone =
                    phoneNumberInput ||
                    phoneFormMethods?.getValues("phoneNumber") ||
                    "";
                  const cleanPhone = currentPhone.replace(/[^0-9]/g, "");
                  return cleanPhone.length < 10;
                })()
              }
              bgcolor={theme.palette.background.DarkBlue}
              color={theme.palette.background.paper}
              width="160px"
              height="48px"
            />
          </ButtonContainer>
        </>
      )}

      {hideIdentifierEntry && step !== "otp" && isSendingOTP === false && (
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
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            OTP sent to your registered mobile number. Please enter it below.
          </Typography>
          <Typography
            onClick={handleChangePhone}
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

      {/* Show OTP field directly when hideIdentifierEntry and OTP is being sent (auto-send flow) */}
      {hideIdentifierEntry && step !== "otp" && isSendingOTP === true && (
        <>
          <OtpInputWrapper sx={{ mb: 3.5, opacity: 0.5 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <OtpInput
                key={index}
                type="text"
                maxLength={1}
                value=""
                disabled
                readOnly
                inputMode="numeric"
              />
            ))}
          </OtpInputWrapper>
          <Typography variant="body2" sx={{ color: "#6B7280", textAlign: "center", mt: 1 }}>
            Sending OTP to your registered mobile number...
          </Typography>
          <Typography
            onClick={handleChangePhone}
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
      )}

      {/* OTP Field - Shows after Send OTP is clicked */}
      {step === "otp" && hideIdentifierEntry ? (
        <>
          <OtpInputWrapper sx={{ mb: 3.5 }}>
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
              height="48px"
            />
          </ButtonContainer>
          <Box sx={{ textAlign: "center", mt: 3 }}>
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
                  color: theme.palette.background.DarkBlue,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                onClick={handleResendOTP}
              >
                Resend OTP
              </Typography>
            )}
          </Box>
          <Typography
            onClick={handleChangePhone}
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
      ) : step === "otp" ? (
        <>
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && !isVerifying) {
                e.preventDefault();
                handleVerifyOTP();
              }
            }}
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
                            ? theme.palette.background.DarkBlue
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

          {/* Resend OTP and did not receive text */}
          <ResendOTPContainer>
            {/* <ResendText variant="body2">did not receive an OTP?</ResendText> */}
            <ResendLink
              variant="body2"
              onClick={!isResendDisabled ? handleResendOTP : undefined}
              disabled={isResendDisabled}
            >
              {isResendDisabled
                ? `resend OTP in ${formatCountdown(resendCountdown)}`
                : "resend OTP"}
            </ResendLink>
            <ResendChangeNumberLink variant="body2" onClick={handleChangePhone}>
              {backLabel}
            </ResendChangeNumberLink>
          </ResendOTPContainer>

          {/* Change Number link */}
        </>
      ) : null}

      {/* Commented out original step-based conditional rendering */}
      {/*
      {step === "phone" ? (
        <>
          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
            Enter your phone number to receive an OTP
          </Typography>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+91 1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                handleSendOTP();
              }
            }}
            sx={{ mb: 2 }}
            helperText="Format: +91 followed by 10 digits"
          />
          <CommonButton
            variant="contained"
            buttonType="secondary"
            label="Send OTP"
            onClick={handleSendOTP}
            loading={loading}
            disabled={loading || !phoneNumber}
            bgcolor={theme.palette.text.Deeporange}
            color={theme.palette.background.paper}
            width="160px"
            height="40px"
          />
        </>
      ) : (
        <>
          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
            Enter the 6-digit OTP sent to {phoneNumber}
          </Typography>
          <TextField
            fullWidth
            label="OTP"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtp(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                handleVerifyOTP();
              }
            }}
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 6 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <CommonButton
              variant="contained"
              buttonType="secondary"
              label="Verify OTP"
              onClick={handleVerifyOTP}
              loading={loading}
              disabled={loading || otp.length !== 6}
              bgcolor={theme.palette.text.Deeporange}
              color={theme.palette.background.paper}
              width="160px"
              height="40px"
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Typography
              variant="body2"
              onClick={!isResendDisabled ? handleResendOTP : undefined}
              sx={{
                color: isResendDisabled ? "#999" : theme.palette.text.Deeporange,
                cursor: isResendDisabled ? "not-allowed" : "pointer",
                textDecoration: "underline",
              }}
            >
              {isResendDisabled
                ? `Resend OTP in ${formatCountdown(resendCountdown)}`
                : "Resend OTP"}
            </Typography>
            <Typography
              variant="body2"
              onClick={handleChangePhone}
              sx={{
                color: theme.palette.text.Deeporange,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Change Number
            </Typography>
          </Box>
        </>
      )}
      */}
    </MainContainer>
  );
};

export default OTPAuth;
