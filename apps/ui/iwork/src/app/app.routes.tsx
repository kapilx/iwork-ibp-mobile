import {
  RouterProvider,
  createBrowserRouter,
  RouteObject,
  Navigate,
} from "react-router-dom";
import { useMemo } from "react";

import { authRoutes } from "./routes/auth.route";
import { landingRoutes } from "./routes/landing.route";
import { companyRoutes } from "./routes/company.route";
import { employeeRoutes } from "./routes/employee.route";
import { contactRoutes } from "./routes/contact.route";
import { insurerRoutes } from "./routes/insurer.route";
import { rewardRoutes } from "./routes/reward.route";
import { ProtectedRoute } from "./Auth/protectedRoute";
import { opportunitiesRoutes } from "./routes/opportunities.route";
import { opportunitiesEnhancedRoutes } from "./routes/opportunitiesEnhancedRoutes";
import Layout from "./components/Layout";
import RootToast from "./RootToast";
import { dashboardRoutes } from "./routes/dashboard.route";
import { unauthorizedRoutes } from "./routes/unauthorized.route";
import { knowledgeRoutes } from "./routes/knowledge.route";
import { infoRoutes } from "./routes/info.route";
import { roleRoutes } from "./routes/role.route";
import { policyRoutes } from "./routes/policy.route";
import { renewalOpportunitiesRoutes } from "./routes/renewalOpportunitiesRoutes";
import { renewalOpportunitiesEnhancedRoutes } from "./routes/renewalOpportunitiesEnhancedRoutes";
import { manageQuotesRoutes } from "./routes/manageQuotes.route";
import { endorsementRoutes } from "./routes/endorsement.route";
import { reportRoutes } from "./routes/report.route";
import { masterRoutes } from "./routes/master.route";
import { nl2sqlChatBotRoutes } from "./routes/nl2sqlChatBot.route.js";
import { environment, ErrorBoundary } from "@ui/ui-lib";
import { isStandalone } from "./app";
import { myClientPortfolioRoutes } from "./routes/MyClientPortfolio.route";
import { clientPortfolioEnhancedRoutes } from "./routes/clientPortfolioEnhancedRoutes";
import { claimsRoutes } from "./routes/claims.route";
import { templateManagementRoutes } from "./routes/template-management.route";
import { cronJobsRoutes } from "./routes/cron-jobs.route";
import { migrationLogRoutes } from "./routes/migration-log.route";
import { serviceUrlsRoutes } from "./routes/serviceUrls.route";
import { filePasswordConfigRoutes } from "./routes/file-password-config.route";
import { documentManagementRoutes } from "./routes/document-management.route";
import { adminSettingsRoutes } from "./routes/admin-settings.route";
import { businessTargetRoutes } from "./routes/business-target.route";
import { orgApprovalSettingsRoutes } from "./routes/org-approval-settings.route";

// Feature flag typing
type FeatureRouteObject = RouteObject & {
  flag?: keyof typeof environment.featureFlag;
};

// Filter by feature flags
const filterRoutesByFeature = (routes: FeatureRouteObject[]): RouteObject[] => {
  return routes.filter((r) =>
    r.flag ? environment.featureFlag[r.flag] === true : true
  ) as RouteObject[];
};

// Detect if app is running standalone or inside container
// When served from the container application VITE_MF will be set to "true".
// In that case the iWork app should use "/iwork" as basename for routing.
// export const isStandalone = import.meta.env.VITE_MF !== "true";
// Define all routes
const routes: RouteObject[] = [
  ...authRoutes,
  {
    path: "/",
    element: <ProtectedRoute />, // Protect all routes
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          {
            index: true, // matches /iwork
            element: <Navigate to="/login" replace />, // or /dashboard
          },
          ...filterRoutesByFeature([
            ...landingRoutes,
            ...companyRoutes,
            ...employeeRoutes,
            ...roleRoutes,
            ...contactRoutes,
            ...insurerRoutes,
            ...rewardRoutes,
            ...opportunitiesRoutes,
            ...opportunitiesEnhancedRoutes,
            ...dashboardRoutes,
            ...unauthorizedRoutes,
            ...knowledgeRoutes,
            ...infoRoutes,
            ...policyRoutes,
            ...reportRoutes,
            ...businessTargetRoutes,
            ...masterRoutes,
            ...renewalOpportunitiesRoutes,
            ...renewalOpportunitiesEnhancedRoutes,
            ...manageQuotesRoutes,
            ...endorsementRoutes,
            ...nl2sqlChatBotRoutes,
            ...myClientPortfolioRoutes,
            ...clientPortfolioEnhancedRoutes,
            ...claimsRoutes,
            ...templateManagementRoutes,
            ...cronJobsRoutes,
            ...migrationLogRoutes,
            ...serviceUrlsRoutes,
            ...filePasswordConfigRoutes,
            ...documentManagementRoutes,
            ...adminSettingsRoutes,
          ]),
        ],
      },
    ],
  },
];

export function AppRoutes() {
  const router = useMemo(
    () =>
      createBrowserRouter(routes, {
        basename: isStandalone() ? "/" : "/iwork",
      }),
    [isStandalone(), routes]
  );

  return (
    <div>
      <RouterProvider router={router} />
      <RootToast />
    </div>
  );
}

export default AppRoutes;
