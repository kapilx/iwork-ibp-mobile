import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import VersionTabs, { TabData } from "../../../../components/VersionsTabs";
import VersionForm from "./VersionForm";

import {
  ButtonWrapper,
  CoverDetailsContainer,
  RfpDivider,
} from "../RFPDataCollection/styles";

import {
  COVER_DETAILS,
  COMPARE,
  BROKING_SLIP_GENERATION,
  UNSAVED_VERSIONS,
  ALERT_MESSAGES,
  SAVE_CURRENT_VERSION_MESSAGE,
  SUBMIT_ACTIVITY,
  ATLEAST_ONE_VERSION_REQUIRED,
  UNSAVED_VERSION_WARNING,
  UNSAVED_VERSION_SUBMIT_NOTE,
  SAVE_ACTIVITY,
  EXPORT_TO_EXCEL,
  DOWNLOAD_URL_NOT_FOUND,
  WAITING_FOR_ACTIVITY_APPROVAL_BY,
  THIS_ACTIVITY_WAS_APPROVED_BY,
  ENDORSEMENT_TOASTS,
  SAVED_VERSIONS,
} from "../../../../constants";
import {
  BUTTON_LABELS,
  Button,
  CustomModal,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  parseApiConfigToLocalFormConfig,
  apiRequest,
  endPoints,
  useApiMutation,
  setToastMessage,
  selectHasPermission,
  FeatureKey,
  parseNumbersDeep,
  formatDate,
  cleanEmptyArrayRows,
  environment,
} from "@ui/ui-lib";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { HTTP_METHODS } from "@ui/ui-lib";
import {
  ActivitiesButtonsContainer,
  CommonActivitiesMainContainer,
} from "../../CommonActivities/styles";
import {
  getBrokingSlipGenerationActivityConfig,
  getBrokingSlipVersionConfigByCountry,
} from "./VersionForm/config";
import {
  approvalButtonsConfig,
  buttonsConfig,
  onlyApproveButtonConfig,
} from "../../Constants/config.js";
import {
  ButtonTypography,
  CommonButton,
} from "../../../QuoteComparisonPage/styles";
import XlsIcon from "../../../../assets/svgs/xls-icon.svg";
import { useActivityTasks } from "../../hooks/useActivityTasks";
import { buildSectionAwareCoverConfig } from "../../CommonActivities/utils/buildSectionAwareCoverConfig";

const BrokingSlipGeneration = ({
  activity,
  saveStatusData,
  submitStatusData,
  setBreadCumbStep,
  breadCumbSep,
  setSubmittedBreadCumb,
  dynamicValues = {},
  opportunityActivityStatus,
  approvedStatusData,
  rejectedStatusData,
  submitStatusDataForApproval,
  Role,
  isLost,
}: {
  activity: any;
  saveStatusData: number;
  submitStatusData: number;
  setBreadCumbStep: React.Dispatch<React.SetStateAction<number>>;
  breadCumbSep?: number;
  setSubmittedBreadCumb?: React.Dispatch<React.SetStateAction<number>>;
  dynamicValues?: Record<string, any>;
  opportunityActivityStatus?: any;
  approvedStatusData?: any;
  rejectedStatusData?: any;
  submitStatusDataForApproval?: any;
  Role?: string;
  isLost?: boolean;
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
  const [selectedTab, setSelectedTab] = useState("v1");

  const scrollToAccordionHeader = () => {
    const accordionEl = accordionRef.current?.closest(
      '[data-testid="Root-accordion"]'
    ) as HTMLElement | null;
    accordionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "v1",
      label: "Version 1",
      isEditing: false,
      values: {},
      isDirty: false,
    },
  ]);
  const [showNoVersionModal, setShowNoVersionModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [showAddTabConfirmation, setShowAddTabConfirmation] = useState(false);
  // Generic modal state for simple alerts
  const [infoModalState, setInfoModalState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ open: false, title: "", message: "" });
  const [suppressBreadCrumbAdvance, setSuppressBreadCrumbAdvance] =
    useState(false);
  const [statusLidState, setStatusLidState] = useState<number | null>(null);
  const [approverName, setApproverName] = useState<string | null>(null);

  const activityFormRef = useRef<NestedGroupedDataCollectionHandle>(null);

  const userOrganisationKey = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.organisationKey
    : null;

  const { data: brokingSlipGetData } = useQuery({
    queryKey: ["activityMetaData", opportunityId, activity.id],
    enabled: !!opportunityId,
    queryFn: async () => {
      const preferredInsurersPromise = apiRequest(
        endPoints.preferredInsurersByOpportunityId(Number(opportunityId))
      ).catch(() => null);
      const [
        versionsTabsData,
        getFormData,
        coverConfigData,
        activityMeta,
        preferredInsurers,
      ] = await Promise.all([
        apiRequest(endPoints.brokingSlipVersions(opportunityId)),
        apiRequest(
          endPoints.getBrokingSlipByOppId(
            Number(activity?.opportunityActivityId)
          )
        ),
        apiRequest(
          endPoints.coversMetaByOpportunityId(
            Number(opportunityId),
            activity.id
          )
        ),
        apiRequest(
          endPoints.activityMetaByOpportunityId(
            Number(opportunityId),
            activity.id
          )
        ),
        preferredInsurersPromise,
      ]);

      const baseVersionConfig =
        getBrokingSlipVersionConfigByCountry(
          dynamicValues,
          userOrganisationKey
        ) ?? [];
      const sectionAwareCoversConfig = buildSectionAwareCoverConfig(
        coverConfigData?.data
      );
      const versionConfigData = baseVersionConfig.map((item) => {
        if (item?.isCoversRequired) {
          return {
            ...item,
            config: sectionAwareCoversConfig,
            defaultValues: getFormData?.data?.defaultCovers ?? {},
          };
        }
        return item;
      });

      return {
        versionsTabsData: versionsTabsData?.data, //setting the versions tabs
        getFormData: getFormData?.data, //setting the form data for the activity

        versionConfig: versionConfigData ?? [],
        activityMeta: activityMeta?.data?.statusLid,
        preferredInsurers:
          preferredInsurers?.data?.preferredInsurers?.data ??
          preferredInsurers?.preferredInsurers?.data ??
          [],
      };
    },
  });

  const effectiveStatusLid =
    statusLidState ?? brokingSlipGetData?.getFormData?.statusLid;

  const opportunityInitialStatus = opportunityActivityStatus?.find(
    (status: any) => status.id === effectiveStatusLid
  )?.lookUpKey;
  useEffect(() => {
    if (!activityFormRef?.current || !brokingSlipGetData?.getFormData) {
      return;
    }

    const normalizeData =
      normalizeApiDataForResetting(brokingSlipGetData?.getFormData?.formData) ||
      {};

    const preferredInsurersData = Array.isArray(
      brokingSlipGetData?.preferredInsurers
    )
      ? brokingSlipGetData?.preferredInsurers
      : [];

    if (preferredInsurersData.length > 0) {
      const existingRows = (() => {
        const existing = normalizeData?.preferredInsurerDetails;
        if (Array.isArray(existing)) return existing;
        if (
          existing &&
          typeof existing === "object" &&
          Array.isArray(existing.retArray)
        ) {
          return existing.retArray;
        }
        return [];
      })();

      const hasExistingValues = existingRows.some((row) =>
        [
          "insurerId",
          "insurerLocationId",
          "insurerBranchId",
          "insurerContactId",
        ]
          .map((key) => row?.[key])
          .some(
            (value) => value !== null && value !== undefined && value !== ""
          )
      );

      if (!hasExistingValues) {
        const mappedRows = preferredInsurersData.map((insurer) => ({
          insurerId: insurer?.insurerId ?? null,
          insurerLocationId: insurer?.insurerLocationId ?? null,
          insurerBranchId: insurer?.insurerBranchId ?? null,
          insurerContactId: insurer?.insurerContactId ?? null,
        }));

        if (
          normalizeData?.preferredInsurerDetails &&
          typeof normalizeData.preferredInsurerDetails === "object" &&
          !Array.isArray(normalizeData.preferredInsurerDetails)
        ) {
          normalizeData.preferredInsurerDetails = {
            ...normalizeData.preferredInsurerDetails,
            retArray: mappedRows,
          };
        } else {
          normalizeData.preferredInsurerDetails = mappedRows;
        }
      }
    }

    activityFormRef?.current?.resetForms?.(normalizeData);
  }, [brokingSlipGetData?.getFormData, brokingSlipGetData?.preferredInsurers]);

  useEffect(() => {
    if (
      Array.isArray(brokingSlipGetData?.versionsTabsData) &&
      brokingSlipGetData.versionsTabsData.length > 0
    ) {
      const initialTabs = brokingSlipGetData.versionsTabsData.map(
        (version) => ({
          id: version.id,
          label: version.name,
          isEditing: false,
          values: null,
          isDirty: false,
          defaultVersionName: version.name,
          versionId: version.id,
        })
      );
      setTabs(initialTabs);
      setSelectedTab(initialTabs[0].id); //setting the first tab as selected
    }
  }, [brokingSlipGetData?.versionsTabsData]);

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        resetSubmissionState();
        dispatch(setToastMessage(response?.message));
        if (!suppressBreadCrumbAdvance) {
          setBreadCumbStep((prev) => (prev === null ? 0 : prev + 1));
          setSubmittedBreadCumb((breadCumbSep ?? 0) + 1);
        }
        setSuppressBreadCrumbAdvance(false);
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
        const baseMessage = response?.message || "Activity saved successfully";
        const hasSavedVersion = tabs.some((tab) => Boolean(tab.versionId));
        const message = hasSavedVersion
          ? baseMessage + " " + SAVED_VERSIONS
          : UNSAVED_VERSION_SUBMIT_NOTE;
        dispatch(setToastMessage(message));
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

  const transformDocuments = (documents: any) => {
    // Defensive: handle both array and object-with-documents-array
    let docsArray: any[] = [];
    if (Array.isArray(documents)) {
      docsArray = documents;
    } else if (documents && Array.isArray(documents.documents)) {
      docsArray = documents.documents;
    } else {
      return [];
    }
    return docsArray.map((doc) => ({
      documentTypeLid: doc.documentTypeLid ?? doc.documentType,
      documentId: doc.fileUpload?.id ?? doc.documentId,
    }));
  };

  const saveActivity = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (activityFormRef.current) {
        // Skip validation - just get values without submitAll
        activityFormRef.current?.clearErrors?.([], true);
        const rawValues = activityFormRef.current?.getValues?.() || {};
        const values = cleanEmptyArrayRows(rawValues);

        const payload = {
          opportunityActivityId: activity.opportunityActivityId,
          statusLid: (saveStatusData as any)?.data?.[0]?.id ?? saveStatusData,
          activityStatusKey: "SAVE_ACTIVITY",
          brokingSlipDetails: {
            ...values,
            documents: transformDocuments(values?.documents || []),
          },
        };

        saveMutation.mutate({
          endpoint: endPoints.updateBrokingSlip(activity.opportunityActivityId),
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
      const submit = await activityFormRef?.current?.submitAll?.();
      if (submit?.isAllValid) {
        const payload = {
          opportunityActivityId: activity.opportunityActivityId,
          statusLid: statusId?.data[0]?.id,
          activityStatusKey: "SUBMIT_ACTIVITY",
          brokingSlipDetails: {
            ...submit?.result,
            documents: transformDocuments(submit?.result?.documents || []),
          },
        };
        mutation.mutate(
          {
            endpoint: endPoints.updateBrokingSlip(
              activity.opportunityActivityId
            ),
            method: HTTP_METHODS.PUT,
            data: payload,
          },
          {
            onSuccess: (response) => {
              const approvedByName = response?.data?.approverDetails?.name;
              if (approvedByName) {
                setApproverName(approvedByName);
              }
              setStatusLidState(statusId?.data[0]?.id);
            },
          }
        );
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

  const attemptSubmit = (statusId: number, suppressBreadCrumb = false) => {
    if (suppressBreadCrumb) setSuppressBreadCrumbAdvance(true);
    const hasSavedVersion = tabs.some((tab) => Boolean(tab.versionId));
    if (!hasSavedVersion) {
      setShowNoVersionModal(true);
      return;
    }

    const currentTab = tabs.find((tab) => tab.id === selectedTab);
    const isDirty = !currentTab?.versionId || currentTab?.isDirty;

    if (isDirty) {
      setPendingStatusId(statusId);
      setShowUnsavedModal(true);
      return;
    }

    handleSubmit(statusId);
  };

  const addNewTab = () => {
    const newId = `v${tabs.length + 1}`;
    setTabs([
      ...tabs,
      {
        id: newId,
        label: `Version ${tabs.length + 1}`,
        isEditing: false,
        values: {},
        isDirty: true,
      },
    ]);
    setSelectedTab(newId);
  };

  const confirmTabSwitch = () => {
    if (!pendingTabSwitch) return;
    const { from, to } = pendingTabSwitch;
    const fromTab = tabs.find((tab) => tab.id === from);

    if (fromTab?.versionId) {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === from
            ? {
                ...tab,
                label: tab.defaultVersionName || tab.label,
                isDirty: false,
              }
            : tab
        )
      );
    } else {
      setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== from));
    }

    setSelectedTab(to);
    setPendingTabSwitch(null);
  };

  const confirmAddTab = () => {
    const currentTab = tabs.find((tab) => tab.id === selectedTab);
    if (!currentTab) {
      setShowAddTabConfirmation(false);
      return;
    }

    const newId = `v${tabs.length + 1}`;
    const { label, defaultVersionName } = currentTab;

    setTabs((prevTabs) => [
      ...prevTabs.map((tab) =>
        tab.id === selectedTab
          ? { ...tab, label: defaultVersionName || label, isDirty: false }
          : tab
      ),
      {
        id: newId,
        label: `Version ${tabs.length + 1}`,
        isEditing: false,
        values: {},
        isDirty: false,
      },
    ]);
    setSelectedTab(newId);
    setShowAddTabConfirmation(false);
  };

  const handleBeforeTabChange = async (
    fromTabId: string,
    toTabId: string
  ): Promise<boolean> => {
    const fromTab = tabs.find((tab) => tab.id === fromTabId);

    if (fromTab?.isDirty) {
      setPendingTabSwitch({ from: fromTabId, to: toTabId });
      return false;
    }

    return true;
  };

  const handleAddTab = () => {
    const currentTab = tabs.find((tab) => tab.id === selectedTab);
    if (!currentTab) return;

    const { label, defaultVersionName, versionId, isDirty } = currentTab;

    if (!versionId) {
      // Current tab is a new, unsaved version. Alert user to save it first.
      setInfoModalState({
        open: true,
        title: "Save Version",
        message: SAVE_CURRENT_VERSION_MESSAGE,
        onConfirm: () => setInfoModalState({ ...infoModalState, open: false }),
      });
      return;
    }

    // Current tab is a saved version. Check if it has unsaved changes.
    // Unsaved changes can be either form content being dirty or the label being modified.
    const hasUnsavedChanges = isDirty || label !== defaultVersionName;

    if (hasUnsavedChanges) {
      setShowAddTabConfirmation(true);
      return;
    }
    // If it's a saved version with no unsaved changes, proceed to add a new tab.
    addNewTab();
  };

  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

  // Disable logic for all form fields
  // opportunityInitialStatus !== "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS" && opportunityInitialStatus !== "OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED";
  const resolvedBrokingSlipConfig = React.useMemo(() => {
    const parsedConfig = parseApiConfigToLocalFormConfig(
      getBrokingSlipGenerationActivityConfig(
        dynamicValues?.companyId,
        opportunityId,
        activity.opportunityActivityId
      ) || [],
      dynamicValues
    );

    const documents =
      brokingSlipGetData?.getFormData?.formData?.documents || [];

    return parsedConfig.map((group: any) => {
      if (!Array.isArray(group.config)) return group;
      return {
        ...group,
        config: group.config.map((field: any) => {
          if (field.type === "documentupload") {
            return {
              ...field,
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
        }),
      };
    });
  }, [
    dynamicValues,
    brokingSlipGetData?.getFormData?.formData?.documents,
    opportunityId,
    activity.opportunityActivityId,
    isExportAllowed,
    activity.isDocumentMandatory,
  ]);

  const resolvedVersionConfig = React.useMemo(() => {
    if (!brokingSlipGetData?.versionConfig?.length) return [];
    return parseApiConfigToLocalFormConfig(
      brokingSlipGetData?.versionConfig || [],
      dynamicValues
    );
  }, [brokingSlipGetData?.versionConfig, dynamicValues]);

  const canGiveApprovalForBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state)
  );
  const canGiveApprovalForISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state)
  );
  const canGiveApproval =
    (Role === "BD" && canGiveApprovalForBD) ||
    (Role === "ISG" && canGiveApprovalForISG) ||
    canGiveApprovalForBD ||
    canGiveApprovalForISG;

  const canEditBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_BD_OPTY_ACTIVITY)(state)
  );
  const canEditISGActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_ISG_OPTY_ACTIVITY)(state)
  );

  const canEditActivity =
    (Role === "BD" && canEditBDActivity) ||
    (Role === "ISG" && canEditISGActivity);

  const isActivityApproved =
    activity?.activityApproval === "Yes" ||
    activity?.activityApproval === "yes";
  const isActivitySubmitForApprovalStatus =
    opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED";
  const isActivityApproveForApprovalStatus =
    opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_APPROVED";
  let conditionalButtonsConfig;
  if (isActivityApproved) {
    if (
      canGiveApproval &&
      (isActivitySubmitForApprovalStatus || isActivityApproveForApprovalStatus)
    ) {
      conditionalButtonsConfig = onlyApproveButtonConfig;
    } else if (
      (canGiveApproval && !isActivitySubmitForApprovalStatus) ||
      !isActivityApproveForApprovalStatus
    ) {
      conditionalButtonsConfig = approvalButtonsConfig;
    } else if (!isActivitySubmitForApprovalStatus && !canGiveApproval) {
      conditionalButtonsConfig = approvalButtonsConfig;
    }
  } else {
    conditionalButtonsConfig = buttonsConfig;
  }

  let disableAllFormFields = false;
  if (isActivityApproved) {
    if (canGiveApproval) {
      disableAllFormFields =
        isLost === true ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_APPROVED" ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_OPEN" ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_CLOSED";
    } else {
      disableAllFormFields = !(
        (isLost === false &&
          opportunityInitialStatus ===
            "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS") ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_REJECTED"
      );
    }
  } else {
    disableAllFormFields =
      isLost === true ||
      opportunityInitialStatus !==
        "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS";
  }

  // Use activity tasks hook
  const {
    handleCreateTask,
    TasksTable,
    TaskFormDrawer,
    isAllTasksCompleted,
    isTaskDetailsLoading,
    NotesTable,
    NoteFormDrawer,
    isNotesLoading,
  } = useActivityTasks({
    activity,
    dynamicValues,
    isFormDisabled:
      disableAllFormFields || loading || isActivitySubmitForApprovalStatus,
    canEditActivity,
  });

  const handleApproveReject = async (
    statusId: number,
    suppressBreadCrumb = false,
    actionType: string
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    if (suppressBreadCrumb) setSuppressBreadCrumbAdvance(true);
    try {
      const submit = await activityFormRef?.current?.submitAll?.();

      if (submit?.isAllValid) {
        const payload = {
          opportunityActivityId: activity.opportunityActivityId,
          statusLid: statusId?.data[0]?.id,
          activityStatusKey: actionType,
          brokingSlipDetails: {
            ...submit?.result,
            documents: transformDocuments(submit?.result?.documents || []),
          },
        };
        mutation.mutate(
          {
            endpoint: endPoints.activityApproval(
              activity.opportunityActivityId
            ),
            method: HTTP_METHODS.PUT,
            data: payload,
          },
          {
            onSuccess: (response) => {
              setStatusLidState(statusId?.data[0]?.id);
            },
          }
        );
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

  const approve = () =>
    handleApproveReject(approvedStatusData, false, "APPROVE_ACTIVITY");
  const reject = () =>
    handleApproveReject(rejectedStatusData, true, "REJECT_ACTIVITY");
  const submitForApproval = () =>
    attemptSubmit(submitStatusDataForApproval, true);
  const actionMap = {
    saveActivity,
    approve,
    reject,
    submitForApproval,
    submit: () => attemptSubmit(submitStatusData),
  };

  const downloadFileMutate = useApiMutation({
    config: {
      onSuccess: (response) => {
        const fileUrl = response?.data;
        if (fileUrl) {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = ""; // Optional: provide a filename if you want a custom name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          dispatch(setToastMessage(DOWNLOAD_URL_NOT_FOUND));
        }
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleFileDownload = () => {
    downloadFileMutate.mutate({
      endpoint: endPoints.emailReportDownload,
      method: HTTP_METHODS.POST,
      data: {
        opportunityId: opportunityId,
        activityKey: "broking_slip_activity",
      },
    });
  };

  return (
    <>
      {isExportAllowed && <CommonButton
        onClick={handleFileDownload}
        variantType="secondary"
        size="small"
        disabled={
          opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_OPEN" ||
          opportunityInitialStatus ===
            "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS"
        }
      >
        <img src={XlsIcon} alt="Excel Icon" />
        <ButtonTypography>{EXPORT_TO_EXCEL}</ButtonTypography>
      </CommonButton>}
      <CommonActivitiesMainContainer
        data-testId={
          disableAllFormFields ||
          !canEditActivity ||
          isActivitySubmitForApprovalStatus
            ? "common-activities-main-container-disabled"
            : "common-activities-main-container"
        }
        ref={accordionRef}
      >
        <VersionTabs
          tabs={tabs}
          setTabs={setTabs}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          onBeforeTabChange={handleBeforeTabChange}
          onAddTab={handleAddTab}
          enableAddTab={!disableAllFormFields || !canEditActivity}
          enableEditTab={!disableAllFormFields || !canEditActivity}
        />
        <CoverDetailsContainer>
          {tabs.map(
            (tab) =>
              tab.id === selectedTab && (
                <Box key={tab.id}>
                  <VersionForm
                    key={tab.id}
                    selectedTab={selectedTab}
                    tabs={tabs}
                    setTabs={setTabs}
                    currentTabData={tab}
                    setSelectedTab={setSelectedTab}
                    versionFormConfig={resolvedVersionConfig}
                    activity={activity}
                    disableAllFormFields={
                      disableAllFormFields || !canEditActivity
                    }
                  />
                </Box>
              )
          )}
        </CoverDetailsContainer>
        <NestedDynamicForm
          config={resolvedBrokingSlipConfig}
          ref={activityFormRef}
          disableAllFormFields={
            disableAllFormFields ||
            !canEditActivity ||
            isActivitySubmitForApprovalStatus
          }
        />

        <RfpDivider />

        {/* Tasks Section */}
        {TasksTable()}
        {TaskFormDrawer()}

        {/* Notes Section */}
        {NotesTable()}
        {NoteFormDrawer()}

        {/* Conditional Button Rendering Logic */}
        {conditionalButtonsConfig ? (
          <ActivitiesButtonsContainer>
            {/* Conditional Rendering of Approval Status Messages */}
            {!canGiveApproval && isActivitySubmitForApprovalStatus && (
              <div>
                {WAITING_FOR_ACTIVITY_APPROVAL_BY}{" "}
                <strong>
                  {approverName ||
                    brokingSlipGetData?.getFormData?.approverDetails?.name}
                </strong>
              </div>
            )}

            {isActivityApproveForApprovalStatus && (
              <div>
                {THIS_ACTIVITY_WAS_APPROVED_BY}{" "}
                <strong>
                  {brokingSlipGetData?.getFormData?.approverDetails?.name}
                </strong>{" "}
                on{" "}
                {formatDate(
                  brokingSlipGetData?.getFormData?.approverDetails?.status
                    ?.approvedOn
                )}{" "}
                at{" "}
                {
                  brokingSlipGetData?.getFormData?.approverDetails?.status
                    ?.approvedTime
                }
              </div>
            )}

            {/* Button rendering only when not waiting for or already approved */}
            {!(
              (!canGiveApproval && isActivitySubmitForApprovalStatus) ||
              isActivityApproveForApprovalStatus
            ) ? (
              <>
                {conditionalButtonsConfig?.map((button) => {
                  let isButtonDisabled = false;
                  const actionHandler = actionMap[button.onClick || ""];
                  if (
                    button.onClick === "submitForApproval" ||
                    button.onClick === "approve" ||
                    button.onClick === "submit"
                  ) {
                    if (!isAllTasksCompleted || isTaskDetailsLoading) {
                      isButtonDisabled = true;
                    }
                  }
                  return (
                    <Button
                      key={button.key}
                      variantType={button.componentProps?.variantType}
                      style={button.componentProps?.style}
                      onClick={actionHandler}
                      disabled={
                        disableAllFormFields ||
                        !canEditActivity ||
                        loading ||
                        isSaving ||
                        isButtonDisabled
                      }
                    >
                      {button.label}
                    </Button>
                  );
                })}
              </>
            ) : null}
          </ActivitiesButtonsContainer>
        ) : (
          <ButtonWrapper>
            <Button
              variantType="secondary"
              onClick={saveActivity}
              color="secondary"
              sizeType="small"
              disabled={
                disableAllFormFields || !canEditActivity || loading || isSaving
              }
            >
              {SAVE_ACTIVITY}
            </Button>
            <Button
              onClick={() => attemptSubmit(submitStatusData)}
              variantType="primary"
              color="primary"
              sizeType="small"
              disabled={
                disableAllFormFields ||
                !tabs.some((tab) => Boolean(tab.versionId)) ||
                !canEditActivity ||
                loading ||
                isTaskDetailsLoading ||
                !isAllTasksCompleted
              }
            >
              {SUBMIT_ACTIVITY}
            </Button>
          </ButtonWrapper>
        )}

        <CustomModal
          open={showUnsavedModal}
          handleClose={() => setShowUnsavedModal(false)}
          heading={"Unsaved Version"}
          buttons={[
            {
              label: "Cancel",
              onClick: () => setShowUnsavedModal(false),
              variant: "secondary",
            },
            {
              label: "Proceed",
              onClick: () => {
                if (pendingStatusId) {
                  handleSubmit(pendingStatusId);
                }
                setShowUnsavedModal(false);
                setPendingStatusId(null);
              },
              variant: "primary",
            },
          ]}
        >
          {UNSAVED_VERSION_WARNING}
        </CustomModal>
        <CustomModal
          open={!!pendingTabSwitch}
          handleClose={() => setPendingTabSwitch(null)}
          heading={"Unsaved Version"}
          buttons={[
            {
              label: "Cancel",
              onClick: () => setPendingTabSwitch(null),
              variant: "secondary",
            },
            {
              label: "Proceed",
              onClick: confirmTabSwitch,
              variant: "primary",
            },
          ]}
        >
          {UNSAVED_VERSIONS}
        </CustomModal>
        <CustomModal
          open={showAddTabConfirmation}
          handleClose={() => setShowAddTabConfirmation(false)}
          heading={"Unsaved Version"}
          buttons={[
            {
              label: "Cancel",
              onClick: () => setShowAddTabConfirmation(false),
              variant: "secondary",
            },
            { label: "Proceed", onClick: confirmAddTab, variant: "primary" },
          ]}
        >
          {UNSAVED_VERSIONS}
        </CustomModal>
        <CustomModal
          open={showNoVersionModal}
          handleClose={() => setShowNoVersionModal(false)}
          heading={"No Versions"}
          buttons={[
            {
              label: "Ok",
              onClick: () => setShowNoVersionModal(false),
              variant: "primary",
            },
          ]}
        >
          {ATLEAST_ONE_VERSION_REQUIRED}
        </CustomModal>
        {infoModalState.open && (
          <CustomModal
            open={infoModalState.open}
            handleClose={() =>
              setInfoModalState({ ...infoModalState, open: false })
            }
            heading={infoModalState.title}
            buttons={[
              {
                label: "Ok",
                onClick: () => {
                  infoModalState.onConfirm?.();
                  setInfoModalState({ ...infoModalState, open: false });
                },
                variant: "primary",
              },
            ]}
          >
            {infoModalState.message}
          </CustomModal>
        )}
      </CommonActivitiesMainContainer>
    </>
  );
};
export default BrokingSlipGeneration;
