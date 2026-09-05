import { RouteObject } from "react-router-dom";
import AdminSettingsPage from "../pages/AdminSettingsPage";

export const adminSettingsRoutes: RouteObject[] = [
  {
    path: "admin-settings",
    element: <AdminSettingsPage />,
  },
];

export default adminSettingsRoutes;
