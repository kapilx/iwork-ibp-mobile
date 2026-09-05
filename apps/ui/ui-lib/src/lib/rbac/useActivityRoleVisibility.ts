import { useSelector } from "react-redux";
import { selectHasPermission } from "@ui/ui-lib/redux/permissionSlice";
import { FeatureKey } from "./permissionMap";
import { RootState } from "@ui/ui-lib/redux/store";

/**
 * Resolves which opportunity-activity team(s) the current user may view, based on
 * the "BD/ISG activities read" ACL capabilities (BD_READ_001 / ISG_READ_001).
 *
 *   - BD read only  -> { canViewBD: true,  canViewISG: false }
 *   - ISG read only -> { canViewBD: false, canViewISG: true }
 *   - both reads, or neither (leadership/super/CS) -> both true (unrestricted)
 *
 * Mirrors `ScopeService.getActivityRoleVisibility` on the backend so the listing,
 * summary card, and activities accordion all agree. The specific read action (not
 * the broad BD/ISG category) is used so a BD manager holding ISG approve/assign
 * ACL is not mistaken for an ISG team member — provided the read ACL is seeded to
 * the correct roles.
 */
const useActivityRoleVisibility = () => {
  const canReadBD = useSelector((state: RootState) =>
    selectHasPermission(FeatureKey.VIEW_BD_ACTIVITY)(state)
  );
  const canReadISG = useSelector((state: RootState) =>
    selectHasPermission(FeatureKey.VIEW_ISG_ACTIVITY)(state)
  );

  // Both reads, or neither, means the user is not restricted to a single team.
  if (canReadBD === canReadISG) {
    return { canViewBD: true, canViewISG: true };
  }

  return { canViewBD: canReadBD, canViewISG: canReadISG };
};

export default useActivityRoleVisibility;
