import React, { useEffect, useState } from "react";
import { ContentWrapper, OpportunityStepperWrapper } from "./styles";
import Breadcrumbs from "./OpportunityStepperBreadCrumb/index.js";
import ProgressBar from "./OpportunityLineProgress/index.js";
import { OpportunityHeaderDetails } from "./opportunityCardTypes";
import OpportunityProgressHeader from "./OpportunityProgessHeader";
import {
  APPROVED,
  BD_PLANNING,
  CLOSED,
  EXTEND,
  EXTEND_VALIDITY,
  ISG_PLANNING,
  OPPORTUNITY_MILESTONE,
  PLANNED,
} from "../../constants";
import { TransformedActivity } from "../../pages/OpportunityActivities/Constants/activityConstants";
import CustomModal from "@ui/ui-lib/commonComponents/Modal";
import { UseFormReturn } from "react-hook-form";
import { defaultFormValues, expiryDateFieldConfig } from "./formConfig";
import { DynamicForm } from "@ui/ui-lib/commonComponents";
import { useApiMutation } from "@ui/ui-lib/hooks";
import { endPoints, httpMethods } from "@ui/ui-lib/constants";

interface OpportunityCardProps {
  startDate?: string;
  endDate?: string;
  milestones?: any;
  opportunityDetails: OpportunityHeaderDetails;
  breadCumbSep: number;
  setBreadCumbStep: React.Dispatch<React.SetStateAction<number>>;
  crmLead?: string;
  submittedBreadCumb?: number;
  setSubmittedBreadCumb: React.Dispatch<React.SetStateAction<number>>;
  isOpportunityLost?: boolean;
  setIsOpportunityLost: React.Dispatch<React.SetStateAction<boolean>>;
  isOpportunityWon?: boolean;
  isOptyWorkInProgress?: boolean;
  transformedActivities: TransformedActivity[];
  isActivitiesLoading?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  startDate = "2023-10-01",
  endDate = "2023-10-31",
  milestones = OPPORTUNITY_MILESTONE,
  opportunityDetails,
  breadCumbSep,
  setBreadCumbStep,
  crmLead = "CRM Lead",
  submittedBreadCumb,
  setSubmittedBreadCumb,
  isOpportunityLost = false,
  setIsOpportunityLost,
  isOpportunityWon = false,
  isOptyWorkInProgress = false,
  transformedActivities,
  isActivitiesLoading = false,
}) => {
  const lastIndex = transformedActivities?.findLastIndex(
    (activity: TransformedActivity) =>
      activity.activityStatus === CLOSED || activity.activityStatus === APPROVED
  );
  const BD_PLANNING_INDEX = transformedActivities?.findIndex(
    (activity: TransformedActivity) => activity.title === BD_PLANNING
  );
  const ISG_PLANNING_INDEX = transformedActivities?.findIndex(
    (activity: TransformedActivity) => activity.title === ISG_PLANNING
  );

  const isBDPlanningCompleted: boolean = transformedActivities?.some(
    (activity: TransformedActivity) => activity.isPlanned === PLANNED
  );
  const isISGCompleted: boolean = transformedActivities
    ?.slice(ISG_PLANNING_INDEX, transformedActivities.length)
    .some((activity: TransformedActivity) => activity.isPlanned === PLANNED);

  const firstPlanningIndex =
    BD_PLANNING_INDEX !== -1 ? BD_PLANNING_INDEX : ISG_PLANNING_INDEX;

  const currentActivity =
    lastIndex === -1 && isBDPlanningCompleted
      ? firstPlanningIndex + 1
      : lastIndex === ISG_PLANNING_INDEX - 1 && isISGCompleted
      ? ISG_PLANNING_INDEX + 1
      : lastIndex + 1;
  const activeBreadcrumb =
    (submittedBreadCumb ?? 0) > currentActivity
      ? submittedBreadCumb
      : currentActivity;

  const nonPlanningActivities =
    transformedActivities?.filter(
      (activity: TransformedActivity) =>
        activity.title !== BD_PLANNING && activity.title !== ISG_PLANNING
    ) || [];

  const completedNonPlanningCount =
    transformedActivities
      ?.slice(0, activeBreadcrumb)
      .filter(
        (activity: TransformedActivity) =>
          activity.title !== BD_PLANNING && activity.title !== ISG_PLANNING
      )?.length || 0;

  const totalNonPlanningCount = nonPlanningActivities.length;

  const currentProgress =
    activeBreadcrumb >= transformedActivities.length
      ? 100
      : totalNonPlanningCount > 0
      ? Math.floor((completedNonPlanningCount / totalNonPlanningCount) * 100)
      : 0;

  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>(
    opportunityDetails.expiryDate
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>();

  const [formMethods, setFormMethods] =
    useState<UseFormReturn<{ expiryDate: string }>>();

  const { mutate, isLoading: isMutating } = useApiMutation({});
  const endPoint = endPoints.extendOpportunity(
    opportunityDetails.opportunityId
  );
  useEffect(() => {
    setExpiryDate(opportunityDetails?.expiryDate);
    setStatus(opportunityDetails?.opportunityStatus);
  }, [opportunityDetails?.expiryDate, opportunityDetails?.opportunityStatus]);

  const onSubmit = (data: { expiryDate: string }) => {
    setModalError(null);

    if (!data.expiryDate) {
      setModalError("Expiry date is required.");
      return;
    }

    mutate(
      {
        endpoint: endPoint,
        method: httpMethods.PUT,
        data: { expiryDate: data.expiryDate },
      },
      {
        onSuccess: (res: any) => {
          const payload = res?.data ?? res;

          const newExpiry = payload?.expiryDate ?? data.expiryDate;
          const newStatus = payload?.status?.lookUpValue ?? status;
          setExpiryDate(newExpiry);
          if (newStatus) setStatus(newStatus);

          setExpiryModalOpen(false);
          setIsOpportunityLost(false);
        },
        onError: (err: any) => {
          setModalError(err?.message || "Failed to extend validity");
        },
      }
    );
  };

  if (isActivitiesLoading) {
    return <div>Loading...</div>;
  }

  const isOpportunityFromApiLost =
    status?.toLowerCase() === "lost" || isOpportunityLost ? true : false;

  const modalHeading = isOpportunityFromApiLost
    ? `Re-open lost ${opportunityDetails?.opportunityType ?? "SO"}`
    : EXTEND + ` ${opportunityDetails?.opportunityType ?? "SO"}`;

  const updatedOpportunityDetails = {
    ...opportunityDetails,
    expiryDate,
    opportunityStatus: status,
  };
  return (
    <OpportunityStepperWrapper>
      <OpportunityProgressHeader
        opportunityDetails={updatedOpportunityDetails}
        isOpportunityLost={isOpportunityLost}
        isOpportunityWon={isOpportunityWon}
        isOptyWorkInProgress={isOptyWorkInProgress}
        onEditExpiryDate={() => setExpiryModalOpen(true)}
      />
      <ContentWrapper>
        <ProgressBar
          progress={currentProgress}
          startDate={startDate}
          endDate={endDate}
        />
        <Breadcrumbs
          crumbs={transformedActivities}
          flag={activeBreadcrumb}
          setBreadCumbStep={setBreadCumbStep}
          isOpportunityLost={isOpportunityFromApiLost}
          opportunityDetails={updatedOpportunityDetails}
        />
      </ContentWrapper>
      <CustomModal
        open={expiryModalOpen}
        handleClose={() => setExpiryModalOpen(false)}
        heading={modalHeading}
        buttons={[
          {
            label: EXTEND_VALIDITY,
            variant: "primary",
            onClick: () => formMethods?.handleSubmit(onSubmit)(),
            disabled: isMutating,
          },
        ]}
        headingStyles={{
          fontWeight: 500,
          color: "#111111",
        }}
        modalBoxStyles={{
          width: "30%",
        }}
      >
        <DynamicForm
          formConfig={expiryDateFieldConfig}
          defaultValues={defaultFormValues}
          formMethods={setFormMethods}
        />
        {modalError && (
          <div style={{ color: "red", marginTop: 8 }}>{modalError}</div>
        )}
      </CustomModal>
    </OpportunityStepperWrapper>
  );
};

export default OpportunityCard;
