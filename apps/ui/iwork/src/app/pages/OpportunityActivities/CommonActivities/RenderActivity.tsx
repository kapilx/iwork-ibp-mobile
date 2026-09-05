import { NestedDynamicForm } from "@ui/ui-lib";
import DataValidationActivity from "./DataValidationActivity";
import KDMMeetingActivity from "./KDMMeetingActivity";
import MandateDetailsActivity from "./MandateDetailsActivity";
import RFPDataCollectionActivity from "./RFPDataCollection";
import QuoteComparisionActivity from "./QuoteComparisionActivity";
import PremiumCalculationActivity from "./PremiumCalculation";
import RFPDetailsEntryActivity from "./RFPDetailsEntryActivity";
import PolicyDocketActivity from "./PolicyDocketActivity";

export interface ActivityProps {
  // Form props
  config: any;
  formRef: React.RefObject<any>;
  actionMap: Record<string, Function>;
  dynamicValues: Record<string, any>;

  // Activity info
  activity: any;

  // State flags
  disableAllFormFields: boolean;
  // isFormDisabled: boolean;
  // canEditActivity: boolean;
  // isActivitySubmitForApprovalStatus: boolean;
  opportunityInitialStatus: string;

  // Data
  getActivityData: any;
  latestValuesRef: React.MutableRefObject<Record<string, any>>;
  optyActivitiesState: any;
  activityMetaData?: any;
  userOrganisationKey?: string;
  currActivityDataFromGlobalState?: any;
}

export const renderActivityBasedOnActivityKey = (
  activityKey: string | undefined,
  resolvedConfig: any,
  formRef: any,
  actionMap: any,
  dynamicValues: any,
  activity: any,
  isFormDisabled: boolean,
  canEditActivity: boolean,
  isActivitySubmitForApprovalStatus: boolean,
  opportunityInitialStatus: string,
  getActivityData: any,
  latestValuesRef: any,
  optyActivitiesState: any,
  setValidationStep: any,
  validationStep: any,
  activityMetaData: any,
  userOrganisationKey: string,
  currActivityDataFromGlobalState: any
) => {
  const disableAllFormFields =
    isFormDisabled || !canEditActivity || isActivitySubmitForApprovalStatus;

  switch (activityKey) {
    case "data_validation_activity":
      return (
        <DataValidationActivity
          // Form-related props
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          setValidationStep={setValidationStep}
          validationStep={validationStep}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    case "kdm_meeting_activity":
    case "hand_over_meet_activity":
      return (
        <KDMMeetingActivity
          // Form-related props
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    case "mandate_details_entry_activity":
      return (
        <MandateDetailsActivity
          // Form-related props
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
        />
      );

    case "rfp_cover_detail_activity":
      return (
        <RFPDataCollectionActivity
          // Form-related props
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
        />
      );

    case "quote_comparison_report_activity":
      return (
        <QuoteComparisionActivity
          // Form-related props
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    case "premium_calculation_activity":
      return (
        <PremiumCalculationActivity
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    case "rfp_details_entry_activity":
      return (
        <RFPDetailsEntryActivity
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    case "policy_docket_activity":
      return (
        <PolicyDocketActivity
          config={resolvedConfig}
          formRef={formRef}
          actionMap={actionMap}
          dynamicValues={dynamicValues}
          // Activity info
          activity={activity}
          // State flags
          disableAllFormFields={disableAllFormFields}
          opportunityInitialStatus={opportunityInitialStatus}
          // Data
          getActivityData={getActivityData}
          latestValuesRef={latestValuesRef}
          optyActivitiesState={optyActivitiesState}
          activityMetaData={activityMetaData}
          userOrganisationKey={userOrganisationKey}
        />
      );

    default:
      return null;
  }
};
