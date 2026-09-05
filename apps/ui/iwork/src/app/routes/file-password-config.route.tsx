import { RouteObject } from "react-router-dom";
import FilePasswordConfigPage from "../pages/FilePasswordConfigPage";

export const filePasswordConfigRoutes: RouteObject[] = [
  {
    path: "file-password-config",
    element: <FilePasswordConfigPage />,
  },
];

export default filePasswordConfigRoutes;
