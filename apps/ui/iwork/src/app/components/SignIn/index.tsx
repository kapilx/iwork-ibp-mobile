import {
  DynamicForm,
  ToastMessage,
  axiosInstance,
  endPoints,
  useApi,
  useApiQuery,
  useCaptcha,
  fetchPasswordProtectionConfigs,
  environment,
  getOrCreateClientScopeId,
} from "@ui/ui-lib";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  StyledAlert,
  SignInStyledButton,
  SignInStyledContainer,
  LoginContainer,
  TitleContainer,
  ImageSection,
  StyledImage,
  LogoContainer,
  Logo,
  ButtomContainer,
  BrandRibbon,
  SubtitleContainer,
  HeadingContainer,
  ForgotPasswordLink,
  CaptchaContainer,
  FullScreenBlock,
  FullScreenCard,
  FullScreenTitle,
  FullScreenMessage,
  FullScreenButton,
  SecondaryButton,
} from "./styles";
import { SignInFormData } from "./types";
import loginImage from "../../assets/pngs/login-banner.png";
import IIRM_LOGO from "../../assets/svgs/iirm-logo.svg"; // Logo import
import { initialSignInData, LOGIN_FORM_CONFIG } from "./formConfig";
import { SIGN_IN } from "../../constants";
import { useAuth } from "../../providers/AuthProvider";
import LoginBanner from "../LoginBanner";
import { useQueryClient } from "@tanstack/react-query";
import { CaptchaComponent } from "@ui/ui-lib/commonComponents/Captcha";

const SILENT_AUTH_KEY = "msSilentAttempted";

const SignIn: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loginBlockedMessage, setLoginBlockedMessage] = useState<string | null>(
    null
  );
  const [sessionRevokedMessage, setSessionRevokedMessage] =
    useState<string | null>(null);
  const [silentAuthChecking, setSilentAuthChecking] = useState(
    environment.featureFlag.FF_IWORK_MS_OAUTH_LOGIN &&
      !sessionStorage.getItem(SILENT_AUTH_KEY)
  );
  
  // Show popup for both login blocked messages and session revocation messages
  const screenMessage = loginBlockedMessage || sessionRevokedMessage;

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const captcha = useCaptcha();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {doFetch,data: loginData,error: loginError,loading,} = useApi();
  const [loginState, setLoginState] =
    useState<any>(null);

  const [isFetchingUser, setIsFetchingUser] = useState(false);

  const queryClient = useQueryClient();

  const submitLogin = async (formData: SignInFormData, forceLogin = false) => {
    // Skip CAPTCHA check if environment variable is set
    if (environment.enableCaptcha && !captcha.isCaptchaValid()) {
      setToastMessage(
        "Please complete the CAPTCHA verification"
      );
      return;
    }

    const payload: any = { ...formData };
    
    // Add forceLogin flag if needed
    if (forceLogin) {
      payload.forceLogin = true;
    }
    
    // Send client scope only when single-session is enabled.
    if (environment.featureFlag.FF_IWORK_SINGLE_SESSION) {
      payload.clientScopeId = getOrCreateClientScopeId();
    }
    
    // Only add captchaToken if we are enabling captcha
    if (environment.enableCaptcha && captcha.captchaToken) {
      payload.captchaToken = captcha.captchaToken;
    }

    doFetch(endPoints.auth, {
      method: "POST",
      data: payload,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  };

  const onSubmit: SubmitHandler<SignInFormData> = async (formData) => {
    await submitLogin(formData, false);
  };

  const handleProceedWithForceLogin = async () => {
    if (!formMethods) return;
    
    const formData = formMethods.getValues();
    await submitLogin(formData, true);
    
    // Clear the warning messages
    setLoginBlockedMessage(null);
    setSessionRevokedMessage(null);
  };

  useEffect(() => {
    if (loginData?.statusCode === 200) {
      queryClient.clear();
      sessionStorage.setItem("user", JSON.stringify(loginData.data));
      setLoginState(loginData.data); // store login data (access token)
      setIsFetchingUser(true); // now trigger user fetch
      setLoginBlockedMessage(null);
      setSessionRevokedMessage(null);
    }

    if (loginError) {
      // Check for password expiry
      const errorResponse = loginError as any;
      if (errorResponse?.passwordExpired) {
        const message = errorResponse.message || "Your password has expired. Please reset your password.";
        setToastMessage(message);
        
        // Store user info temporarily for password reset
        if (errorResponse?.emailId) {
          localStorage.setItem("pendingPasswordReset", JSON.stringify({
            emailId: errorResponse.emailId,
            userId: errorResponse.userId,
            reason: "expired"
          }));
        }
        
        // Navigate to password reset request page after showing message
        setTimeout(() => {
          navigate("/request-password-reset");
        }, 2000);
      } else {
        const message = loginError.message;
        setToastMessage(message);
        if (
          typeof message === "string" &&
          message.toLowerCase().includes("already signed in")
        ) {
          setLoginBlockedMessage(message);
        } else {
          setLoginBlockedMessage(null);
        }
        if (
          typeof message === "string" &&
          message.toLowerCase().includes("signed out")
        ) {
          setSessionRevokedMessage(message);
        } else {
          setSessionRevokedMessage(null);
        }
      }
      // Reset CAPTCHA state
      captcha.resetCaptcha();
    }
  }, [loginData, loginError, navigate, queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only show revoked-session banner when feature is enabled.
    if (!environment.featureFlag.FF_IWORK_SINGLE_SESSION) return;
    const key = "auth:session-revoked-message";
    const message = localStorage.getItem(key);
    if (message) {
      setSessionRevokedMessage(message);
      localStorage.removeItem(key);
    }
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axiosInstance.get(endPoints.userDetails);

        const userData = response.data;

        const combinedUser = {
          ...loginState,
          ...userData?.data,
        };

        // Save & redirect
        sessionStorage.setItem("user", JSON.stringify(combinedUser));
        signIn(combinedUser);
        setToastMessage(loginData?.message);

        // Fetch password protection configurations after successful login
        try {
          await dispatch(fetchPasswordProtectionConfigs() as any).unwrap();
        } catch (configError) {
          console.warn('⚠️ Failed to load password protection configs:', configError);
          // Don't block login if this fails
        }

        navigate("/dashboard");
      } catch (err: any) {
        setToastMessage("Failed to fetch user details");
        console.error("User fetch error:", err);
      } finally {
        setIsFetchingUser(false);
      }
    };

    if (isFetchingUser && loginState?.accessToken?.accessToken) {
      fetchUserDetails();
    }
    }, [isFetchingUser, loginState, navigate, signIn, loginData, dispatch]);

  // Attempt silent Microsoft SSO on first visit — redirect to MS with prompt=none.
  // If no active MS session, the backend redirects back to /login and we show the form.
  useEffect(() => {
    if (!environment.featureFlag.FF_IWORK_MS_OAUTH_LOGIN) {
      setSilentAuthChecking(false);
      return;
    }

    if (sessionStorage.getItem(SILENT_AUTH_KEY)) {
      setSilentAuthChecking(false);
      return;
    }
    sessionStorage.setItem(SILENT_AUTH_KEY, "true");

    axiosInstance
      .get(endPoints.msAuthUrl + "?silent=true")
      .then((response) => {
        const url = response?.data?.url || response?.data?.data?.url;
        if (url) {
          window.location.href = url;
        } else {
          setSilentAuthChecking(false);
        }
      })
      .catch(() => {
        setSilentAuthChecking(false);
      });
  }, []);

  const handleMicrosoftLogin = async () => {
    try {
      const response = await axiosInstance.get(endPoints.msAuthUrl);
      const url = response?.data?.url || response?.data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setToastMessage("Failed to get Microsoft login URL");
      }
    } catch {
      setToastMessage("Microsoft login is not available at the moment");
    }
  };

  if (silentAuthChecking) {
    return null;
  }

  return (
    <>
      <BrandRibbon>Empowering Insurance Excellence | India Insure</BrandRibbon>
      {screenMessage && loginBlockedMessage && (
        <FullScreenBlock>
          <FullScreenCard>
            <FullScreenTitle>Sign-in Notice</FullScreenTitle>
            <FullScreenMessage>{screenMessage}</FullScreenMessage>
            <FullScreenMessage>
              NOTE: Please use the Logout button to end your session. Closing the
              tab/window will keep the session active until it expires.
            </FullScreenMessage>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <SecondaryButton
                onClick={() => {
                  setLoginBlockedMessage(null);
                  setSessionRevokedMessage(null);
                }}
              >
                Cancel
              </SecondaryButton>

              <FullScreenButton
                onClick={handleProceedWithForceLogin}
              >
                Proceed to continue here
              </FullScreenButton>
            </div>
          </FullScreenCard>
        </FullScreenBlock>
      )} 
      {screenMessage && sessionRevokedMessage && (
        <FullScreenBlock>
          <FullScreenCard>
            <FullScreenTitle>Permission Changes Detected</FullScreenTitle>
            <FullScreenMessage>{screenMessage}</FullScreenMessage>
            <FullScreenButton
              onClick={() => {
                setLoginBlockedMessage(null);
                setSessionRevokedMessage(null);
              }}
            >
              Proceed to Log in here
            </FullScreenButton>
          </FullScreenCard>
        </FullScreenBlock>
      )}
      <SignInStyledContainer>
        <LoginBanner />
        <LoginContainer
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !loading &&
              (environment.enableCaptcha ? captcha.isCaptchaVerified : true)
            ) {
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
            <TitleContainer variant="h1">
              iWork - Enterprise Fabric
            </TitleContainer>
            <SubtitleContainer>
              Intelligent Platform. Unified Processes. Seamless Experience.
            </SubtitleContainer>
          </HeadingContainer>

          <DynamicForm
            formConfig={LOGIN_FORM_CONFIG}
            defaultValues={initialSignInData}
            formMethods={setFormMethods}
            sx={{ maxWidth: "372px" }}
          />

          {/* {loginBlockedMessage && (
            <StyledAlert severity="warning">{loginBlockedMessage}</StyledAlert>
          )} */}

          {/* {sessionRevokedMessage && (
            <StyledAlert severity="warning">
              {sessionRevokedMessage}
            </StyledAlert>
          )} */}

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


          <ButtomContainer>
            <SignInStyledButton
              variantType="secondary"
              loading={loading}
              disabled={loading || (environment.enableCaptcha && !captcha.isCaptchaVerified)}
              onClick={
                formMethods ? formMethods.handleSubmit(onSubmit) : undefined
              }
            >
              Log in
            </SignInStyledButton>
          </ButtomContainer>

          <ForgotPasswordLink to="/request-password-reset">
            Forgot password?
          </ForgotPasswordLink>

          {environment.featureFlag.FF_IWORK_MS_OAUTH_LOGIN && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 4px" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
                <span style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
              </div>

              <SecondaryButton
                fullWidth
                onClick={handleMicrosoftLogin}
                sx={{ maxWidth: "372px", mt: 1, borderRadius: "8px", border: "1px solid #d0d0d0", textTransform: "none", fontWeight: 500, gap: "10px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Sign in with Microsoft
              </SecondaryButton>
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
      </SignInStyledContainer>
    </>
  );
};

export default SignIn;
