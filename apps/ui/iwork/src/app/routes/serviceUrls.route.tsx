import { RouteObject } from "react-router-dom";
import ServiceUrlsPage from "../pages/ServiceUrlsPage";

export const serviceUrlsRoutes: RouteObject[] = [
    {
        path: "service-catalog",
        element: <ServiceUrlsPage />,
    },
];
