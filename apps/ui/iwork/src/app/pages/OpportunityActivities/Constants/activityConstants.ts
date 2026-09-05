import { dataValidationConfig } from "../Activities/DataValidation/config";
import { mandateDetailsConfig } from "../Activities/MandateDetailsEntry/MandateConfig";
import { rfpDataCollectionFormConfig } from "../Activities/RFPDataCollection/formConfig";
import { rfpDetailsEntryConfig } from "../Activities/RFPDetailsEntry/config";
import { qcrFormConfig } from "../Activities/QCRGeneration/formConfig";
import { finalNegotiationConfig } from "../Activities/FinalNegotiation/config";
import { placementSlipGenerationConfig } from "../Activities/PlacementSlipGeneration/config";
import { premiumCalculationConfig } from "../Activities/PremiumCalculation/formConfig";
import { heldCoverNoteConfig } from "../Activities/HeldCoverNote/formConfig";
import { policyHardCopyConfig } from "../Activities/PolicyHardCopyReceipt/formConfig";
import { policyConfirmationConfig } from "../Activities/PolicyConfirmation/formConfig";
import { policyDocketFormConfig } from "../Activities/PolicyDocket/formConfig";
import { useApiQuery, endPoints } from "@ui/ui-lib";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface ApiParticipant {
  userId: number;
  userName: string;
}
interface ApiActivity {
  opportunityActivityId: number;
  activityId: number;
  activityName: string;
  isCoversRequired: boolean;
  activityStatus?: string;
  dueDate?: string | null;
  owner?: string | null;
  participants?: ApiParticipant[];
  activityKey: string;
  activityApproval?: string;
  isPlanned?: string;
  isLost?: boolean;
  activityStatusKey?: string;
  isDocumentMandatory?: boolean;
}

export interface TransformedActivity {
  id: number;
  title: string;
  type: string;
  config: any[];
  opportunityActivityId: number;
  isCoversRequired: boolean;
  activityDueDate?: string | null;
  activityOwner?: string;
  activityKey?: string;
  activityStatus?: string;
  role?: string;
  isPlanned?: string;
  isLost?: boolean;
  isDocumentMandatory?: boolean;
}

export const transformActivities = (
  apiResponse: any[]
): TransformedActivity[] => {
  const transformed: TransformedActivity[] = [];
  const apiOwner: string = apiResponse?.data?.owner || "--";
  const bdOwner: string = apiResponse?.data?.bdOwner || "--";
  const isgOwner: string = apiResponse?.data?.isgOwner || "--";

  // Get roles from API response
  const roles = Object.keys(apiResponse?.data?.data || {});
  roles?.forEach((role) => {
    const roleActivities = apiResponse?.data?.data[role];

    // Only add planning if the role has activities (non-empty array)
    if (roleActivities && roleActivities.length > 0) {
      // Add planning for each role that has activities
      transformed.push({
        id: transformed.length,
        title: `${role} Planning`,
        type: "planning",
        config: [],
        opportunityActivityId: 0,
        isCoversRequired: false,
        activityOwner:
          role === "BD"
            ? bdOwner || apiOwner
            : role === "ISG"
            ? isgOwner || apiOwner
            : apiOwner,
        role: role,
      });
      roleActivities?.forEach((stage) => {
        stage?.activities?.forEach((activity: ApiActivity) => {
          let activityType = "normal";

          if (activity.activityKey === "broking_slip_activity") {
            activityType = "broking_slip_activity";
          } else if (activity.activityKey === "quote_entry_activity") {
            activityType = "quote_entry_activity";
          }
          transformed.push({
            // id: transformed.length,
            id: activity.activityId,
            title: activity.activityName,
            type: activityType,
            config: [],
            opportunityActivityId: activity.opportunityActivityId,
            isCoversRequired: activity?.isCoversRequired,
            activityDueDate: activity?.dueDate,
            activityOwner:
              role === "BD"
                ? bdOwner || activity?.owner || apiOwner
                : role === "ISG"
                ? isgOwner || activity?.owner || apiOwner
                : activity?.owner || apiOwner,
            activityParticipants: activity.participants
              ? activity.participants.map((p) => p.userName)
              : [],
            activityKey: activity.activityKey,
            activityApproval: activity?.activityApproval,
            opportunityActivityStatusKey: activity?.activityStatusKey || null,
            role: role, // Add role identifier
            activityStatus: activity?.activityStatus,
            isPlanned: activity?.isPlanned,
            isLost: activity?.isLost,
            isDocumentMandatory: activity?.isDocumentMandatory,
          });
        });
      });
    }
  });

  return transformed;
};

export const useTransformedActivities = () => {
  const { id: opportunityId } = useParams<{ id: string }>();
  const [transformedActivities, setTransformedActivities] = useState<
    TransformedActivity[]
  >([]);

  const { data, isLoading, isError } = useApiQuery({
    queryKey: ["opportunityId", opportunityId],
    url: endPoints.opportunityActivityByOppurtunityId(Number(opportunityId)),
    enabled: !!opportunityId,
  });

  useEffect(() => {
    if (data && !isLoading && !isError) {
      const transformed = transformActivities(data);
      setTransformedActivities(transformed);
    }
  }, [data, isLoading, isError]);

  return {
    transformedActivities,
    setTransformedActivities,
    isLoading,
    isError,
  };
};
