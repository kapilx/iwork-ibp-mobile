import { RouteObject } from "react-router-dom";
import RenewalOpportunityListing from "../pages/RenewalOpportunityPage/RenewalOpportunityListing";
export const renewalOpportunitiesRoutes: RouteObject[] = [
  {
    path: "renewal-opportunities",
    element: <RenewalOpportunityListing />,
  },
];
