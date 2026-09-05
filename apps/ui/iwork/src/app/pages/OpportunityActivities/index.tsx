import React, { useEffect, useMemo, useRef } from "react";
import {
  endPoints,
  CommonAccordion,
  ChipRenderer,
  useApiQuery,
  useLookupIdByKey,
  formatDate,
  DATE_FORMATS,
  CustomTabsNoDataBox,
  CustomTabsNoDataText,
  NO_DATA_TO_SHOW,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { useSelector } from "react-redux";
import {
  TransformedActivity,
  useTransformedActivities,
} from "./Constants/activityConstants";
import {
  ChipTypography,
  HeadingContainer,
  SlipGenerationTypography,
  StyledAccordianContainer,
  CompletedTick,
  TitleStyles,
  VerticalDivider,
  ActivityIndexCircle,
  ActivityTitle,
  StyledErrorBoundary,
} from "./styles";
import { Theme, Typography, useTheme } from "@mui/material";
import { OpportunitycrmLeadStyleMap } from "../../components/OpportunityProgressStepper/opportunityCardTypes";
import CommonActivity from "./CommonActivities/CommonActivity";
import DataValidationActivity from "./CommonActivities/DataValidationActivity";
import KDMMeetingActivity from "./CommonActivities/KDMMeetingActivity";
import MandateDetailsActivity from "./CommonActivities/MandateDetailsActivity";
import FinalNegotiationAndPlacementSlipGenerationActivity from "./CommonActivities/FinalNegotiationActivity";
import HeldCoverNoteActivity from "./CommonActivities/HeldCoverNoteActivity";
import PolicyConfirmationActivity from "./CommonActivities/PolicyConfirmationActivity";
import PolicyHardCopyActivity from "./CommonActivities/PolicyHardCopyActivity";
import OpportunityPlanning from "./Activities/Planning";
import BrokingSlipGeneration from "./Activities/BrokingSlipGeneration";
import EnterQuote from "./Activities/EnterQuote";
import { LookUpValues } from "../../constants/lookupValues";
import { useLocation } from "react-router-dom";
import {
  APPROVED,
  BD_PLANNING,
  CLOSED,
  getRenewalAwareActivityLabel,
  ISG_PLANNING,
  OPPORTUNITIES_ACTIVITY_NO_DATA,
  PLANNED,
  SUBMITTED,
} from "../../constants";
import { filterActivitiesByRole } from "./Constants/activityRoleVisibility";
import { useScopedActivityRoleVisibility } from "../../Utils/useScopedActivityRoleVisibility";
import backgroundImage from "../../assets/webp/no-data-found-background-image.webp";
import CommonActivityV1 from "./CommonActivities/CommonActivityV1";
import BdToIsgHandoverBanner from "./CommonActivities/BdToIsgHandoverBanner";

interface OpportunityActivitiesProps {
  onAccordionToggle: (accordion: { id: number; title: string }) => void;
  setSubmittedBreadCumb: React.Dispatch<React.SetStateAction<number>>;
  submittedBreadCumb?: number;
  setIsOptyWorkInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOpportunityWon: React.Dispatch<React.SetStateAction<boolean>>;
  transformedActivities?: TransformedActivity[];
  setTransformedActivities?: React.Dispatch<
    React.SetStateAction<TransformedActivity[]>
  >;
  isActivitiesLoading?: boolean;
  isActivitiesError?: boolean;
}
const getRoleColors = (
  role: string,
  theme: Theme,
  allActivities: TransformedActivity[]
): string => {
  const uniqueRoles = [
    ...new Set(allActivities.map((activity) => activity.role).filter(Boolean)),
  ];
  const colorPairs = [
    {
      background: theme.palette.chips.senary,
      text: theme.palette.chips.senary,
    },
    {
      background: theme.palette.button.secondary,
      text: theme.palette.button.secondary,
    },
  ];
  const roleIndex = uniqueRoles.indexOf(role);
  return colorPairs[roleIndex % colorPairs.length];
};

const summaryData = (activity: TransformedActivity, isRenewal: boolean) => (
  <HeadingContainer>
    <SlipGenerationTypography data-testid="Accordion-title">
      {getRenewalAwareActivityLabel(activity.title, isRenewal)}
    </SlipGenerationTypography>
    {activity.type !== "planning" && (
      <Typography data-testid="Accordion-date">
        {activity?.activityDueDate
          ? `Plan date - ${formatDate(
              activity.activityDueDate,
              DATE_FORMATS.DATE_MONTH_YEAR
            )}`
          : "Not Planned Yet"}
      </Typography>
    )}
    <VerticalDivider />
    <ChipRenderer
      value={<ChipTypography>{activity.activityOwner || "--"}</ChipTypography>}
      styleMap={OpportunitycrmLeadStyleMap}
      size="small"
      variant="withImage"
      padding="8px"
    />
    {activity.title !== "Planning" && (
      <>
        {activity.activityParticipants &&
          activity.activityParticipants.length > 0 &&
          activity.activityParticipants.map((userName: string, idx: number) => (
            <ChipRenderer
              key={userName + idx}
              value={<ChipTypography>{userName}</ChipTypography>}
              styleMap={OpportunitycrmLeadStyleMap}
              size="small"
              variant="withImage"
              padding="8px"
            />
          ))}
      </>
    )}
  </HeadingContainer>
);

const OpportunityActivities: React.FC<OpportunityActivitiesProps> = ({
  onAccordionToggle = () => {},
  breadCumbSep,
  setBreadCumbStep,
  opportunityData,
  submittedBreadCumb,
  setSubmittedBreadCumb,
  setIsOptyWorkInProgress,
  setIsOpportunityWon,
  transformedActivities: externalActivities,
  setTransformedActivities: externalSetTransformedActivities,
  isActivitiesLoading,
  isActivitiesError,
}) => {
  const theme = useTheme();
  const isRenewal = opportunityData?.opportunityType?.lookUpValue === "RO";
  const accordionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [optyActivitiesState, setOptyActivitiesState] = React.useState<any>({});
  const {
    transformedActivities: internalActivities,
    setTransformedActivities: internalSetTransformedActivities,
    isLoading: internalIsLoading,
    isError: internalIsError,
  } = useTransformedActivities();

  const transformedActivities =
    externalActivities ?? internalActivities ?? [];
  const setTransformedActivities =
    externalSetTransformedActivities ?? internalSetTransformedActivities;
  const isLoading = isActivitiesLoading ?? internalIsLoading;
  const isError = isActivitiesError ?? internalIsError;

  const { canViewBD, canViewISG } = useScopedActivityRoleVisibility();

  // Hide activities belonging to a role the current user cannot view. Users with
  // both capability sets see everything (current behavior).
  const visibleActivities = useMemo(
    () => filterActivitiesByRole(transformedActivities, canViewBD, canViewISG),
    [transformedActivities, canViewBD, canViewISG]
  );

  // BD RFP Details Entry holds the BD -> ISG handover info. Keep a reference from
  // the unfiltered list so ISG-only users can still see it via the top banner.
  const bdHandoverActivity = transformedActivities.find(
    (activity: TransformedActivity) =>
      activity.activityKey === "rfp_details_entry_activity"
  );
  const showHandoverBanner = !canViewBD && canViewISG && !!bdHandoverActivity;

  const handleToggle = (activity, index) => {
    const isCurrentlyExpanded = breadCumbSep === index;
    setBreadCumbStep(isCurrentlyExpanded ? null : index); // Toggle logic

    if (!breadCumbSep || isCurrentlyExpanded) {
      onAccordionToggle({ activity });
    }
  };
  const { data: saveStatusData } = useApiQuery({
    queryKey: ["OpportunityStatusInProgress"],
    url: endPoints.lookUpByKey("OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS"),
  });

  const { data: submitStatusData } = useApiQuery({
    queryKey: ["OpportunityStatusSubmitted"],
    url: endPoints.lookUpByKey("OPPORTUNITY_ACTIVITY_STATUS_CLOSED"),
  });
  const { data: submitStatusDataForApproval } = useApiQuery({
    queryKey: ["OpportunityStatusSubmittedForApproval"],
    url: endPoints.lookUpByKey("OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED"),
  });
  const { data: approvedStatusData } = useApiQuery({
    queryKey: ["OpportunityStatusApprove"],
    url: endPoints.lookUpByKey("OPPORTUNITY_ACTIVITY_STATUS_APPROVED"),
  });
  const { data: rejectedStatusData } = useApiQuery({
    queryKey: ["OpportunityStatusRejected"],
    url: endPoints.lookUpByKey("OPPORTUNITY_ACTIVITY_STATUS_REJECTED"),
  });

  const { data: opportunityActivityStatus } = useApiQuery({
    queryKey: ["OpportunityActivityStatus"],
    url: endPoints.lookUpByName("OPPORTUNITY_ACTIVITY_STATUS"),
  });

  const location = useLocation().state;

  useEffect(() => {
    if (location?.accordionStep) {
      setBreadCumbStep(location.accordionStep);
    }

    if (location?.opportunities?.optyActivitiesState) {
      setOptyActivitiesState(location?.opportunities?.optyActivitiesState);
    }
  }, [location]);

  const handleApiCall = (values: any) => {
    // mutation.mutate({
    //   endpoint: endPoints.activityMeta,
    //   method: "POST",
    //   data: values,
    // });
  };

  useEffect(() => {
    if (
      breadCumbSep !== null &&
      accordionRefs.current[breadCumbSep] &&
      containerRef.current
    ) {
      // Wait for content to render
      const timeout = setTimeout(() => {
        const accordionElement = accordionRefs.current[breadCumbSep];
        const containerElement = containerRef.current;

        if (accordionElement && containerElement) {
          const accordionTop = accordionElement.offsetTop;
          const containerTop = containerElement.offsetTop;
          const scrollPosition = accordionTop - containerTop;

          containerElement.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [breadCumbSep]);

  const toggleNoId = useLookupIdByKey(LookUpValues.TOGGLE_TYPE_NO);
  const toggleYesId = useLookupIdByKey(LookUpValues.TOGGLE_TYPE_YES);
  const newMeetingId = useLookupIdByKey(
    LookUpValues.SELECT_MEETING_NEW_MEETING
  );
  const existingMeetingId = useLookupIdByKey(
    LookUpValues.SELECT_MEETING_EXISTING_MEETING
  );
  const existingKDM = useLookupIdByKey(LookUpValues.MEETING_TYPE_KDM);

  const existingFinalNegotiation = useLookupIdByKey(
    LookUpValues.MEETING_TYPE_FINAL_NEGOTIATION
  );
  const existingHandover = useLookupIdByKey(LookUpValues.MEETING_TYPE_HANDOVER);

  const existingChequePremium = useLookupIdByKey(
    LookUpValues.PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY
  );
  const existingChequePremiumAndCD = useLookupIdByKey(
    LookUpValues.PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD
  );

  const existingCDAccountToggleNew = useLookupIdByKey(
    LookUpValues.CD_ACCOUNT_TOGGLE_NEW
  );

  //CD_ACCOUNT_TOGGLE_EXISTING
  const existingCDAccountToggleExisting = useLookupIdByKey(
    LookUpValues.CD_ACCOUNT_TOGGLE_EXISTING
  );

  //MULTIPLE_INSURER
  const multipleInsurer = useLookupIdByKey(LookUpValues.MULTIPLE_INSURER);

  //SINGLE_INSURER
  const singleInsurer = useLookupIdByKey(LookUpValues.SINGLE_INSURER);

  // COMPENSATION_TYPE_BROKERAGE
  const brokerageFeeId = useLookupIdByKey(
    LookUpValues.COMPENSATION_TYPE_BROKERAGE
  );

  const insurerTypeLead = useLookupIdByKey(
    LookUpValues.INSURER_PARTICIPATION_TYPE_LEAD
  );
  const insurerTypeCo = useLookupIdByKey(
    LookUpValues.INSURER_PARTICIPATION_TYPE_CO
  );

  const renderActivity = (activity: TransformedActivity, isLost: boolean) => {
    switch (activity.type) {
      case "normal":
        if (
          activity.activityKey === "final_negotiation_activity" ||
          activity.activityKey === "placement_slip_generation_activity"
        ) {
        return (
          <FinalNegotiationAndPlacementSlipGenerationActivity
            onSubmit={handleApiCall}
            key={activity.activityKey}
            optyActivitiesState={optyActivitiesState}
            setOptyActivitiesState={setOptyActivitiesState}
            openAccordionByActivityKey={openAccordionByActivityKey}
            setTransformedActivities={setTransformedActivities}
            dynamicValues={{
              companyId: opportunityData?.company?.id,
              opportunityActivityId: activity.opportunityActivityId,
                breadCumbSep,
                companyName: opportunityData?.company?.companyName || "",
                opportunityId: opportunityData?.opportunityId,
                soCreatedDate: opportunityData?.soCreatedDate,
                expiryDate: opportunityData?.expiryDate,
                TOGGLE_NO: toggleNoId,
                TOGGLE_YES: toggleYesId,
                SELECT_MEETING_NEW_MEETING: newMeetingId,
                SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
                MEETING_TYPE_KDM: existingKDM,
                MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
                MEETING_TYPE_HANDOVER: existingHandover,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD:
                  existingChequePremiumAndCD,
                CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
                CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
                POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
                POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
                COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
                INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
                INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
              }}
              activity={activity}
              setBreadCumbStep={setBreadCumbStep}
              breadCumbSep={breadCumbSep}
              saveStatusData={saveStatusData}
              submitStatusData={submitStatusData}
              setSubmittedBreadCumb={setSubmittedBreadCumb}
              opportunityActivityStatus={opportunityActivityStatus?.data || []}
              submitStatusDataForApproval={submitStatusDataForApproval}
              approvedStatusData={approvedStatusData}
              rejectedStatusData={rejectedStatusData}
              Role={activity.role} // Pass role to activity component
              isLost={isLost} // Pass isLost status to activity component
              setIsOptyWorkInProgress={setIsOptyWorkInProgress}
              setIsOpportunityWon={setIsOpportunityWon}
            />
          );
        }
        if (activity.activityKey === "held_cover_note_activity") {
          return (
            <HeldCoverNoteActivity
              onSubmit={handleApiCall}
              key={activity.activityKey}
              optyActivitiesState={optyActivitiesState}
              setOptyActivitiesState={setOptyActivitiesState}
              dynamicValues={{
                companyId: opportunityData?.company?.id,
                opportunityActivityId: activity.opportunityActivityId,
                breadCumbSep,
                companyName: opportunityData?.company?.companyName || "",
                opportunityId: opportunityData?.opportunityId,
                TOGGLE_NO: toggleNoId,
                TOGGLE_YES: toggleYesId,
                SELECT_MEETING_NEW_MEETING: newMeetingId,
                SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
                MEETING_TYPE_KDM: existingKDM,
                MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
                MEETING_TYPE_HANDOVER: existingHandover,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD:
                  existingChequePremiumAndCD,
                CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
                CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
                POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
                POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
                COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
                INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
                INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
              }}
              activity={activity}
              setBreadCumbStep={setBreadCumbStep}
              breadCumbSep={breadCumbSep}
              saveStatusData={saveStatusData}
              submitStatusData={submitStatusData}
              setSubmittedBreadCumb={setSubmittedBreadCumb}
              opportunityActivityStatus={opportunityActivityStatus?.data || []}
              submitStatusDataForApproval={submitStatusDataForApproval}
              approvedStatusData={approvedStatusData}
              rejectedStatusData={rejectedStatusData}
              Role={activity.role} // Pass role to activity component
              isLost={isLost} // Pass isLost status to activity component
              setIsOptyWorkInProgress={setIsOptyWorkInProgress}
              setIsOpportunityWon={setIsOpportunityWon}
            />
          );
        }
        if (activity.activityKey === "policy_hard_copy_activity") {
          return (
            <PolicyHardCopyActivity
              onSubmit={handleApiCall}
              key={activity.activityKey}
              optyActivitiesState={optyActivitiesState}
              setOptyActivitiesState={setOptyActivitiesState}
              dynamicValues={{
                companyId: opportunityData?.company?.id,
                opportunityActivityId: activity.opportunityActivityId,
                breadCumbSep,
                companyName: opportunityData?.company?.companyName || "",
                opportunityId: opportunityData?.opportunityId,
                TOGGLE_NO: toggleNoId,
                TOGGLE_YES: toggleYesId,
                SELECT_MEETING_NEW_MEETING: newMeetingId,
                SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
                MEETING_TYPE_KDM: existingKDM,
                MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
                MEETING_TYPE_HANDOVER: existingHandover,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD:
                  existingChequePremiumAndCD,
                CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
                CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
                POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
                POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
                COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
                INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
                INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
              }}
              activity={activity}
              setBreadCumbStep={setBreadCumbStep}
              breadCumbSep={breadCumbSep}
              saveStatusData={saveStatusData}
              submitStatusData={submitStatusData}
              setSubmittedBreadCumb={setSubmittedBreadCumb}
              opportunityActivityStatus={opportunityActivityStatus?.data || []}
              submitStatusDataForApproval={submitStatusDataForApproval}
              approvedStatusData={approvedStatusData}
              rejectedStatusData={rejectedStatusData}
              Role={activity.role} // Pass role to activity component
              isLost={isLost} // Pass isLost status to activity component
              setIsOptyWorkInProgress={setIsOptyWorkInProgress}
              setIsOpportunityWon={setIsOpportunityWon}
            />
          );
        }
        if (activity.activityKey === "policy_confirmation_activity") {
          return (
            <PolicyConfirmationActivity
              onSubmit={handleApiCall}
              key={activity.activityKey}
              optyActivitiesState={optyActivitiesState}
              setOptyActivitiesState={setOptyActivitiesState}
              dynamicValues={{
                companyId: opportunityData?.company?.id,
                opportunityActivityId: activity.opportunityActivityId,
                breadCumbSep,
                companyName: opportunityData?.company?.companyName || "",
                opportunityId: opportunityData?.opportunityId,
                TOGGLE_NO: toggleNoId,
                TOGGLE_YES: toggleYesId,
                SELECT_MEETING_NEW_MEETING: newMeetingId,
                SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
                MEETING_TYPE_KDM: existingKDM,
                MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
                MEETING_TYPE_HANDOVER: existingHandover,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
                PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD:
                  existingChequePremiumAndCD,
                CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
                CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
                POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
                POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
                COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
                INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
                INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
              }}
              activity={activity}
              setBreadCumbStep={setBreadCumbStep}
              breadCumbSep={breadCumbSep}
              saveStatusData={saveStatusData}
              submitStatusData={submitStatusData}
              setSubmittedBreadCumb={setSubmittedBreadCumb}
              opportunityActivityStatus={opportunityActivityStatus?.data || []}
              submitStatusDataForApproval={submitStatusDataForApproval}
              approvedStatusData={approvedStatusData}
              rejectedStatusData={rejectedStatusData}
              Role={activity.role} // Pass role to activity component
              isLost={isLost} // Pass isLost status to activity component
              setIsOptyWorkInProgress={setIsOptyWorkInProgress}
              setIsOpportunityWon={setIsOpportunityWon}
            />
          );
        }
        // if (
        //   [
        //     "data_validation_activity",
        //     "kdm_meeting_activity",
        //     "mandate_details_entry_activity",
        //     "rfp_cover_detail_activity",
        //     "hand_over_meet_activity",
        //     "quote_comparison_report_activity",
        //     "premium_calculation_activity",
        //     "rfp_details_entry_activity",
        //     "policy_docket_activity",
        //   ].includes(activity?.activityKey)
        // ) {
        return (
          <CommonActivityV1
            onSubmit={handleApiCall}
            key={activity.activityKey}
            optyActivitiesState={optyActivitiesState}
            setOptyActivitiesState={setOptyActivitiesState}
            dynamicValues={{
              companyId: opportunityData?.company?.id,
              opportunityActivityId: activity.opportunityActivityId,
              breadCumbSep,
              companyName: opportunityData?.company?.companyName || "",
              opportunityId: opportunityData?.opportunityId,
              TOGGLE_NO: toggleNoId,
              TOGGLE_YES: toggleYesId,
              SELECT_MEETING_NEW_MEETING: newMeetingId,
              SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
              MEETING_TYPE_KDM: existingKDM,
              MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
              MEETING_TYPE_HANDOVER: existingHandover,
              PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
              PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD: existingChequePremiumAndCD,
              CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
              CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
              POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
              POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
              COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
              INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
              INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
            }}
            activity={activity}
            setBreadCumbStep={setBreadCumbStep}
            breadCumbSep={breadCumbSep}
            saveStatusData={saveStatusData}
            submitStatusData={submitStatusData}
            setSubmittedBreadCumb={setSubmittedBreadCumb}
            opportunityActivityStatus={opportunityActivityStatus?.data || []}
            submitStatusDataForApproval={submitStatusDataForApproval}
            approvedStatusData={approvedStatusData}
            rejectedStatusData={rejectedStatusData}
            Role={activity.role} // Pass role to activity component
            isLost={isLost} // Pass isLost status to activity component
            setIsOptyWorkInProgress={setIsOptyWorkInProgress}
            setIsOpportunityWon={setIsOpportunityWon}
          />
        );
      // }
      // return (
      //   <CommonActivity
      //     onSubmit={handleApiCall}
      //     key={activity.activityKey}
      //     optyActivitiesState={optyActivitiesState}
      //     setOptyActivitiesState={setOptyActivitiesState}
      //     dynamicValues={{
      //       companyId: opportunityData?.company?.id,
      //       opportunityActivityId: activity.opportunityActivityId,
      //       breadCumbSep,
      //       companyName: opportunityData?.company?.companyName || "",
      //       opportunityId: opportunityData?.opportunityId,
      //       TOGGLE_NO: toggleNoId,
      //       TOGGLE_YES: toggleYesId,
      //       SELECT_MEETING_NEW_MEETING: newMeetingId,
      //       SELECT_MEETING_EXISTING_MEETING: existingMeetingId,
      //       MEETING_TYPE_KDM: existingKDM,
      //       MEETING_TYPE_FINAL_NEGOTIATION: existingFinalNegotiation,
      //       MEETING_TYPE_HANDOVER: existingHandover,
      //       PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY: existingChequePremium,
      //       PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD: existingChequePremiumAndCD,
      //       CD_ACCOUNT_TOGGLE_NEW: existingCDAccountToggleNew,
      //       CD_ACCOUNT_TOGGLE_EXISTING: existingCDAccountToggleExisting,
      //       POLICY_PLACED_TYPE_SINGLE_INSURER: singleInsurer,
      //       POLICY_PLACED_TYPE_MULTIPLE_INSURER: multipleInsurer,
      //       COMPENSATION_BROKERAGE_TYPE: brokerageFeeId,
      //       INSURER_PARTICIPATION_TYPE_LEAD: insurerTypeLead,
      //       INSURER_PARTICIPATION_TYPE_CO: insurerTypeCo,
      //     }}
      //     activity={activity}
      //     setBreadCumbStep={setBreadCumbStep}
      //     breadCumbSep={breadCumbSep}
      //     saveStatusData={saveStatusData}
      //     submitStatusData={submitStatusData}
      //     setSubmittedBreadCumb={setSubmittedBreadCumb}
      //     opportunityActivityStatus={opportunityActivityStatus?.data || []}
      //     submitStatusDataForApproval={submitStatusDataForApproval}
      //     approvedStatusData={approvedStatusData}
      //     rejectedStatusData={rejectedStatusData}
      //     Role={activity.role} // Pass role to activity component
      //     isLost={isLost} // Pass isLost status to activity component
      //     setIsOptyWorkInProgress={setIsOptyWorkInProgress}
      //     setIsOpportunityWon={setIsOpportunityWon}
      //   />
      // );
      case "broking_slip_activity":
        return (
          <BrokingSlipGeneration
            setBreadCumbStep={setBreadCumbStep}
            saveStatusData={saveStatusData}
            submitStatusData={submitStatusData}
            breadCumbSep={breadCumbSep}
            setSubmittedBreadCumb={setSubmittedBreadCumb}
            activity={activity}
            opportunityActivityStatus={opportunityActivityStatus?.data || []}
            submitStatusDataForApproval={submitStatusDataForApproval}
            approvedStatusData={approvedStatusData}
            rejectedStatusData={rejectedStatusData}
            Role={activity.role}
            isLost={isLost} // Pass isLost status to activity component
            dynamicValues={{
              companyId: opportunityData?.company?.id,
              sumInsured: opportunityData?.sumInsured || 0,
            }}
          />
        );
      case "quote_entry_activity":
        return (
          <EnterQuote
            activity={activity}
            saveStatusData={saveStatusData}
            submitStatusData={submitStatusData}
            breadCumbSep={breadCumbSep}
            setSubmittedBreadCumb={setSubmittedBreadCumb}
            setBreadCumbStep={setBreadCumbStep}
            opportunityActivityStatus={opportunityActivityStatus?.data || []}
            Role={activity.role}
            isLost={isLost} // Pass isLost status to activity component
            dynamicValues={{
              companyId: opportunityData?.company?.id,
              opportunityId: opportunityData?.opportunityId,
            }}
          />
        );
      default:
        return (
          <OpportunityPlanning
            key={breadCumbSep}
            setBreadCumbStep={setBreadCumbStep}
            breadCumbSep={breadCumbSep}
            setSubmittedBreadCumb={setSubmittedBreadCumb}
            opportunityData={opportunityData}
            role={activity.role} // Pass role to planning component
            onPlanningUpdate={handlePlanningUpdate}
            isLost={isLost}
          />
        );
    }
  };

  const openAccordionByActivityKey = (activityKey: string) => {
    const targetIndex = visibleActivities.findIndex(
      (activity: TransformedActivity) => activity.activityKey === activityKey
    );

    if (targetIndex >= 0) {
      setBreadCumbStep(targetIndex);
    }
  };
  const handlePlanningUpdate = (
    updatedActivities: {
      opportunityActivityId: number;
      dueDate: string;
      participants: string[];
    }[]
  ) => {
    setTransformedActivities((prev) =>
      prev.map((activity) => {
        const updated = updatedActivities.find(
          (ua) => ua.opportunityActivityId === activity.opportunityActivityId
        );
        return updated
          ? {
              ...activity,
              activityDueDate: updated.dueDate,
              activityParticipants: updated.participants,
            }
          : activity;
      })
    );
  };

  const isLost = visibleActivities?.some(
    (activity: TransformedActivity) => activity.isLost === true
  );

  const lastIndex = visibleActivities?.findLastIndex(
    (activity: TransformedActivity) =>
      activity?.activityStatus === CLOSED ||
      activity?.activityStatus === APPROVED ||
      activity?.activityStatus === SUBMITTED
  );

  const BD_PLANNING_INDEX = visibleActivities?.findIndex(
    (activity: TransformedActivity) => activity.title === BD_PLANNING
  );
  const ISG_PLANNING_INDEX = visibleActivities?.findIndex(
    (activity: TransformedActivity) => activity.title === ISG_PLANNING
  );

  const isBDPlanningCompleted: boolean = visibleActivities?.some(
    (activity: TransformedActivity) => activity.isPlanned === PLANNED
  );
  const isISGCompleted: boolean = visibleActivities
    ?.slice(ISG_PLANNING_INDEX, visibleActivities.length)
    .some((activity: TransformedActivity) => activity.isPlanned === PLANNED);

  const firstPlanningIndex =
    BD_PLANNING_INDEX !== -1 ? BD_PLANNING_INDEX : ISG_PLANNING_INDEX;

  const canApproveBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state)
  );
  const canApproveISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state)
  );

  // An approval activity goes to SUBMITTED and the lastIndex logic advances the
  // submitter past it. The approver, however, must land ON the activity awaiting
  // their sign-off, not the next one. Match the submitted activity's role to the
  // current user's approval permission.
  const approverPendingIndex = visibleActivities?.findIndex(
    (activity: TransformedActivity) =>
      activity.activityStatus === SUBMITTED &&
      ((activity.role === "BD" && canApproveBD) ||
        (activity.role === "ISG" && canApproveISG))
  );

  const initialBreadCumb =
    approverPendingIndex >= 0
      ? approverPendingIndex
      : lastIndex === -1 && isBDPlanningCompleted
      ? firstPlanningIndex + 1
      : lastIndex === ISG_PLANNING_INDEX - 1 && isISGCompleted
      ? ISG_PLANNING_INDEX + 1
      : lastIndex + 1;

  useEffect(() => {
    if (initialBreadCumb !== null) {
      if (initialBreadCumb === visibleActivities.length) {
        setBreadCumbStep(visibleActivities.length - 1);
      } else {
        setBreadCumbStep(initialBreadCumb);
      }
    }
  }, [initialBreadCumb, visibleActivities.length]);

  if (isLoading) {
    return <StyledErrorBoundary>Loading activities...</StyledErrorBoundary>;
  }

  if (isError) {
    return (
      <CustomTabsNoDataBox>
        <img src={backgroundImage} alt="error" />
        <CustomTabsNoDataText>
          {OPPORTUNITIES_ACTIVITY_NO_DATA}
        </CustomTabsNoDataText>
      </CustomTabsNoDataBox>
    );
  }

  return (
    <StyledAccordianContainer ref={containerRef}>
      {showHandoverBanner && bdHandoverActivity && (
        <BdToIsgHandoverBanner
          opportunityActivityId={bdHandoverActivity.opportunityActivityId}
        />
      )}
      {visibleActivities.map((activity, index) => {
        // Number + role color use the ORIGINAL position/role ordering from the full
        // list so a single-role view keeps the same step numbers and colors as the
        // unfiltered view (e.g. ISG stays its original numbers and blue). Expand /
        // scroll still use the visible `index`.
        const displayNumber = transformedActivities.indexOf(activity) + 1;
        // The flow is sequential: everything before the next actionable
        // activity is done, the one at it is ongoing. initialBreadCumb is
        // derived from fetched statuses; submittedBreadCumb advances on
        // submits made this session, before any refetch (same source the
        // top stepper uses to move without a refresh).
        const currentActivityIndex = Math.max(
          initialBreadCumb,
          submittedBreadCumb ?? 0
        );
        const isCompleted = index < currentActivityIndex;
        const isCurrent = index === currentActivityIndex;
        return (
        <div
          key={activity.id}
          ref={(el) => (accordionRefs.current[index] = el)}
          data-testid="Root-accordion"
        >
          <CommonAccordion
            key={activity.id}
            customStyles={{
              accordion: isCurrent
                ? {
                    borderLeft: `4px solid ${theme.palette.chips.senary}`,
                  }
                : undefined,
            }}
            summary={summaryData(activity, isRenewal)}
            details={
              breadCumbSep === index ? renderActivity(activity, isLost) : null
            }
            expanded={breadCumbSep === index}
            onToggle={() => handleToggle(activity, index)}
            title={
              <TitleStyles data-testid="Accordion-title">
                <ActivityIndexCircle
                  $bgcolor={
                    getRoleColors(activity.role, theme, transformedActivities)
                      .background
                  }
                  $color={
                    getRoleColors(activity.role, theme, transformedActivities)
                      .text
                  }
                  data-testid="activity-index-circle"
                  aria-label={`Activity index ${displayNumber}`}
                >
                  {displayNumber}
                </ActivityIndexCircle>
                <ActivityTitle data-testid="Accordion-title">
                  {getRenewalAwareActivityLabel(activity.title, isRenewal)}
                </ActivityTitle>
                {isCompleted && (
                  <CompletedTick data-testid="activity-completed-tick" />
                )}
              </TitleStyles>
            }
          />
        </div>
        );
      })}
    </StyledAccordianContainer>
  );
};
export default OpportunityActivities;
