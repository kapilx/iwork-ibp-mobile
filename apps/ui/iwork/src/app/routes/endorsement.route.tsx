import { FeatureKey, PermissionGuard } from "@ui/ui-lib";
import { RouteObject, useParams } from "react-router-dom";
import CreateEndorsement from "../pages/EndorsementPage/EndorsementDetails";
import EndorsementListing from "../pages/EndorsementPage/EndorsementListing";
import {
  CREATION_TYPES,
  CreationType,
} from "../pages/EndorsementPage/EndorsementDetails/creationFlowConfigs";

const CreateEndorsementRoute = ({
  creationType,
}: {
  creationType: CreationType;
}) => {
  const { endorsementId, policyId } = useParams<{
    endorsementId?: string;
    policyId?: string;
  }>();

  const routeKey = `${policyId ?? "policy"}-${creationType}-${
    endorsementId ?? "new"
  }`;

  return (
    <CreateEndorsement
      key={routeKey}
      creationTypeOverride={creationType}
    />
  );
};

const creationRoutes: RouteObject[] = CREATION_TYPES.map((creationType) => ({
  path: `/:policyId/create-${creationType}/:endorsementId?`,
  element: (
    <PermissionGuard feature={FeatureKey.VIEW_ENDORSEMENT}>
      <CreateEndorsementRoute creationType={creationType} />
    </PermissionGuard>
  ),
}));

export const endorsementRoutes: RouteObject[] = [
  {
    path: "/manage-endorsements",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_ENDORSEMENT}>
        <EndorsementListing />
      </PermissionGuard>
    ),
  },
  ...creationRoutes,
];
