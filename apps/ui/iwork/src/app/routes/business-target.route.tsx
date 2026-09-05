import { RouteObject } from "react-router-dom";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import BusinessTargetReport from "../pages/BusinessTargetsPage/BusinessTargetReport";
import AddEditTarget from "../pages/BusinessTargetsPage/AddEditTarget/addEditTarget";

// Business Targets (admin module). View = report read; add/edit/delete = manage.
export const businessTargetRoutes: RouteObject[] = [
  {
    path: "business-targets-report",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_BUSINESS_TARGET}>
        <BusinessTargetReport />
      </PermissionGuard>
    ),
  },
  {
    path: "business-targets/new",
    element: (
      <PermissionGuard feature={FeatureKey.MANAGE_BUSINESS_TARGET}>
        <AddEditTarget key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: "business-targets/edit",
    element: (
      <PermissionGuard feature={FeatureKey.MANAGE_BUSINESS_TARGET}>
        <AddEditTarget key="edit" />
      </PermissionGuard>
    ),
  },
];
