import { RouteObject } from "react-router-dom";
import DocumentManagementPage from "../pages/DocumentManagementPage";

export const documentManagementRoutes: RouteObject[] = [
    {
        path: "document-management",
        element: <DocumentManagementPage />,
    },
];

export default documentManagementRoutes;
