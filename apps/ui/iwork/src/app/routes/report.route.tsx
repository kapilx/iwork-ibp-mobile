import { RouteObject } from "react-router-dom";
import ReportGeneration from "../pages/ReportPage/ReportGeneration";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import BizDownReportListing from "../pages/BizDownReportPage/BizDownReportListing";
import MIRReportsPage from "../pages/MIRReportsPage";
import MIRReportDetail from "../pages/MIRReportsPage/MIRReportDetail";
import BizDownReportEnhancedListing from "../pages/BizDownReportEnhancedPage/BizDownReportEnhancedListing";

export const reportRoutes: RouteObject[] = [
  {
    path: "report",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_ADMIN_REPORTS}>
        <ReportGeneration />
      </PermissionGuard>
    ),
  },
  {
    path: "biz-done-report",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_BUSINESS_PERFORMANCE_REPORT}>
        <BizDownReportListing />
      </PermissionGuard>
    ),
  },
  {
    path: "biz-done-report-enhanced",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_BUSINESS_PERFORMANCE_REPORT}>
        <BizDownReportEnhancedListing />
      </PermissionGuard>
    ),
  },
  {
    path: "mir-reports",
    element: <MIRReportsPage />,
  },
  {
    path: "mir-reports/view/:reportId",
    element: <MIRReportDetail />,
  },
];
