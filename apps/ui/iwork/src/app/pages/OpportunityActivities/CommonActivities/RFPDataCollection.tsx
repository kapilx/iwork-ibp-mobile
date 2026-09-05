import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  endPoints,
  FeatureKey,
  NestedDynamicForm,
  normalizeApiDataForResetting,
  setToastMessage,
  DynamicForm,
  parseApiConfigToLocalFormConfig,
  environment,
  selectHasPermission,
} from "@ui/ui-lib";
import {
  ALERT_MESSAGES,
  COVER_EXTRACTION_FAILURE_MESSAGE,
  COVER_EXTRACTION_SUCCESS_MESSAGE,
} from "../../../constants";

import policyDocIcon from "../../../assets/svgs/file-upload-policy-doc.svg";
import {
  StyledLinearProgress,
  StyledRfpDataCollectionContainer,
} from "./styles";
import { transformQuestions } from "../Constants/config.js";
import { ActivityProps } from "./RenderActivity";
import axios from "axios";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import { useParams } from "react-router-dom";

export const rfpDataCollectionCoversAiConfig = [
  {
    key: "pdfAnalyzer",
    name: "file2",
    label: (
      <div>
        Optional - upload a previous year's policy or RFP document (
        <strong>pdf only</strong>) to automatically fill in the covers
      </div>
    ),

    type: "fileupload",
    gridColumn: 3.5,
    componentProps: {
      multiple: true,
      accept: ".pdf",
      helperText: "Please upload a valid PDF document",
      customVariant: "secondary",
    },
    UploadIcon: policyDocIcon,
  },
];

interface RFPDataCollectionActivityProps extends ActivityProps {
  activityMetaData: any;
}
const RFPDataCollectionActivity: React.FC<RFPDataCollectionActivityProps> = ({
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
  activityMetaData,
  userOrganisationKey,
}) => {
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const { id: opportunityId } = useParams<{ id: string }>();

  const hasRbacExportPermission = useSelector(selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY));
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

  const onFileUpload = async (data: any, isApiRes: boolean = false) => {
    const questions = transformQuestions(activityMetaData.coversConfig || []);
    // Only trigger Covers AI when we receive the File object
    if (data instanceof File && questions.length > 0) {
      setLoading(true);
      const token = sessionStorage.getItem("user")
        ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
            ?.accessToken
        : null;

      const payload = {
        questions: questions,
      };

      const formData = new FormData();
      formData.append("file", data);
      formData.append("data", JSON.stringify(payload));

      try {
        const response = await axios.post(endPoints.coversAi, formData, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const getValues = formRef?.current?.getValues?.() || {};
        const apiAnswers = response?.data?.data?.answers || {};
        const userCoversConfig = getValues?.coversConfig || {};

        const cleanEntries = (obj: Record<string, any>) =>
          Object.fromEntries(
            Object.entries(obj).filter(
              ([_, value]) =>
                value !== null && value !== "" && value !== undefined
            )
          );

        const cleanedApiAnswers = cleanEntries(apiAnswers);
        const cleanedUserValues = cleanEntries(userCoversConfig);

        // Merge: API values first, overridden by user values
        const mergedCoversConfig = {
          ...cleanedApiAnswers,
          ...cleanedUserValues,
        };

        const resetData = {
          ...getValues,
          coversConfig: mergedCoversConfig,
        };

        if (formRef?.current) {
          formRef.current?.resetForms(resetData);
        }

        const extractCount = Object.keys(cleanedApiAnswers).length;

        dispatch(
          setToastMessage(
            extractCount === 0
              ? COVER_EXTRACTION_FAILURE_MESSAGE
              : COVER_EXTRACTION_SUCCESS_MESSAGE(extractCount)
          )
        );

        setLoading(false);
      } catch (error) {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      }
    }
  };

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
      <StyledRfpDataCollectionContainer>
        <DynamicForm
          formConfig={rfpDataCollectionCoversAiConfig}
          sx={{
            display: "flex",
            justifyContent: "flex-start",
          }}
          onFileUpload={onFileUpload}
          disableAllFields={disableAllFormFields}
        />
        {loading && <StyledLinearProgress color="secondary" />}
      </StyledRfpDataCollectionContainer>

      <NestedDynamicForm
        config={resolvedConfig}
        ref={formRef}
        disableAllFormFields={disableAllFormFields}
        dynamicValues={dynamicValues}
      />
    </>
  );
};

export default RFPDataCollectionActivity;
