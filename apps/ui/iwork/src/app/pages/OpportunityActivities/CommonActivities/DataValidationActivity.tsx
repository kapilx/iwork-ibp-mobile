import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FeatureKey,
  NestedDynamicForm,
  normalizeApiDataForResetting,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import {
  DATA_VALIDATION_LABEL,
  COMPANY_VALIDATION_LABEL,
  OPPORTUNITY_VALIDATION_LABEL,
} from "../../../constants";
import { ValidateButton, ValidationButtonContainer } from "./styles";
import { ActivityProps } from "./RenderActivity";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";

type ValidationStep = "initial" | "validated";

type ValidationSteps = {
  company: ValidationStep;
  opportunity: ValidationStep;
};

interface DataValidationProps extends ActivityProps {
  setValidationStep: React.Dispatch<React.SetStateAction<ValidationSteps>>;
  validationStep: ValidationSteps;
}
const DataValidationActivity: React.FC<DataValidationProps> = ({
  config,
  formRef,
  actionMap,
  dynamicValues,
  activity,
  disableAllFormFields,
  // isFormDisabled,
  // canEditActivity,
  // isActivitySubmitForApprovalStatus,
  opportunityInitialStatus,
  getActivityData,
  latestValuesRef,
  optyActivitiesState,
  setValidationStep,
  validationStep,
  activityMetaData,
  userOrganisationKey,
}) => {
  const { id: opportunityId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

  const resolvedConfig = React.useMemo(() => {
    if (!activity?.activityKey) return [];

    const activityMeta = getActivityConfig(
      activity.activityKey,
      latestValuesRef.current,
      dynamicValues,
      userOrganisationKey
    );
    const baseConfig = parseApiConfigToLocalFormConfig(
      activityMeta,
      dynamicValues
    );

    const documents = getActivityData?.data?.dataActivity?.documents || [];
    const coversConfig = activityMetaData?.coversConfig || [];
    const coversDefaultValues = activityMetaData?.coversPrefillData || {};

    const enhancedConfig = baseConfig.map((group: any) => {
      let finalGroup = { ...group };

      // Replace config if covers are required
      if (group?.isCoversRequired) {
        finalGroup = {
          ...finalGroup,
          config: coversConfig,
          defaultValues: coversDefaultValues,
        };
      }

      // Inject documents into all documentupload fields
      if (Array.isArray(finalGroup.config)) {
        finalGroup.config = finalGroup.config.map((field: any) => {
          if (field.type === "documentupload") {
            return {
              ...field,
              opportunityId,
              opportunityActivityId: activity.opportunityActivityId,
              componentProps: {
                ...(field.componentProps || {}),
                documents,
                isDownloadAllowed: isExportAllowed,
                isDocumentRequired: activity.isDocumentMandatory ?? field.componentProps?.isDocumentRequired,
                isDocumentTypeRequired: activity.isDocumentMandatory ?? field.componentProps?.isDocumentTypeRequired,
              },
            };
          }
          return field;
        });
      }

      return finalGroup;
    });

    return enhancedConfig;
  }, [activityMetaData, dynamicValues, getActivityData, isExportAllowed, activity.isDocumentMandatory]);

  useEffect(() => {
    if (formRef && getActivityData?.data) {
      const normalizedData = normalizeApiDataForResetting(
        getActivityData.data?.dataActivity
      );

      formRef?.current?.resetForms(normalizedData);
    }
  }, [getActivityData?.data, formRef]);

  const companyId = dynamicValues.companyId;

  // Helper to get current activity state
  const getOptyActivityState = () => {
    return {
      ...optyActivitiesState,
      [activity?.activityKey]: {
        key: activity?.activityKey,
        data: latestValuesRef.current,
      },
    };
  };

  // Validation handlers
  const validateCompany = () => {
    const activityStep = dynamicValues.breadCumbSep;
    navigate(`/companies/${companyId}/edit`, {
      state: {
        company: {
          from: location.pathname,
          to: `/companies/${companyId}/edit`,
          validationMode: true,
          opportunityId,
          companyId,
          activityStep,
          validationStep: validationStep,
          optyActivitiesState: getOptyActivityState(),
        },
      },
    });
  };

  const validateOpportunity = () => {
    const activityStep = dynamicValues.breadCumbSep;
    navigate(`/opportunities/${opportunityId}/edit`, {
      state: {
        opportunities: {
          from: location.pathname,
          to: `/opportunities/${opportunityId}/edit`,
          validationMode: true,
          opportunityId,
          companyId,
          activityStep,
          validationStep: validationStep,
          optyActivitiesState: getOptyActivityState(),
        },
      },
    });
  };

  // Update validation step based on navigation
  useEffect(() => {
    const toPath = location?.state?.opportunities?.to;
    if (toPath) {
      if (toPath === `/opportunities/${opportunityId}/edit`) {
        setValidationStep((prev) => ({
          ...prev,
          opportunity: "validated",
        }));
      }
      if (toPath === `/companies/${companyId}/edit`) {
        setValidationStep((prev) => ({
          ...prev,
          opportunity: "validated",
        }));
      }
    }
  }, [location?.state?.opportunities, opportunityId, companyId]);

  // Check if form should be submitted (activity is work in progress)
  const isSubmitted =
    opportunityInitialStatus !== "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS";

  // Merge validation actions into actionMap
  const enhancedActionMap = {
    ...actionMap,
    validateCompany,
    validateOpportunity,
  };

  return (
    <>
      {/* Validation Buttons - Only for data validation activity */}
      {activity?.activityKey === "data_validation_activity" &&
        getActivityData && (
          <>
            <label>{DATA_VALIDATION_LABEL}</label>
            <ValidationButtonContainer>
              <ValidateButton
                variantType={
                  validationStep.company === "initial" ? "primary" : "secondary"
                }
                disabled={isSubmitted}
                onClick={() => {
                  if (isSubmitted) return;
                  validateCompany();
                }}
              >
                {COMPANY_VALIDATION_LABEL}
              </ValidateButton>
              <ValidateButton
                variantType={
                  validationStep.opportunity === "initial"
                    ? "primary"
                    : "secondary"
                }
                disabled={isSubmitted}
                onClick={() => {
                  if (isSubmitted) return;
                  validateOpportunity();
                }}
              >
                {OPPORTUNITY_VALIDATION_LABEL}
              </ValidateButton>
            </ValidationButtonContainer>
          </>
        )}

      {/* The Form */}
      <NestedDynamicForm
        config={resolvedConfig}
        ref={formRef}
        onActionMap={enhancedActionMap}
        disableAllFormFields={disableAllFormFields}
        dynamicValues={dynamicValues}
        onValuesChange={(values) => {
          if (latestValuesRef && latestValuesRef.current) {
            latestValuesRef.current = values;
          }
        }}
      />
    </>
  );
};

export default DataValidationActivity;
