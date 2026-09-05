import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  FeatureKey,
  NestedDynamicForm,
  normalizeApiDataForResetting,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
} from "@ui/ui-lib";

import { environment } from "@ui/ui-lib/environment";

import { ActivityProps } from "./RenderActivity";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";

const PolicyDocketActivity: React.FC<ActivityProps> = ({
  config,
  formRef,
  actionMap,
  dynamicValues,
  activity,
  disableAllFormFields,
  opportunityInitialStatus,
  getActivityData,
  latestValuesRef,
  optyActivitiesState,
  activityMetaData,
  userOrganisationKey,
}) => {
  const { id: opportunityId } = useParams<{ id: string }>();

  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

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

  return (
    <>
      {/* The Form */}
      <NestedDynamicForm
        config={resolvedConfig}
        ref={formRef}
        onActionMap={actionMap}
        disableAllFormFields={disableAllFormFields}
        dynamicValues={dynamicValues}
      />
    </>
  );
};

export default PolicyDocketActivity;
