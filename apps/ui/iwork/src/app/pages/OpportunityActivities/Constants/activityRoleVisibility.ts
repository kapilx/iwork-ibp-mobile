import { BD, ISG } from "../../../constants";
import { TransformedActivity } from "./activityConstants";

/**
 * Filters opportunity activities to those visible to the current user's role(s).
 * BD-role activities require canViewBD, ISG-role activities require canViewISG, and
 * any activity without a BD/ISG role is always shown. Users holding both
 * capabilities see everything. Shared by the activities accordion and the summary
 * card on the opportunity detail page so both stay in sync.
 */
export const filterActivitiesByRole = (
  activities: TransformedActivity[],
  canViewBD: boolean,
  canViewISG: boolean
): TransformedActivity[] =>
  (activities || []).filter((activity: TransformedActivity) => {
    if (activity.role === BD) return canViewBD;
    if (activity.role === ISG) return canViewISG;
    return true;
  });
