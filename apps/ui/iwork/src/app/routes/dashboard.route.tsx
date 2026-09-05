import { RouteObject } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import BusinessPerformance from "../pages/Dashboard/Business-performance-listing";

export const dashboardRoutes: RouteObject[] = [
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "business-performance",
    element: <BusinessPerformance />,
  },
];
