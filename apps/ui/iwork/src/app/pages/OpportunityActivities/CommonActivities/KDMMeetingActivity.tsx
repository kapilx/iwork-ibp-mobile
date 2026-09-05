import React, { useEffect, useState } from "react";
import {
  endPoints,
  FeatureKey,
  environment,
  NestedDynamicForm,
  normalizeApiDataForResetting,
  useApiQuery,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
} from "@ui/ui-lib";
import {
  transformHandOverMeetData,
  transformKDMMeetingData,
} from "../../../constants/transformUtils";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import { ActivityProps } from "./RenderActivity";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const KDMMeetingActivity: React.FC<ActivityProps> = ({
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

  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState<any>(null);

  const { data: meetingDataResponse } = useApiQuery({
    queryKey: ["meetingId", meetingId],
    url: endPoints.meetingById(Number(meetingId)),
    enabled: !!meetingId,
  });

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
  }, [activityMetaData, dynamicValues, getActivityData, activity.isDocumentMandatory]);

  useEffect(() => {
    if (formRef && getActivityData?.data) {
      const normalizedData = normalizeApiDataForResetting(
        getActivityData.data?.dataActivity
      );
      formRef?.current?.resetForms(normalizedData);
    }
  }, [getActivityData?.data, formRef]);

  useEffect(() => {
    if (meetingDataResponse?.data) {
      setMeetingData(meetingDataResponse.data);
      let res = {};
      if (
        meetingDataResponse?.data?.activity?.activityKey ===
        "kdm_meeting_activity"
      ) {
        const getValues = formRef?.current?.getValues?.();
        res = transformKDMMeetingData(meetingDataResponse.data);

        formRef.current?.resetForms({
          ...res,
          kdmMeetingFormFields: {
            ...res?.kdmMeetingFormFields,
            kdmMeetingTypeLid:
              getValues?.kdmMeetingFormFields?.kdmMeetingTypeLid || null,
            selectMeeting:
              getValues?.kdmMeetingFormFields?.selectMeeting || null,
          },
        });
      }
      if (
        meetingDataResponse?.data?.activity?.activityKey ===
        "hand_over_meet_activity"
      ) {
        const getValues = formRef?.current?.getValues?.();

        res = transformHandOverMeetData(meetingDataResponse.data);
        formRef.current?.resetForms({
          ...res,
          handOverMeetFields: {
            ...res?.handOverMeetFields,
            handOverMeetingTypeLid:
              getValues?.handOverMeetFields?.handOverMeetingTypeLid || null,
            selectMeeting: getValues?.handOverMeetFields?.selectMeeting || null,
          },
        });
      }
    }
  }, [meetingDataResponse]);

  const fetchMeetingDetails = (changedValue: any, formValues: any) => {
    const selectedMeetingId = changedValue?.value;
    if (selectedMeetingId) {
      setMeetingId(selectedMeetingId);
    } else {
      console.error("Invalid meeting ID:", changedValue);
    }
  };

  const enhancedActionMap = {
    ...actionMap,
    fetchMeetingDetails,
  };

  return (
    <>
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

export default KDMMeetingActivity;
