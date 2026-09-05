import { RouteObject } from "react-router-dom";
import ClientPortfolioEnhancedListing from "../pages/ClientPortfolioEnhancedPage/ClientPortfolioEnhancedListing";

export const clientPortfolioEnhancedRoutes: RouteObject[] = [
  {
    path: "my-client-portfolio-enhanced",
    element: <ClientPortfolioEnhancedListing />,
  },
];
