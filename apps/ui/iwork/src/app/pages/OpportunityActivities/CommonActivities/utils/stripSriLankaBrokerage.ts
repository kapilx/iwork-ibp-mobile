const DEFAULT_ACTIVITIES = new Set([
  "final_negotiation_activity",
  "placement_slip_generation_activity",
  "policy_hard_copy_activity",
  "policy_confirmation_activity",
  "held_cover_note_activity",
]);

export const stripSriLankaBrokerage = ({
  data,
  isSriLankaUser,
  activityKey,
  allowedActivities = DEFAULT_ACTIVITIES,
}: {
  data: any;
  isSriLankaUser: boolean;
  activityKey?: string | null;
  allowedActivities?: Set<string>;
}) => {
  if (
    !isSriLankaUser ||
    !data ||
    typeof data !== "object" ||
    !allowedActivities.has(activityKey ?? "")
  ) {
    return;
  }

  const scrub = (node: any) => {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(scrub);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(node, "brokeragePercentage")) {
      delete node.brokeragePercentage;
    }

    Object.values(node).forEach(scrub);
  };

  scrub(data);
};
