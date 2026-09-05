import { RouteObject } from "react-router-dom";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import ManageQuotesListing from "../pages/ManageQuotes/ManageQuotesListing";

export const manageQuotesRoutes: RouteObject[] = [
  {
    path: "manage-quotes",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_ISG_ACTIVITY}>
        <ManageQuotesListing />
      </PermissionGuard>
    ),
  },
];
