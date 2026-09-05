import { Box, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import VersionTabs, { TabData } from "../../../../components/VersionsTabs";
import QuoteForm from "./QuoteForm";

import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  ALERT_MESSAGES,
  ATLEAST_ONE_QUOTE_REQUIRED,
  BROKING_SLIP_GENERATION_DETAILS,
  ENDORSEMENT_TOASTS,
  SAVE_ACTIVITY,
  SUBMIT_ACTIVITY,
} from "../../../../constants";
import { ButtonWrapper } from "../RFPDataCollection/styles";
import {
  getQuoteActivityConfig,
  getQuoteVersionConfigByCountry,
} from "./QuoteForm/formConfig";
import {
  Button,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  endPoints,
  useApiMutation,
  setToastMessage,
  apiRequest,
  parseApiConfigToLocalFormConfig,
  parseNumbersDeep,
  FeatureKey,
  selectHasPermission,
  cleanEmptyArrayRows,
} from "@ui/ui-lib";
import { HTTP_METHODS } from "@ui/ui-lib";
import { useActivityTasks } from "../../hooks/useActivityTasks";
import { buildSectionAwareCoverConfig } from "../../CommonActivities/utils/buildSectionAwareCoverConfig";

interface EnterQuoteProps {
  activity: any;
  saveStatusData: number;
  submitStatusData: number;
  setBreadCumbStep: React.Dispatch<React.SetStateAction<number>>;
  breadCumbSep?: number;
  setSubmittedBreadCumb?: React.Dispatch<React.SetStateAction<number | null>>;
  dynamicValues?: Record<string, any>;
  opportunityActivityStatus: any;
  Role?: string;
  isLost?: boolean;
}

const EnterQuote: React.FC<EnterQuoteProps> = ({
  activity,
  saveStatusData,
  submitStatusData,
  setBreadCumbStep,
  breadCumbSep,
  setSubmittedBreadCumb,
  dynamicValues = {},
  opportunityActivityStatus,
  Role,
  isLost = false,
}) => {
  const { id: opportunityId } = useParams<{ id: string }>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false);
  const isSavingRef = useRef(false);
  const resetSubmissionState = () => {
    isSubmittingRef.current = false;
    setLoading(false);
  };
  const resetSavingState = () => {
    isSavingRef.current = false;
    setIsSaving(false);
  };
  const accordionRef = useRef<HTMLDivElement | null>(null); //to auto scroll to accordion header
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [selectedTab, setSelectedTab] = useState("");
  const [quoteEntryData, setQuoteEntryData] = useState<number>(0);
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>({});
  const userOrganisationKey = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.organisationKey
    : null;

  const scrollToAccordionHeader = () => {
    const accordionEl = accordionRef.current?.closest(
      '[data-testid="Root-accordion"]'
    ) as HTMLElement | null;
    accordionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleQuoteCountChange = React.useCallback(
    (tabId: string, count: number) => {
      setQuoteCounts((prev) => ({ ...prev, [tabId]: count }));
    },
    []
  );

  const canSubmit = Object.values(quoteCounts).some((c) => c > 0);

  const { data: quoteGetData } = useQuery({
    queryKey: ["manageQuote", opportunityId, activity.id],
    enabled: !!opportunityId,
    queryFn: async () => {
      const [
        versionsTabsData,
        coverConfigData,
        getActivityData,
        opportunityStatus,
      ] = await Promise.all([
        apiRequest(endPoints.brokingSlipVersions(opportunityId)),
        apiRequest(
          endPoints.coversMetaByOpportunityId(
            Number(opportunityId),
            activity.id
          )
        ),
        apiRequest(
          endPoints.opportunityActivitiesByopportunityActivityId(
            Number(activity.opportunityActivityId)
          )
        ),
        apiRequest(
          endPoints.activityMetaByOpportunityId(
            Number(opportunityId),
            activity.id
          )
        ),
      ]);

      const sectionAwareCoversConfig = buildSectionAwareCoverConfig(
        coverConfigData?.data
      );

      const quoteVersionConfig = getQuoteVersionConfigByCountry(
        userOrganisationKey,
        dynamicValues?.companyId,
        opportunityId
      ).map((item) => {
        if (item.isCoversRequired) {
          return {
            ...item,
            title: coverConfigData?.data?.sectionHeading || item.title,
            config: sectionAwareCoversConfig,
          };
        }
        return item;
      });

      return {
        versionsTabsData: versionsTabsData?.data, //setting the versions tabs
        quoteVersionConfig: quoteVersionConfig, //covers config
        getActivityData: getActivityData?.data, //getting the activity data
        opportunityInitialStatusId: opportunityStatus?.data?.statusLid,
      };
    },
  });
  const opportunityInitialStatus = opportunityActivityStatus?.find(
    (status: any) => status.id === quoteGetData?.opportunityInitialStatusId
  )?.lookUpKey;

  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const formData = quoteGetData?.getActivityData?.dataActivity;
      const isMounted = formRef?.current?.isMounted;

      if (formData && isMounted) {
        const normalizedData = normalizeApiDataForResetting(formData);
        formRef?.current?.resetForms(normalizedData);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [quoteGetData?.getActivityData?.dataActivity]); // ✅ Track `dataActivity` directly

  const patchedActivityConfig = React.useMemo(() => {
    const config = getQuoteActivityConfig(
      dynamicValues?.companyId,
      opportunityId,
      activity.opportunityActivityId
    );

    const mainDocuments =
      quoteGetData?.getActivityData?.dataActivity?.mainDocuments || [];

    return config.map((group: any) => {
      if (!Array.isArray(group.config)) return group;
      return {
        ...group,
        config: group.config.map((field: any) => {
          if (
            field.type === "documentupload" &&
            field.key === "mainDocuments"
          ) {
            return {
              ...field,
              componentProps: {
                ...(field.componentProps || {}),
                documents: mainDocuments,
                isDocumentRequired:
                  activity.isDocumentMandatory ??
                  field.componentProps?.isDocumentRequired,
                isDocumentTypeRequired:
                  activity.isDocumentMandatory ??
                  field.componentProps?.isDocumentTypeRequired,
                permissionFeatureKey: FeatureKey.EXPORT_OPTY_ACTIVITY,
              },
            };
          }
          return field;
        }),
      };
    });
  }, [
    quoteGetData?.getActivityData?.dataActivity,
    dynamicValues,
    opportunityId,
    activity.opportunityActivityId,
    activity.isDocumentMandatory,
  ]);

  useEffect(() => {
    if (
      Array.isArray(quoteGetData?.versionsTabsData) &&
      quoteGetData?.versionsTabsData.length > 0
    ) {
      const initialTabs = quoteGetData.versionsTabsData.map((version) => ({
        id: version.id,
        label: version.name,
        isEditing: false,
        values: null,
        defaultVersionName: version.name,
        versionId: version.id,
      }));
      setTabs(initialTabs);
      setSelectedTab(initialTabs[0].id); //setting the first tab as selected
    }
  }, [quoteGetData?.versionsTabsData]);

  const transformDocuments = (documents: any) => {
    let docsArray: any[] = [];
    if (Array.isArray(documents)) {
      docsArray = documents;
    } else if (documents && Array.isArray(documents.documents)) {
      docsArray = documents.documents;
    } else {
      return [];
    }
    return docsArray
      .map((doc) => {
        const documentId = doc?.fileUpload?.id ?? doc?.documentId;
        const documentTypeLid = Number(
          doc?.documentTypeLid ?? doc?.documentType
        );
        if (!documentId || isNaN(documentTypeLid)) return null;
        return { documentTypeLid, documentId };
      })
      .filter(Boolean);
  };

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        resetSubmissionState();
        dispatch(setToastMessage(response?.message));
        setBreadCumbStep((prev: number | null) =>
          prev === null ? 0 : prev + 1
        );
        setSubmittedBreadCumb && setSubmittedBreadCumb((breadCumbSep ?? 0) + 1);
      },
      onError: async (error) => {
        resetSubmissionState();
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const saveMutation = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        resetSavingState();
        dispatch(
          setToastMessage(response?.message || "Activity saved successfully")
        );
      },
      onError: (error: any) => {
        resetSavingState();
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const resolveQuoteVersionConfig = React.useMemo(() => {
    if (!quoteGetData?.quoteVersionConfig?.length) return [];
    return parseApiConfigToLocalFormConfig(
      quoteGetData?.quoteVersionConfig || [],
      dynamicValues
    );
  }, [quoteGetData?.quoteVersionConfig, dynamicValues]);

  const saveActivity = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (formRef.current) {
        // Skip validation - just get values without submitAll
        formRef.current?.clearErrors?.([], true);
        const rawValues = formRef.current?.getValues?.() || {};
        const values = cleanEmptyArrayRows(rawValues);

        // Transform the mainDocuments
        const transformedMainDocs = transformDocuments(
          values?.mainDocuments?.mainDocuments
        );

        const payload = {
          quoteStatusLid:
            (saveStatusData as any)?.data?.[0]?.id ?? saveStatusData,
          activityStatusKey: "SAVE_ACTIVITY",
          ...values,
          mainDocuments: transformedMainDocs,
        };

        saveMutation.mutate({
          endpoint: endPoints.updateQuoteByActivityId(
            Number(activity.opportunityActivityId)
          ),
          method: HTTP_METHODS.PUT,
          data: payload,
        });
      } else {
        resetSavingState();
      }
    } catch (error) {
      resetSavingState();
      throw error;
    }
  };

  const handleSubmit = async (statusId: number) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const submit = await formRef?.current?.submitAll?.();

      if (!canSubmit) {
        dispatch(setToastMessage(ATLEAST_ONE_QUOTE_REQUIRED));
        resetSubmissionState();
        return;
      }

      if (submit?.isAllValid) {
        // ✅ Transform the mainDocuments
        const transformedMainDocs = transformDocuments(
          submit?.result?.mainDocuments?.mainDocuments
        );

        const payload = {
          quoteStatusLid: (statusId as any)?.data?.[0]?.id ?? statusId,
          // activityStatusKey: "SUBMIT_ACTIVITY",
          ...submit?.result,
          mainDocuments: transformedMainDocs,
        };
        mutation.mutate({
          endpoint: endPoints.updateQuoteByActivityId(
            Number(activity.opportunityActivityId)
          ),
          method: HTTP_METHODS.PUT,
          data: payload,
        });
      } else {
        resetSubmissionState();
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
        );
        scrollToAccordionHeader();
      }
    } catch (error) {
      resetSubmissionState();
      throw error;
    }
  };

  // Disable logic for all form fields
  const disableAllFormFields =
    isLost === true ||
    opportunityInitialStatus !== "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS";

  const canEditBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_BD_OPTY_ACTIVITY)(state)
  );
  const canEditISGActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_ISG_OPTY_ACTIVITY)(state)
  );

  const canEditActivity =
    (Role === "BD" && canEditBDActivity) ||
    (Role === "ISG" && canEditISGActivity);

  // Use activity tasks hook
  const {
    handleCreateTask,
    TasksTable,
    TaskFormDrawer,
    isAllTasksCompleted,
    isTaskDetailsLoading,
    // Notes
    NotesTable,
    NoteFormDrawer,
    isNotesLoading,
  } = useActivityTasks({
    activity,
    dynamicValues: dynamicValues || {},
    isFormDisabled: disableAllFormFields || loading,
    canEditActivity,
  });

  return (
    <Box
      data-testId={
        disableAllFormFields || !canEditActivity
          ? "common-activities-main-container-disabled"
          : "common-activities-main-container"
      }
      ref={accordionRef}
    >
      <Typography>{BROKING_SLIP_GENERATION_DETAILS}</Typography>

      <VersionTabs
        tabs={tabs}
        setTabs={setTabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        enableAddTab={false}
        enableEditTab={false}
      />

      <Box mt={3}>
        {tabs.map(
          (tab) =>
            tab.id === selectedTab && (
              <Box key={tab.id}>
                <QuoteForm
                  selectedTab={selectedTab}
                  activity={activity}
                  disableAllFormFields={
                    disableAllFormFields || !canEditActivity
                  }
                  quoteVersionConfig={resolveQuoteVersionConfig}
                  setQuoteEntryData={setQuoteEntryData}
                  onQuoteCountChange={handleQuoteCountChange}
                />
              </Box>
            )
        )}
      </Box>

      <NestedDynamicForm
        disableAllFormFields={disableAllFormFields || !canEditActivity}
        config={patchedActivityConfig}
        ref={formRef}
      />

      {/* Tasks Section */}
      {TasksTable()}
      {TaskFormDrawer()}

      {/* Notes Section */}
      {NotesTable()}
      {NoteFormDrawer()}

      <ButtonWrapper>
        {/* <Button
          onClick={saveActivity}
          variantType="secondary"
          color="secondary"
          sizeType="small"
          disabled={
            disableAllFormFields || !canEditActivity || loading || isSaving
          }
        >
          {SAVE_ACTIVITY}
        </Button> */}
        <Button
          onClick={() => handleSubmit(submitStatusData)}
          variantType="primary"
          color="primary"
          sizeType="small"
          disabled={
            disableAllFormFields ||
            !canEditActivity ||
            loading ||
            isTaskDetailsLoading ||
            !isAllTasksCompleted
          }
        >
          {SUBMIT_ACTIVITY}
        </Button>
      </ButtonWrapper>
    </Box>
  );
};

export default EnterQuote;
