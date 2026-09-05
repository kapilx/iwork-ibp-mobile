import { RouteObject } from "react-router-dom";
import RenewalOpportunityEnhancedListing from "../pages/RenewalOpportunityEnhancedPage/RenewalOpportunityEnhancedListing";
export const renewalOpportunitiesEnhancedRoutes: RouteObject[] = [
  {
    path: "renewal-opportunities-enhanced",
    element: <RenewalOpportunityEnhancedListing />,
  },
];
