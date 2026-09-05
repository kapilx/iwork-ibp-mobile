import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  endPoints,
  Button,
  FeatureKey,
  environment,
  NestedDynamicForm,
  useApiQuery,
  parseApiConfigToLocalFormConfig,
  normalizeApiDataForResetting,
  selectHasPermission,
} from "@ui/ui-lib";
import { MandateLabelContainer, StyledMandateText } from "./styles";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import { ActivityProps } from "./RenderActivity";
import { useSelector } from "react-redux";

const MandateDetailsActivity: React.FC<ActivityProps> = ({
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
  useEffect(() => {
    if (formRef && getActivityData?.data) {
      const normalizedData = normalizeApiDataForResetting(
        getActivityData.data?.dataActivity
      );

      formRef?.current?.resetForms(normalizedData);
    }
  }, [getActivityData?.data, formRef]);

  const [compensationTypeLid, setCompensationTypeLid] = useState<number | null>(
    null
  );

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
              },
            };
          }

          return field;
        });
      }

      return finalGroup;
    });

    return enhancedConfig;
  }, [activityMetaData, dynamicValues, getActivityData, compensationTypeLid]);

  const {
    data: getMandatePreviousData,
    isLoading: isGetMandatePreviousActivityLoading,
  } = useApiQuery({
    queryKey: [
      "opportunityMandateGetCall",
      activity.opportunityActivityId,
      // activityMetaData,
    ],
    url: endPoints.fetchOpportunityPreviousMandate(
      Number(activity.opportunityActivityId)
    ),
    enabled:
      !!activity.opportunityActivityId && !getActivityData?.data?.dataActivity,
  });

  const renderLabelsOfActivity = () => {
    if (
      getMandatePreviousData?.data &&
      !getActivityData?.data &&
      opportunityInitialStatus ===
        "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS"
    ) {
      return (
        <MandateLabelContainer>
          <StyledMandateText>
            {`Mandate document for ${dynamicValues.companyName} already exists. Do you want to use the same one?`}
          </StyledMandateText>
          <Button
            variantType="secondary"
            onClick={() => {
              const existingData = getMandatePreviousData.data?.dataActivity;
              const documents = existingData?.documents || [];

              const updatedConfig = config.map((group: any) => {
                if (Array.isArray(group.config)) {
                  group.config = group.config.map((field: any) => {
                    if (field.type === "documentupload") {
                      return {
                        ...field,
                        componentProps: {
                          ...(field.componentProps || {}),
                          documents, // inject documents here
                          isDownloadAllowed: isExportAllowed,
                        },
                      };
                    }
                    return field;
                  });
                }
                return group;
              });

              if (formRef.current) {
                formRef.current.resetForms(existingData);
              }
            }}
          >
            Fetch existing mandate
          </Button>
        </MandateLabelContainer>
      );
    }
  };

  if (isGetMandatePreviousActivityLoading) {
    return <>Loading...</>;
  }
  return (
    <>
      {renderLabelsOfActivity()}
      <NestedDynamicForm
        config={resolvedConfig}
        ref={formRef}
        disableAllFormFields={disableAllFormFields}
        dynamicValues={dynamicValues}
        onValuesChange={(values) => {
          latestValuesRef.current = values;
          const newValue =
            values?.mandateDetailsFromFields?.compensationTypeLid;
          // Only update state if value actually changed
          if (newValue !== compensationTypeLid) {
            setCompensationTypeLid(newValue);
          }
        }}
      />
    </>
  );
};

export default MandateDetailsActivity;
