import { Navigate, RouteObject } from "react-router-dom";
import SignIn from "../components/SignIn";
import PasswordReset from "../components/PasswordReset";
import PasswordResetMail from "../components/PasswordResetMail";
import OAuthCallback from "../components/OAuthCallback";

// AuthPageWrapper prevents authenticated users from hitting auth pages
function AuthPageWrapper({ children }: { children: JSX.Element }) {
  const isAuthenticated = Boolean(sessionStorage.getItem("user"));

  if (isAuthenticated) {
    // Avoid clearing session on /login; keep the active session and send user to dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <AuthPageWrapper>
        <SignIn />
      </AuthPageWrapper>
    ),
  },
  {
    path: "/password-reset",
    element: (
      <AuthPageWrapper>
        <PasswordReset />
      </AuthPageWrapper>
    ),
  },
  {
    path: "/request-password-reset",
    element: (
      <AuthPageWrapper>
        <PasswordResetMail />
      </AuthPageWrapper>
    ),
  },
  {
    path: "/auth/callback",
    element: <OAuthCallback />,
  },
];
