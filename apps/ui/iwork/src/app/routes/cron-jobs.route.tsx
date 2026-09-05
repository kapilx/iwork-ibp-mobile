import { RouteObject } from "react-router-dom";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import CronJobsListing from "../pages/CronJobsListing/index.js";

export const cronJobsRoutes: RouteObject[] = [
  {
    path: "application-scheduler",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_CRON_CONFIGURATION}>
        <CronJobsListing />
      </PermissionGuard>
    ),
  },
];

export default cronJobsRoutes;
