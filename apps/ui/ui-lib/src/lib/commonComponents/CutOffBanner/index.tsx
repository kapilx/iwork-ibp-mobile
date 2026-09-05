import React from "react";
import { Alert } from "@mui/material";
import { useApiQuery } from "../../hooks/useApiQuery";
import { endPoints } from "../../constants/endPoints";

// IIRM-10585 Rev 3: cut-off is per-activity (planned date + buffer), so there
// is no page-level monthly cut-off to show. The page-level /cut-off/status
// returns only the gate toggle and the user's own active override; per-activity
// countdowns live on the activity card, not here.
export interface CutOffStatus {
  flowType: string;
  gateEnabled: boolean;
  override: { windowEnd: string } | null;
}

const formatIst = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);
  return `${datePart}, ${timePart}`;
};

// Shows an informational banner only when the user has an active cut-off
// extension. Renders nothing while the gate is dark or no override is active.
const CutOffBanner: React.FC = () => {
  const { data } = useApiQuery({
    url: endPoints.cutOffStatus,
    queryKey: ["cut-off-status"],
    config: { staleTime: 5 * 60 * 1000 },
  });
  const status: CutOffStatus | undefined = data?.data;

  if (!status?.gateEnabled || !status.override?.windowEnd) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ mb: 1 }}>
      A cut-off extension is active for you until{" "}
      {formatIst(status.override.windowEnd)}. Submissions in this window are
      credited as on-time.
    </Alert>
  );
};

export default CutOffBanner;
