import { RouteObject } from "react-router-dom";
import InfoPage from "../pages/Info";
import ReleaseNotes from "../pages/ReleaseNotesPage/index.js";
import {
  PermissionGuard,
  FeatureKey
} from "@ui/ui-lib";

export const infoRoutes: RouteObject[] = [
  {
    path: "info",
    element: <InfoPage />,
  },
  {
    path: "release-notes",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_RELEASE_NOTES}>
        <ReleaseNotes />
      </PermissionGuard>
    ),
  },
];
