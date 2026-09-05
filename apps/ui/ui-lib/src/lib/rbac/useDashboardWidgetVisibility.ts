import useActivityRoleVisibility from "./useActivityRoleVisibility";

/**
 * Per-widget dashboard visibility, keyed by viewing team. A widget is shown to a
 * user when at least one team they can view (BD and/or ISG) has it enabled here.
 *
 * The SO/RO widgets are BD-oriented and routed type-specifically, so they are
 * hidden for ISG-only users, who get the Placement trio instead — the same data
 * shaped around the ISG stages and drilling into Manage Quotes, which IS in
 * their menu. Reuses the same read-ACL mechanism as the menu and listing (no
 * role-name matching). This is the single place to flip widget audiences. See
 * Manage Quotes spec §11.1 and §12.4.
 */
export const DASHBOARD_WIDGET_VISIBILITY = {
  salesFunnel: { bd: true, isg: false },
  salesScheduleBySbu: { bd: true, isg: false },
  soFollowUp: { bd: true, isg: false },
  renewalFunnel: { bd: true, isg: true },
  renewalScheduleBySbu: { bd: true, isg: true },
  roFollowUp: { bd: true, isg: true },
  placementFunnel: { bd: false, isg: true },
  placementScheduleBySbu: { bd: false, isg: true },
  placementFollowUp: { bd: false, isg: true },
  // "My Business Performance" (TargetVsActualBreakdown): BD, leadership and
  // superusers only. Leadership/super resolve as unrestricted (both flags true)
  // via useActivityRoleVisibility, so bd:true covers them; isg:false hides it
  // from ISG-only users.
  myBusinessPerformance: { bd: true, isg: false },
} as const;

export type DashboardWidgetKey = keyof typeof DASHBOARD_WIDGET_VISIBILITY;

export type DashboardWidgetVisibility = Record<DashboardWidgetKey, boolean>;

const useDashboardWidgetVisibility = (): DashboardWidgetVisibility => {
  const { canViewBD, canViewISG } = useActivityRoleVisibility();

  const visibility = {} as DashboardWidgetVisibility;
  (Object.keys(DASHBOARD_WIDGET_VISIBILITY) as DashboardWidgetKey[]).forEach(
    (key) => {
      const widget = DASHBOARD_WIDGET_VISIBILITY[key];
      visibility[key] =
        (canViewBD && widget.bd) || (canViewISG && widget.isg);
    }
  );

  return visibility;
};

export default useDashboardWidgetVisibility;
