import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import {
  CoverTypography,
  DuplicateVersionIcon,
  IconTypography,
} from "../../../../../components/VersionsTabs/styles";
import {
  ALERT_MESSAGES,
  BASIC_COVERS,
  DUPLICATE,
  ENTER_DETAILS,
  SAVE_CURRENT_VERSION_BEFORE_DUPLICATING_MESSAGE,
  DUPLICATE_CURRENT_VERSION,
  SAVE_VERSION,
  DELETE_VERSION_CONFIRMATION_MSG,
  UNSAVED_CHANGES_DUPLICATE_MSG,
  VERSION_SAVED_SUCCESSFULLY,
  VERSION_FAILED_MSG,
  ENDORSEMENT_TOASTS,
} from "../../../../../constants/index";
import { TabData } from "apps/ui/iwork/src/app/components/VersionsTabs";
import {
  CoverDetailsAndWaiverContainer,
  IconAndTextButtonWrapper,
  IconsContainer,
  IconsContainerWrapper,
  MainCoverDetailsContainer,
  VersionFormButton,
  VersionFormContainer,
} from "./styles";

import LookUpCoverDetailsHeader from "../../../../../components/LookUpCoverDetailsHeader";
import { CustomDivider } from "../../EnterQuote/QuoteForm/styles";
import DuplicateIcon from "../../../../../assets/svgs/duplicate-icon.svg";
import DeleteIcon from "../../../../../assets/svgs/thrash-icon.svg";
import { Alert, Box, Divider } from "@mui/material";
import {
  DELETE,
  CustomModal,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  setToastMessage,
  useApiMutation,
  endPoints,
  useApiQuery,
  normalizeUsingConfigForResetting,
  parseNumbersDeep,
} from "@ui/ui-lib";
import { useParams } from "react-router-dom";
import { HTTP_METHODS } from "@ui/ui-lib";
import { CommonActivitiesMainContainer } from "../../../CommonActivities/styles";
import { calculatePercentageAmountUpdate } from "../../../../../Utils/calculatePercentageAmountUpdate";

interface VersionFormProps {
  selectedTab: string;
  setTabs: React.Dispatch<React.SetStateAction<TabData[]>>;
  tabs: TabData[];
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  currentTabData: TabData;
  versionFormConfig: any;
  activity: any;
  disableAllFormFields: boolean;
}

const cloneFormValues = <T,>(data: T): T => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(data);
    } catch (_error) {
      // Fallback to JSON cloning below
    }
  }

  try {
    return JSON.parse(JSON.stringify(data));
  } catch (_error) {
    return data;
  }
};

const parseNumericFieldValue = (value: unknown): number => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (normalized === "") {
      return 0;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const VersionForm: React.FC<VersionFormProps> = ({
  selectedTab,
  setTabs,
  tabs,
  setSelectedTab,
  currentTabData,
  versionFormConfig,
  activity,
  disableAllFormFields,
}) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const containerRef = useRef<HTMLDivElement | null>(null); //for the version form container
  const [isLoading, setLoading] = React.useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = React.useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] =
    React.useState(false);
  const [showDuplicateDirtyConfirmModal, setShowDuplicateDirtyConfirmModal] =
    React.useState(false);
  // Initialize to true. Since VersionForm is keyed by tab.id in its parent,
  // it remounts on tab change, resetting this ref for each new tab instance.
  const skipDirtyRef = React.useRef(true);
  const prevFormValuesRef = React.useRef<Record<string, any> | null>(null);
  const skipNextAutoPopulateRef = React.useRef(false);

  const setPreviousValues = React.useCallback(
    (values?: Record<string, any> | null) => {
      if (!values) {
        prevFormValuesRef.current = null;
        return;
      }
      prevFormValuesRef.current = cloneFormValues(values);
    },
    []
  );

  const handleBrokerageAutoPopulate = React.useCallback(
    (values?: Record<string, any>) => {
      if (!values || typeof values !== "object") {
        setPreviousValues(values);
        return;
      }

      if (skipNextAutoPopulateRef.current) {
        skipNextAutoPopulateRef.current = false;
        setPreviousValues(values);
        return;
      }

      const versionDetails = values.versionDetails;
      if (!versionDetails || typeof versionDetails !== "object") {
        setPreviousValues(values);
        return;
      }

      const previousValues = prevFormValuesRef.current;
      const prevVersionDetails =
        previousValues && typeof previousValues === "object"
          ? previousValues.versionDetails
          : undefined;

      const update = calculatePercentageAmountUpdate(
        parseNumericFieldValue(versionDetails.basicPremium),
        parseNumericFieldValue(versionDetails.brokeragePercentage),
        parseNumericFieldValue(versionDetails.brokerageAmount),
        parseNumericFieldValue(prevVersionDetails?.basicPremium),
        parseNumericFieldValue(prevVersionDetails?.brokeragePercentage),
        parseNumericFieldValue(prevVersionDetails?.brokerageAmount),
        "brokeragePercentage",
        "brokerageAmount",
        { skipCountryCheck: true }
      );

      if (!update || Object.keys(update).length === 0) {
        setPreviousValues(values);
        return;
      }

      if (formRef.current?.setValues) {
        const nextVersionDetails = {
          ...versionDetails,
          ...update,
        };

        skipNextAutoPopulateRef.current = true;
        formRef.current.setValues({
          versionDetails: nextVersionDetails,
        });

        setPreviousValues({
          ...values,
          versionDetails: nextVersionDetails,
        });
        return;
      }

      setPreviousValues(values);
    },
    [formRef, setPreviousValues]
  );

  const scrollToFormStart = () => {
    const accordionEl = containerRef.current?.closest(
      '[data-testid="Root-accordion"]'
    ) as HTMLElement | null;
    accordionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleValuesChange = React.useCallback(
    (values?: Record<string, any>) => {
      if (skipDirtyRef.current) {
        skipDirtyRef.current = false;
      } else {
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === selectedTab
              ? tab.isDirty
                ? tab
                : { ...tab, isDirty: true }
              : tab
          )
        );
      }
      handleBrokerageAutoPopulate(values);
    },
    [handleBrokerageAutoPopulate, selectedTab, setTabs]
  );

  const { id: opportunityId } = useParams<{ id: string }>();

  const {
    data: versionData,
    isLoading: isVersionLoading,
    isError: isVersionError,
  } = useApiQuery({
    queryKey: ["versionData", currentTabData?.versionId],
    url: endPoints.getopportunityVersionById(
      opportunityId,
      currentTabData?.versionId
    ),
    enabled: !!Boolean(currentTabData?.versionId) && Boolean(opportunityId),
  });

  useEffect(() => {
    // Load data for existing, saved versions
    if (versionData?.data && formRef.current && currentTabData?.versionId) {
      skipDirtyRef.current = true;
      formRef.current?.resetForms?.(versionData?.data?.formData);
      setPreviousValues(versionData?.data?.formData);
      // Explicitly mark tab as not dirty after loading saved data
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === selectedTab ? { ...t, isDirty: false } : t
        )
      );
    }
  }, [
    versionData,
    currentTabData?.versionId,
    selectedTab,
    setTabs,
    formRef,
    setPreviousValues,
  ]);

  useEffect(() => {
    // Load data for newly duplicated (unsaved) tabs that have 'values'
    if (
      currentTabData.versionId == null && // It's an unsaved version
      currentTabData.values && // It has values (presumably from duplication)
      Object.keys(currentTabData.values).length > 0 && // Ensure values is not an empty object
      formRef.current // Ensure formRef is available
    ) {
      skipDirtyRef.current = true;
      formRef.current?.resetForms?.(currentTabData.values);
      setPreviousValues(currentTabData.values);
      // Explicitly mark tab as not dirty and clear the temporary 'values'
      // as they are now loaded into the form.
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === selectedTab
            ? { ...t, isDirty: false, values: {} } // Clear 'values'
            : t
        )
      );
    }
  }, [
    currentTabData.versionId,
    currentTabData.values,
    selectedTab,
    setTabs,
    formRef,
    setPreviousValues,
  ]);

  const dispatch = useDispatch();

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        setLoading(false);
        if (response?.data) {
          setTabs((prevTabs) =>
            prevTabs.map((tab) => {
              if (tab.id === selectedTab) {
                return {
                  ...tab,
                  label: response?.data?.versionName,
                  versionId: response.data.versionId, // Assuming the response has an 'id' field for the version
                  defaultVersionName: response.data.versionName,
                  isDirty: false,
                };
              }
              return tab;
            })
          );
        }
      },
      onError: async (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleSubmit = async () => {
    const submit = await formRef?.current?.submitAll?.();
    const isPutCall = Boolean(currentTabData?.versionId);

    if (submit?.isAllValid) {
      setLoading(true);
      // const parsedResult = parseNumbersDeep(submit?.result || {});
      // if (
      //   parsedResult &&
      //   parsedResult?.versionDetails?.brokeragePercentage !== undefined
      // ) {
      //   parsedResult.versionDetails.brokeragePercentage = String(
      //     parsedResult?.versionDetails?.brokeragePercentage
      //   );
      // }
      const payload = {
        opportunityActivityId: activity?.opportunityActivityId,
        statusLid: 0, //backend is expecting this field, but we are not using it in this form
        brokingSlipVersionDetails: {
          versionName: currentTabData?.label,
          formData: submit?.result || {},
        },
        activityStatusKey: "COMPLETE_ACTIVITY", // backend is expecting this field, but we are not using it in this form
      };
      mutation.mutate(
        {
          endpoint: isPutCall
            ? endPoints.updateVersion(currentTabData?.versionId)
            : endPoints.opportunityManagement,
          method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
          data: payload,
        },
        {
          onSuccess: () => {
            dispatch(setToastMessage(VERSION_SAVED_SUCCESSFULLY));
          },
          onError: (error) => {
            dispatch(setToastMessage(VERSION_FAILED_MSG));
          },
        }
      );
    } else {
      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
      );
      scrollToFormStart();
    }
  };

  const handleDuplicateTab = () => {
    const currentTab = tabs.find((tab) => tab.id === selectedTab);
    if (!currentTab) return;

    if (!currentTab.versionId) {
      // If the current version is not saved, show an alert.
      setShowDuplicateModal(true);
      return;
    }

    if (currentTab.isDirty) {
      // If the current (saved) version is dirty, ask for confirmation to discard changes.
      setShowDuplicateDirtyConfirmModal(true);
      return;
    }

    // Proceed with duplication if saved and not dirty
    proceedWithDuplication();
  };

  const proceedWithDuplication = () => {
    const currentTab = tabs.find((tab) => tab.id === selectedTab);
    if (!currentTab || !currentTab.versionId) return; // Should be a saved version by now

    const currentValues = formRef.current?.getValues?.() || {};
    let copyIndex = 2;
    let newLabel = `${currentTab.label} Copy`;
    while (tabs.find((tab) => tab.label === newLabel)) {
      newLabel = `${currentTab.label} Copy ${copyIndex++}`;
    }
    const newId = `v${tabs.length + 1}`;
    setTabs([
      ...tabs,
      {
        id: newId,
        label: newLabel,
        isEditing: false,
        values: {
          ...currentValues,
        },
        isDirty: true,
      },
    ]);
    setSelectedTab(newId);
  };

  const executeDelete = () => {
    const isSavedVersion = Boolean(currentTabData?.versionId);
    const fallbackNewTab = () => {
      const normalizedConfig =
        normalizeUsingConfigForResetting(versionFormConfig);
      skipDirtyRef.current = true;
      formRef.current?.resetForms?.({ normalizedConfig });
      setPreviousValues({ normalizedConfig });
      const newTab = {
        id: "v1",
        label: "Version 1",
        isEditing: false,
        values: {},
        isDirty: false,
      };
      setTabs([newTab]);
      setSelectedTab(newTab.id);
    };

    if (!isSavedVersion) {
      const filtered = tabs.filter((tab) => tab.id !== selectedTab);

      if (filtered.length > 0) {
        setTabs(filtered);
        setSelectedTab(filtered[0].id);
      } else {
        fallbackNewTab();
      }
      setShowDeleteConfirmModal(false);
      return;
    }

    // Saved version → Delete from backend
    mutation.mutate(
      {
        endpoint: endPoints.getopportunityVersionById(
          opportunityId,
          currentTabData?.versionId
        ),
        method: HTTP_METHODS.DELETE,
        data: {},
      },
      {
        onSuccess: () => {
          const filtered = tabs.filter((tab) => tab.id !== selectedTab);
          if (filtered.length > 0) {
            setTabs(filtered);
            setSelectedTab(filtered[0].id);
          } else {
            fallbackNewTab();
          }
        },
        onSettled: () => {
          setShowDeleteConfirmModal(false);
        },
      }
    );
  };

  return (
    <CommonActivitiesMainContainer ref={containerRef}>
      <IconsContainerWrapper>
        <Box>{ENTER_DETAILS}</Box>
        {!disableAllFormFields && (
          <IconsContainer>
            <IconAndTextButtonWrapper
              disabled={disableAllFormFields || !currentTabData?.versionId}
              onClick={handleDuplicateTab}
              title={DUPLICATE}
            >
              <DuplicateVersionIcon src={DuplicateIcon} />
              <IconTypography>{DUPLICATE}</IconTypography>
            </IconAndTextButtonWrapper>
            <CustomDivider />
            <IconAndTextButtonWrapper
              onClick={() => setShowDeleteConfirmModal(true)}
              title={DELETE}
            >
              <DuplicateVersionIcon src={DeleteIcon} />
              <IconTypography>{DELETE}</IconTypography>
            </IconAndTextButtonWrapper>
          </IconsContainer>
        )}
      </IconsContainerWrapper>
      {versionFormConfig.length > 0 && (
        <NestedDynamicForm
          disableAllFormFields={disableAllFormFields}
          config={versionFormConfig}
          ref={formRef}
          onValuesChange={handleValuesChange}
        />
      )}

      <VersionFormButton
        disabled={disableAllFormFields}
        loading={isLoading}
        onClick={handleSubmit}
      >
        {SAVE_VERSION}
      </VersionFormButton>
      <Divider sx={{ margin: "10px 0 20px 0" }} />
      <CustomModal
        open={showDuplicateModal}
        handleClose={() => setShowDuplicateModal(false)}
        heading={DUPLICATE_CURRENT_VERSION}
        buttons={[
          {
            label: "Ok",
            onClick: () => setShowDuplicateModal(false),
            variant: "primary",
          },
        ]}
      >
        {SAVE_CURRENT_VERSION_BEFORE_DUPLICATING_MESSAGE}
      </CustomModal>
      <CustomModal
        open={showDeleteConfirmModal}
        handleClose={() => setShowDeleteConfirmModal(false)}
        heading={"Confirm Delete"}
        buttons={[
          {
            label: "Cancel",
            onClick: () => setShowDeleteConfirmModal(false),
            variant: "secondary",
          },
          {
            label: "Delete",
            onClick: executeDelete,
            variant: "primary",
            color: "error",
          },
        ]}
      >
        {DELETE_VERSION_CONFIRMATION_MSG}
      </CustomModal>
      <CustomModal
        open={showDuplicateDirtyConfirmModal}
        handleClose={() => setShowDuplicateDirtyConfirmModal(false)}
        heading={"Unsaved Changes"}
        buttons={[
          {
            label: "Cancel",
            onClick: () => setShowDuplicateDirtyConfirmModal(false),
            variant: "secondary",
          },
          {
            label: "Discard and Duplicate",
            onClick: () => {
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === selectedTab
                    ? {
                        ...t,
                        isDirty: false,
                        label: t.defaultVersionName || t.label,
                      }
                    : t
                )
              );
              proceedWithDuplication();
              setShowDuplicateDirtyConfirmModal(false);
            },
            variant: "primary",
          },
        ]}
      >
        {" "}
        {UNSAVED_CHANGES_DUPLICATE_MSG}{" "}
      </CustomModal>
    </CommonActivitiesMainContainer>
  );
};

export default VersionForm;
