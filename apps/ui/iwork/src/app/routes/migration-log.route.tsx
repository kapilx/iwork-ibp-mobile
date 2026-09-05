import { RouteObject } from "react-router-dom";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import MigrationLog from "../pages/MigrationLog/index.js";

export const migrationLogRoutes: RouteObject[] = [
  {
    path: "migration-log",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_MIGRATION_LOG}>
        <MigrationLog />
      </PermissionGuard>
    ),
  },
];

export default migrationLogRoutes;
