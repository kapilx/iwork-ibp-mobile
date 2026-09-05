import { RouteObject } from "react-router-dom";
import RoleManagement from "../pages/RolePage/RoleManagement";
import {
  PermissionGuard,
  FeatureKey
} from "@ui/ui-lib";

export const roleRoutes: RouteObject[] = [
  {
    path: "roles",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_ADMIN_ROLES}>
        <RoleManagement />
      </PermissionGuard>
    ),
  },
];
