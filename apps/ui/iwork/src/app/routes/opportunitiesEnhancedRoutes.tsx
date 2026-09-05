import { RouteObject } from "react-router-dom";
import OpportunitiesEnhancedListing from "../pages/OpportunitiesEnhancedPage/OpportunitiesEnhancedListing";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";

// Same route-level permission gating as Manage SO (opportunities.route.tsx) —
// this page must be exactly as restricted as the page it was duplicated from.
export const opportunitiesEnhancedRoutes: RouteObject[] = [
  {
    path: "opportunities-enhanced",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_OPPORTUNITY}>
        <PermissionGuard feature={FeatureKey.VIEW_BD_ACTIVITY}>
          <OpportunitiesEnhancedListing />
        </PermissionGuard>
      </PermissionGuard>
    ),
  },
];
