import { useLocation } from "react-router-dom";
import { useActivityRoleVisibility } from "@ui/ui-lib";
import { MANAGE_QUOTES } from "../constants";

/**
 * Activity-visibility for the opportunity detail page, scoped to where the user
 * arrived from. Manage Quotes is an ISG-only screen (the listing shows only
 * ISG-reached opportunities), so when the detail page is opened from there we
 * force the ISG-only view — filtered to ISG activities plus the BD->ISG handover
 * banner — for every viewer, exactly as an ISG-only user sees it. Otherwise we
 * defer to the viewer's own BD/ISG read ACL via useActivityRoleVisibility.
 */
export const useScopedActivityRoleVisibility = (): {
  canViewBD: boolean;
  canViewISG: boolean;
} => {
  const location = useLocation();
  const roleVisibility = useActivityRoleVisibility();

  if (location.state?.from === MANAGE_QUOTES) {
    return { canViewBD: false, canViewISG: true };
  }

  return roleVisibility;
};
