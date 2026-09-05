import { RouteObject } from "react-router-dom";
import OpportunitiesDetails from "../pages/OpportunitiesPage/OpportunitiesDetails";
// import OpportunitiesForm from "../pages/OpportunitiesPage/OpportunitiesForm//index";
import OpportunitiesListing from "../pages/OpportunitiesPage/OpportunitiesListing";
import OpportunityForm from "../pages/OpportunitiesPage/OpportunitiesForm/OpportunityForm";
import OpportunityActivities from "../pages/OpportunityActivities";
import QuoteComparisonPage from "../pages/QuoteComparisonPage";
import {
  PermissionGuard,
  FeatureKey
} from "@ui/ui-lib";

export const opportunitiesRoutes: RouteObject[] = [
  {
    path: "opportunities",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_OPPORTUNITY}>
        <PermissionGuard feature={FeatureKey.VIEW_BD_ACTIVITY}>
          <OpportunitiesListing />
        </PermissionGuard>
      </PermissionGuard>
    ),
  },
  {
    path: "opportunities/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_OPPORTUNITY}>
        <OpportunityForm key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: "opportunities/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_OPPORTUNITY}>
        <OpportunityForm key="edit" />
      </PermissionGuard>
    ),
  },
  {
    path: "opportunities/:id",
    element: <OpportunitiesDetails />,
  },
  {
    path: "opportunities/new1",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_OPPORTUNITY}>
        <OpportunityForm />
      </PermissionGuard>
    ),
  },
  {
    path: "/opportunities/activities/:id",
    element: <OpportunityActivities />,
  },
  {
    path: "/opportunities/quotecomparison/:id",
    element: <QuoteComparisonPage />,
  },
];
