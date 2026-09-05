import { RouteObject } from "react-router-dom";
import ClaimsTable from "../components/ClaimsTable";
import UploadClaims from "../pages/ClaimsPage";
import NonGroupClaims from "../pages/ClaimsPage/NonGroupClaims";
import TpaClaimsUpload from "../pages/ClaimsPage/TpaClaimsUpload";
import { FeatureKey, PermissionGuard } from "@ui/ui-lib";
export const claimsRoutes: RouteObject[] = [
  {
    path: "manage-claims",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_CLAIMS}>
        <ClaimsTable />
      </PermissionGuard>
    ),
  },
  {
    path: "manage-claims/:tpaId/upload-claims",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_CLAIMS}>
        <TpaClaimsUpload />
      </PermissionGuard>
    ),
  },
  {
    path: "/:policyId/upload-claims",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_CLAIMS}>
        <UploadClaims />
      </PermissionGuard>
    ),
  },
  {
    path: "/:policyId/upload-non-group-claims",
    element: <NonGroupClaims />,
  },
  {
    path: "/:policyId/upload-non-group-claims/:claimId",
    element: <NonGroupClaims />,
  },
];
