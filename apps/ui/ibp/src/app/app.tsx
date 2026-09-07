import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ibpTheme, WorkInProgress, environment } from "@ui/ui-lib";
import { useEffect } from "react";
import { Provider } from "react-redux";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import ProtectedRoute from "./Auth/ProtectedRoute";
import LifeEventsRoute from "./Auth/LifeEventsRoute";
import PublicRoute from "./Auth/PublicRoute";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import PasswordReset from "./components/PasswordReset";
import SignIn from "./components/SignIn";
import OAuthCallback from "./components/OAuthCallback";
import AskEcho from "./components/AskEcho";
import DashboardPage from "./pages/DashboardPage";
import Enrollment from "./pages/Enrollment";
import FaqPage from "./pages/FaqPage";
import HospitalNetwork from "./pages/HospitalNetwork";
import MyInsurance from "./pages/MyInsurance";
import ViewSummary from "./pages/ViewSummary";
import UnifiedSummary from "./pages/UnifiedSummary";
import ClaimsCornerPage from "./pages/ClaimsCorner";
import store from "./redux/store";
import RootToast from "./RootToast";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { styled } from "@mui/material";
import HospitalNetworkV1 from "./pages/HospitalNetworkV1";
import MyDocuments from "./pages/MyDocuments";
import ContactMatrixPage from "./pages/ContactMatrix";
import MultiEnrollment from "./pages/MultiEnrollment";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import ManageDependents from "./pages/ManageDependents";
import { Support } from "@mui/icons-material";
import SupportPage from "./pages/SupportPage";
import ClaimsIntimation from "./pages/ClaimsIntimation";
import IntimateClaimViaDocs from "./pages/IntimateClaimViaDocs";
import ECardPage from "./pages/ECardPage";
import LifeEvents from "./pages/LifeEvents";
import LifeEventsMain from "./pages/LifeEvents/LifeEventsMain";
import Landing from "./components/landing";
import { setToastMessage } from "./redux/slice";
import ScrollToTop from "./components/ScrollToTop";
import PolicyFeaturePreview from "./pages/PolicyFeaturePreview";
import ActivityLogPreview from "./pages/ActivityLogPreview";
import HRPortal from "./pages/HRPortal";
import LoginPage from "./pages/LoginPage";
import DocumentPreviewPage from "./pages/DocumentPreviewPage";

const SESSION_EXPIRED_MESSAGE_KEY = "auth:session-expired-message";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});


export const InfoContainer = styled("div")`
  position: relative;
  min-height: calc(100vh - 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const AppShell = styled("div")`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const MainContent = styled("main")<{ $reserveBottomNavSpace?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  ${({ $reserveBottomNavSpace }) =>
    $reserveBottomNavSpace &&
    `
    @media (max-width: 768px) {
      padding-bottom: 60px;
    }
  `}
`;

// Wrapper to show modal for /login?step=reset
const LoginRedirect = () => {
  const [searchParams] = useSearchParams();
  const stepFromUrl = searchParams.get("step");
  const tokenFromUrl = searchParams.get("token");

  if (stepFromUrl === "reset" && tokenFromUrl) {
    // Show landing page with modal open (modal auto-opens via LandingHeader)
    return <Landing />;
  }

  // Normal login page
  return (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  );
};

const ClaimIntimationRoute = () => {
  const isClaimIntimationEnable = environment.featureFlag.FF_CLAIM_INTIMATION_MANAGEMENT;
  return isClaimIntimationEnable ? <ClaimsIntimation /> : <Navigate to="/dashboard" replace />;
};

export function App() {
  const location = useLocation();
  const isAuthenticated = Boolean(sessionStorage.getItem("user"));

  useEffect(() => {
    if (location.pathname !== "/landing") return;
    const message = localStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
    if (!message) return;

    store.dispatch(
      setToastMessage({
        message,
        duration: null,
      })
    );

    const clearToastOnInteraction = () => {
      store.dispatch(setToastMessage({ message: null }));
      localStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
      window.removeEventListener("click", clearToastOnInteraction);
      window.removeEventListener("keydown", clearToastOnInteraction);
      window.removeEventListener("touchstart", clearToastOnInteraction);
    };

    window.addEventListener("click", clearToastOnInteraction, { once: true });
    window.addEventListener("keydown", clearToastOnInteraction, { once: true });
    window.addEventListener("touchstart", clearToastOnInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("click", clearToastOnInteraction);
      window.removeEventListener("keydown", clearToastOnInteraction);
      window.removeEventListener("touchstart", clearToastOnInteraction);
    };
  }, [location.pathname]);

  const hideHeader =
    location.pathname === "/login" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/auth/callback" ||
    location.pathname === "/landing" ||
    location.pathname === "/hr-portal" ||
    location.pathname.startsWith("/hr-portal/");
  const hideFooter =
    location.pathname === "/unified-enrollment" ||
    location.pathname === "/e-card" ||
    location.pathname === "/my-documents" ||
    location.pathname === "/my-documents/preview" ||
    location.pathname === "/policy-features" ||
    location.pathname.startsWith("/policy-features/") ||
    location.pathname === "/activity-log-preview" ||
    location.pathname === "/landing" ||
    location.pathname === "/hr-portal" ||
    location.pathname.startsWith("/hr-portal/") ||
    location.pathname === "/life-events/flow" ||
    location.pathname === "/claims-intimation" ||
    location.pathname === "/intimate-claim-via-docs";
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={ibpTheme}>
          <CssBaseline />
          <style>{`body { overflow-x: hidden; }`}</style>
          <AppShell>
            {!hideHeader && <Header />}
            <MainContent $reserveBottomNavSpace={!hideHeader}>
              <ScrollToTop />
              <Routes>
                <Route path="/landing" element={<Landing />} />
                {/* <Route
                  path="/login"
                  element={<LoginRedirect />}
                /> */}
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/reset-password"
                  element={
                    <PublicRoute>
                      <PasswordReset />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/callback"
                  element={
                    <PublicRoute>
                      <OAuthCallback />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/error"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/enrollment" element={<Enrollment />} />

                  {/* Life Events Routes — restricted to qualifying GMC policy holders */}
                  <Route element={<LifeEventsRoute />}>
                    <Route path="/life-events" element={<LifeEventsMain />} />
                    <Route path="/life-events/flow" element={<LifeEvents />} />
                  </Route>

                  <Route
                    path="/unified-enrollment"
                    element={<MultiEnrollment />}
                  />
                  <Route path="/e-card" element={<ECardPage />} />
                  <Route path="/view-summary" element={<ViewSummary />} />
                  <Route path="/unified-summary" element={<UnifiedSummary />} />

                  <Route path="/hospital" element={<HospitalNetworkV1 />} />
                  <Route path="/faqs" element={<FaqPage />} />
                  <Route path="/my-insurance" element={<MyInsurance />} />
                  <Route path="/claims-corner" element={<ClaimsCornerPage />} />
                  <Route path="/my-documents" element={<MyDocuments />} />
                  <Route path="/my-documents/preview" element={<DocumentPreviewPage />} />
                  <Route
                    path="/policy-features"
                    element={<PolicyFeaturePreview />}
                  />
                  <Route
                    path="/policy-features/:policyId"
                    element={<PolicyFeaturePreview />}
                  />
                  <Route
                    path="/activity-log-preview"
                    element={<ActivityLogPreview />}
                  />
                  <Route
                    path="/customer-care"
                    element={<ContactMatrixPage />}
                  />
                  <Route
                    path="/claims-intimation"
                    element={<ClaimIntimationRoute />}
                  />
                  <Route
                    path="/intimate-claim-via-docs"
                    element={<IntimateClaimViaDocs />}
                  />
                  <Route
                    path="/e-card"
                    element={
                      <InfoContainer>
                        <WorkInProgress />
                      </InfoContainer>
                    }
                  />
                  <Route
                    path="/quick-links"
                    element={
                      <InfoContainer>
                        <WorkInProgress />
                      </InfoContainer>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <InfoContainer>
                        <ProfilePage />
                      </InfoContainer>
                    }
                  />
                  <Route
                    path="/manage-dependents"
                    element={
                      <InfoContainer>
                        <ManageDependents />
                      </InfoContainer>
                    }
                  />
                  <Route
                    path="/work-in-progress"
                    element={
                      <InfoContainer>
                        <WorkInProgress />
                      </InfoContainer>
                    }
                  />
                  <Route path="/hr-portal/*" element={<HRPortal />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainContent>
            {!hideHeader && !hideFooter && <Footer />}
            {!hideHeader && <BottomNav />}
          </AppShell>
          <RootToast />
          <PwaInstallPrompt />
          {/* {!hideHeader && <AskEcho />} */}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
