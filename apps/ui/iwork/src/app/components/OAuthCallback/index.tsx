import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance, endPoints, fetchPasswordProtectionConfigs } from "@ui/ui-lib";
import { useAuth } from "../../providers/AuthProvider";
import { useDispatch } from "react-redux";

/**
 * Handles the OAuth callback redirect from Microsoft (and Google if added later).
 * Reads accessToken + refreshToken from the URL query params, fetches user details,
 * stores the session and navigates to the dashboard.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!accessToken) {
      setError("Authentication failed — no token received.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const handleOAuthLogin = async () => {
      try {
        const loginData = {
          accessToken: { accessToken, refreshToken },
        };

        sessionStorage.setItem("user", JSON.stringify(loginData));

        const response = await axiosInstance.get(endPoints.userDetails);
        const userData = response.data;

        const combinedUser = { ...loginData, ...userData?.data };
        sessionStorage.setItem("user", JSON.stringify(combinedUser));
        sessionStorage.removeItem("msSilentAttempted");
        signIn(combinedUser);

        try {
          await dispatch(fetchPasswordProtectionConfigs() as any).unwrap();
        } catch {
          // Non-blocking
        }

        navigate("/dashboard");
      } catch (err: any) {
        setError("Failed to load user details after authentication.");
        sessionStorage.removeItem("user");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleOAuthLogin();
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "red" }}>{error} — redirecting to login…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p>Completing sign-in, please wait…</p>
    </div>
  );
};

export default OAuthCallback;
