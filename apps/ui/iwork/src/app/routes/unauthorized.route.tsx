import { RouteObject } from "react-router-dom";
import UnauthorizedPage from "../pages/UnauthorizedPage";

export const unauthorizedRoutes: RouteObject[] = [
  {
    path: "unauthorized",
    element: <UnauthorizedPage />,
  },
];
