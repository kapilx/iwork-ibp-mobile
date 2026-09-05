import { RouteObject } from "react-router-dom";
import MasterView from "../pages/MasterPage/MasterView";
import MasterForm from "../pages/MasterPage/MasterForm";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";

export const masterRoutes: RouteObject[] = [
  {
    path: "master",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_MASTER}>
        <MasterView />
      </PermissionGuard>
    ),
  },
  {
    path: "master/:entity/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_MASTER}>
        <MasterForm key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: "master/:entity/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_MASTER}>
        <MasterForm key="edit" />
      </PermissionGuard>
    ),
  },
  {
    path: "master/:entity/:id",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_MASTER}>
        <MasterForm key="view" />
      </PermissionGuard>
    ),
  },
];

export default masterRoutes;
