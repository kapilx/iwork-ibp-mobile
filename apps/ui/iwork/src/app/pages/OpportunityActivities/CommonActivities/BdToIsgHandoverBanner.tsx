import { useApiQuery, endPoints, formatDate } from "@ui/ui-lib";
import {
  ISG_ASSIGNED_TO_TEXT,
  ISG_ASSIGNMENT_PENDING_TEXT,
  THIS_ACTIVITY_WAS_APPROVED_BY,
} from "../../../constants";
import { HandoverBox } from "./styles";
import { IsgHandoverAssignmentProps } from "./constants";


/**
 * Renders the BD -> ISG assignment line shown after the BD RFP Details Entry
 * activity is approved. Shared between the in-context activity view and the
 * top-of-list handover banner so the pending/assigned logic lives in one place.
 */
export const IsgHandoverAssignment = ({
  isgAssignee,
  isgOwner,
}: IsgHandoverAssignmentProps) => (
  <div>
    {isgAssignee?.name === isgOwner?.name ? (
      <div>
        {ISG_ASSIGNMENT_PENDING_TEXT} <b>{isgAssignee?.name}</b>
      </div>
    ) : (
      <div>
        {ISG_ASSIGNED_TO_TEXT} <b>{isgOwner?.name || "--"}</b>
      </div>
    )}
  </div>
);

interface BdToIsgHandoverBannerProps {
  opportunityActivityId: number;
}

/**
 * Standalone banner surfacing the BD -> ISG handover information (who approved
 * the BD RFP Details Entry activity and who the ISG work is assigned to) for
 * users who cannot see the BD activities themselves. Self-fetches the BD
 * activity data via the existing per-activity endpoint.
 */
const BdToIsgHandoverBanner = ({
  opportunityActivityId,
}: BdToIsgHandoverBannerProps) => {
  const { data } = useApiQuery({
    queryKey: ["bdToIsgHandover", opportunityActivityId],
    url: endPoints.opportunityActivitiesByopportunityActivityId(
      Number(opportunityActivityId)
    ),
    enabled: !!opportunityActivityId,
  });

  const approverDetails = data?.data?.approverDetails;
  if (!approverDetails?.name) {
    return null;
  }

  return (
    <HandoverBox data-testid="bd-to-isg-handover-banner">
      <div>
        {THIS_ACTIVITY_WAS_APPROVED_BY} <strong>{approverDetails.name}</strong> on{" "}
        {formatDate(approverDetails?.status?.approvedOn)} at{" "}
        {approverDetails?.status?.approvedTime}
      </div>
      <IsgHandoverAssignment
        isgAssignee={data?.data?.isgAssignee}
        isgOwner={data?.data?.isgOwner}
      />
    </HandoverBox>
  );
};

export default BdToIsgHandoverBanner;
