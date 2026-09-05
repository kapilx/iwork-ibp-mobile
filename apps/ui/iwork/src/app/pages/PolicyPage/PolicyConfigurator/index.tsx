import { CircularProgress, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // No longer needed here
import { useDispatch, useSelector } from "react-redux";
import backgroundImage from "../../../assets/webp/no-data-found-background-image.webp";
import {
  Step,
  endPoints,
  VALIDATION_ERROR_MESSAGE,
  BUTTON_LABELS,
  BUTTON_VARIANTS,
  SAVE,
  useApiQuery,
  useApiMutation,
  FeatureKey,
  selectHasPermission,
  setToastMessage,
  RootState,
  VALIDATION_MSG_POLICY_CHOICES_SECTION,
  CustomModal,
  DynamicForm,
  environment,
} from "@ui/ui-lib";
import {
  LOADING_POLICY_CONFIGURATION,
  NO_POLICY_CONFIGURATOR,
  POLICY_CONFIGURATOR_BUTTONS,
  POLICY_CONFIGURATOR_TOASTS,
  POLICY_CONFIGURATOR_MODALS,
  POLICY_CONFIGURATOR_ALERTS,
} from "../../../constants";
import { StyledPrevButton } from "../../CompanyPage/AddCompany/styles";
import { StyledNextButton } from "../../OpportunitiesPage/OpportunitiesForm/styles";
import { getInitialPolicyConfiguration, getSteps, stepLabels } from "../Constants";
import { buildPolicyChoicesStructure } from "../hooks/usePolicyChoicesManager";
import PolicyProgressStepper from "../PolicyProgressStepper/PolicyProgressStepper";
import {
  exportPolicyDefaultValues,
  exportPolicyFormConfig,
} from "./config";
import { areDeepEqual } from "../utils/formatters";
import { PolicyChoicesSection } from "./PolicyChoicesSection";
import { PolicyComponentsSection } from "./PolicyComponentsSection";
import { PolicyConstraintsSection } from "./PolicyConstraintsSection";
import PolicyLocationsSection from "./PolicyLocationsSection";
import PolicyUserDetailsSection from "./PolicyUserDetailsSection";
import { PolicyParametersSection } from "./PolicyParametersSection";
import { PolicyRelationshipsSection } from "./PolicyRelationshipsSection";
import PolicyTemplateSection from "./PolicyTemplateSection";
import ExtractPolicyFromPdfModal from "./ExtractPolicyFromPdfModal";
import {
  ConfigStep,
  Policy_Configurator_Status,
  POLICY_CONFIGURATOR_STATUS,
  PolicyComponent,
  PolicyConfiguration,
  PolicyResponse,
} from "./policytypes";
import { SectionRef } from "./sectionRef";
import {
  ActionBarInner,
  ActionBarContent,
  ApprovalMessageText,
  ContentWrapper,
  Heading,
  LoaderWrapper,
  LoadingText,
  PolicyConfiguratorNoDataBox,
  PolicyConfiguratorNoDataText,
  SectionHeader,
  StepPaper,
  StepperContainer,
  StyledBtnContainer,
  PolicyConfiguratorStyledContainer,
  StyledWarningAlert,
  StyledInfoAlert,
  StyledSubmitForApprovalMessage,
  StyledStackConatiner,
} from "./styles";

const isPolicyLocationsEnabled = environment.featureFlag.FF_IWORK_POLICY_LOCATIONS;
const steps = getSteps(isPolicyLocationsEnabled);
const lastStep = steps[steps.length - 1];

const TOAST_NAVIGATION_DELAY_MS = 3000;

export default function ConfiguratorPage() {
  const navigate = useNavigate();
  const { policyId } = useParams<{ policyId?: string }>();
  const location = useLocation();
  const state = location?.state;

  const policyConfigurationStatus = useSelector(
    (state: RootState) =>
      state.user.lookupValues?.data?.POLICY_CONFIGURATION_STATUS || []
  );

  const getStatusValueById = useCallback(
    (id?: number): Policy_Configurator_Status | undefined => {
      return policyConfigurationStatus.find((s: any) => s.id === id)
        ?.lookUpValue as Policy_Configurator_Status | undefined;
    },
    [policyConfigurationStatus]
  );

  const getStatusIdByValue = useCallback(
    (val: Policy_Configurator_Status): number | undefined => {
      return policyConfigurationStatus.find(
        (s: any) => s.lookUpValue.toLowerCase() === val.toLowerCase()
      )?.id;
    },
    [policyConfigurationStatus]
  );

  // Use policyId from either URL params or state
  const effectivePolicyId = policyId;
  const shouldFetchConfig = !!effectivePolicyId;
  const [isPageLoading, setIsPageLoading] =
    useState<boolean>(shouldFetchConfig);

  const componentsSectionRef = useRef<SectionRef>(null);
  const relationshipsSectionRef = useRef<SectionRef>(null);
  const parametersSectionRef = useRef<SectionRef>(null);
  const templateSectionRef = useRef<SectionRef>(null);
  const constraintsSectionRef = useRef<SectionRef>(null); // Add ref for PolicyConstraintsSection
  const choicesSectionRef = useRef<SectionRef>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pageTopAnchorRef = useRef<HTMLDivElement | null>(null);

  const [policyConfiguration, setPolicyConfiguration] =
    useState<PolicyConfiguration>(getInitialPolicyConfiguration());

  const [configuratorStatus, setConfiguratorStatus] =
    useState<Policy_Configurator_Status>(POLICY_CONFIGURATOR_STATUS.DRAFT);
  const [isEditable, setIsEditable] = useState<boolean>(true);

  // Check permission for editing LIVE policy configurations
  const canEditLivePolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_LIVE_POLICY_CONFIGURATION)(state)
  );
  const [isLiveEditMode, setIsLiveEditMode] = useState<boolean>(false);
  const [liveEditSnapshot, setLiveEditSnapshot] = useState<
    PolicyConfiguration["configuration"] | null
  >(null);
  const [liveEditModalOpen, setLiveEditModalOpen] = useState<boolean>(false);
  const [approvalConfirmModalOpen, setApprovalConfirmModalOpen] =
    useState<boolean>(false);
  const [resubmitApprovalModalOpen, setResubmitApprovalModalOpen] =
    useState<boolean>(false);

  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  const [currentStep, setCurrentStep] =
    useState<ConfigStep>("policyComponents");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [attemptedValidationStep, setAttemptedValidationStep] =
    useState<ConfigStep | null>(null);
  const { mutateAsync } = useApiMutation({});
  const { mutateAsync: mutateApproval } = useApiMutation({});
  const [remarks, setRemarks] = useState<string>("");
  const exportModalBoxRef = useRef<HTMLDivElement | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormMethods, setExportFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const { mutateAsync: mutateExport } = useApiMutation({});
  const [extractPdfModalOpen, setExtractPdfModalOpen] = useState(false);
  const [wasConfigExtracted, setWasConfigExtracted] = useState(false);
  const [showExtractionBanner, setShowExtractionBanner] = useState(false);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const progressSteps: Step[] = steps.map((stepKey) => ({
    id: stepKey,
    label: stepLabels[stepKey],
    status:
      steps.indexOf(stepKey) < steps.indexOf(currentStep)
        ? "complete"
        : steps.indexOf(stepKey) === steps.indexOf(currentStep)
        ? "active"
        : "default",
  }));

  const mapApiStepToConfigStep = useCallback(
    (apiStep: number): ConfigStep => {
      const stepMap: Record<number, ConfigStep> = {
        1: "policyComponents",
        2: "policyRelationships",
        3: "policyChoiceTemplate",
        4: "policyParameters",
        5: "policyChoices",
        6: "policyConstraints",
        7: "policyLocations",
      };
      return stepMap[apiStep] || "policyComponents";
    },
    [] // Empty dependency array: function is memoized and stable
  );

  const updateConfiguratorStatusAndEditability = useCallback(
    (apiStatus: Policy_Configurator_Status, forceLiveEdit: boolean = false) => {
      setConfiguratorStatus(apiStatus);
      const isNormallyEditable =
        apiStatus === POLICY_CONFIGURATOR_STATUS.DRAFT ||
        apiStatus === POLICY_CONFIGURATOR_STATUS.WIP ||
        apiStatus === POLICY_CONFIGURATOR_STATUS.COMPLETE;

      // Allow editing LIVE policies if user has privilege and forceLiveEdit is true
      const canEdit =
        isNormallyEditable ||
        (forceLiveEdit &&
          apiStatus === POLICY_CONFIGURATOR_STATUS.LIVE &&
          canEditLivePolicy);

      setIsEditable(canEdit);

      // Set live edit mode flag
      if (
        forceLiveEdit &&
        apiStatus === POLICY_CONFIGURATOR_STATUS.LIVE &&
        canEditLivePolicy
      ) {
        setIsLiveEditMode(true);
      } else {
        setIsLiveEditMode(false);
      }
    },
    [canEditLivePolicy]
  );

  // Update API query to use the effectivePolicyId
  const {
    data: configuratorGetData,
    isLoading: isFetchingPolicy,
    error: fetchError,
    refetch: refetchConfigurator,
  } = useApiQuery({
    url: shouldFetchConfig
      ? endPoints.policyConfigurationById(effectivePolicyId)
      : "",
    queryKey: ["policy-configurations", effectivePolicyId],
    enabled: shouldFetchConfig,
  });
  const companyId = configuratorGetData?.data?.companyId;
  const { data: companyDetailsData } = useApiQuery({
    url: companyId ? endPoints.companyById(companyId) : "",
    queryKey: ["company-for-configurator", companyId],
    enabled: !!companyId,
  });
  const policyConfigurationLocations =
    (companyDetailsData?.data?.policyLocations as any[]) ?? [];

  // Merge navigation state with API-fetched values so the stepper header
  // still shows company/policy names when the page is accessed directly by URL
  // (location.state is null on direct navigation or page refresh).
  const stepperData = useMemo(
    () => ({
      ...state,
      policyId: state?.policyId ?? effectivePolicyId,
      companyName:
        state?.companyName ||
        (companyDetailsData?.data as any)?.companyName ||
        (companyDetailsData?.data as any)?.displayName,
      policyName: state?.policyName,
    }),
    [state, companyDetailsData, effectivePolicyId]
  );

  const hasPreviousApproval = Boolean(
    (configuratorGetData?.data as any)?.approverId
  );
  const requestSentToName = (configuratorGetData?.data as PolicyResponse | undefined)
    ?.requestSentToName;
  const approverDetails = (configuratorGetData?.data as PolicyResponse | undefined)
    ?.approverDetails;

  useEffect(() => {
    if (
      policyConfigurationStatus.length &&
      configuratorGetData?.data?.policyConfiguartionStatusLid
    ) {
      const initial = getStatusValueById(
        configuratorGetData?.data?.policyConfiguartionStatusLid
      );
      if (initial) {
        updateConfiguratorStatusAndEditability(initial);
      }
    }
  }, [
    policyConfigurationStatus,
    configuratorGetData?.data?.policyConfiguartionStatusLid,
    updateConfiguratorStatusAndEditability,
    getStatusValueById,
  ]);

  useEffect(() => {
    if (configuratorGetData?.data) {
      const fetchedData: PolicyResponse = configuratorGetData.data;
      const defaultConfig = getInitialPolicyConfiguration();

      if (
        !fetchedData.policyConfiguration ||
        Object.keys(fetchedData.policyConfiguration).length === 0
      ) {
        fetchedData.policyConfiguration = defaultConfig.configuration;
        if (!fetchedData.policyStep || fetchedData.policyStep === 0) {
          fetchedData.policyStep = defaultConfig.step;
        }
      }
      if (!fetchedData.policyConfiguration?.policyOptions) {
        fetchedData.policyConfiguration.policyOptions = [];
      }
      if (!fetchedData.policyConfiguration?.constraints) {
        fetchedData.policyConfiguration.constraints = {} as any;
      }
      if (!fetchedData.policyConfiguration?.selectedLocationIds) {
        fetchedData.policyConfiguration.selectedLocationIds = [];
      } else {
        fetchedData.policyConfiguration.selectedLocationIds =
          fetchedData.policyConfiguration.selectedLocationIds.map((entry: any) =>
            typeof entry === 'number' ? { id: entry, address_1: '' } : entry
          );
      }
      if (fetchedData.policyConfiguration?.enablePolicyLocations === undefined) {
        fetchedData.policyConfiguration.enablePolicyLocations = false;
      }
      if (!fetchedData.policyConfiguration?.userDetailsSection) {
        fetchedData.policyConfiguration.userDetailsSection = {
          displayName: "User Details",
          items: [{ id: "ud-1", label: "", value: "" }],
        };
      }

      const statusFromApi =
        getStatusValueById(fetchedData.policyConfiguartionStatusLid) ||
        (fetchedData as any).policyStatus?.lookUpValue ||
        POLICY_CONFIGURATOR_STATUS.DRAFT;

      const isAlreadyFinished = [
        POLICY_CONFIGURATOR_STATUS.COMPLETE,
        POLICY_CONFIGURATOR_STATUS.SUBMITTED,
        POLICY_CONFIGURATOR_STATUS.LIVE,
        POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL,
        POLICY_CONFIGURATOR_STATUS.LIVEEDITSUBMIT,
      ].includes(statusFromApi as Policy_Configurator_Status);
      const resolvedStep =
        isPolicyLocationsEnabled && fetchedData.policyStep === 6 && isAlreadyFinished
          ? 7
          : fetchedData.policyStep;

      setPolicyConfiguration({
        id: fetchedData.id,
        status: statusFromApi as Policy_Configurator_Status,
        step: resolvedStep,
        configuration: fetchedData.policyConfiguration,
      });

      updateConfiguratorStatusAndEditability(
        statusFromApi as Policy_Configurator_Status
      );

      setCurrentStep(mapApiStepToConfigStep(resolvedStep));
      setIsPageLoading(false);
    }
  }, [configuratorGetData]);

  // useEffect(() => {
  //   if (!effectivePolicyId) {
  //     setPolicyConfiguration(getInitialPolicyConfiguration());
  //     setCurrentStep("policyComponents");
  //     setConfiguratorStatus("Wip");
  //     setIsEditable(true);
  //     setIsPageLoading(false);
  //   }
  // }, [effectivePolicyId]);

  useEffect(() => {
    if (shouldFetchConfig) {
      setIsPageLoading(isFetchingPolicy);
    } else {
      setIsPageLoading(false);
    }
  }, [isFetchingPolicy, shouldFetchConfig]);

  useEffect(() => {
    if (focusTargetId) {
      const element = document.getElementById(focusTargetId);
      if (element) element.focus();
      setFocusTargetId(null);
    }
  }, [focusTargetId]); // Removed setFocusTargetId from deps as it's stable

  const scrollToTop = () => {
    const performScroll = () => {
      if (pageTopAnchorRef.current) {
        pageTopAnchorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        document.body.scrollTop = 0;
      }
    };

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      window.requestAnimationFrame(performScroll);
    } else {
      performScroll();
    }
  };

  const scheduleNavigationToPolicyDetails = useCallback(() => {
    if (!effectivePolicyId) return;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      navigate(`/policies/${effectivePolicyId}`);
    }, TOAST_NAVIGATION_DELAY_MS);
  }, [effectivePolicyId, navigate]);

  const mapCurrentStepToPolicyStepNumber = useCallback(
    (step: ConfigStep): number => {
      const currentPolicyStepMap: Record<ConfigStep, number> = {
        policyComponents: 1,
        policyRelationships: 2,
        policyChoiceTemplate: 3,
        policyParameters: 4,
        policyChoices: 5,
        policyConstraints: 6,
        policyLocations: 7,
      };
      return currentPolicyStepMap[step];
    },
    []
  );

  useEffect(() => {
    if (isEditable) {
      if (
        policyConfiguration.step !==
        mapCurrentStepToPolicyStepNumber(currentStep)
      ) {
        setPolicyConfiguration((prev) => ({
          ...prev,
          step: mapCurrentStepToPolicyStepNumber(currentStep),
        }));
      }
    }
  }, [
    currentStep,
    isEditable,
    policyConfiguration.step,
    mapCurrentStepToPolicyStepNumber,
  ]);

  // Helper function to compute the next state of policyConfiguration
  // Add this to computeNextPolicyConfigurationState function
  const computeNextPolicyConfigurationState = (
    currentFullConfig: PolicyConfiguration,
    sectionData: Partial<PolicyConfiguration["configuration"]>
  ): PolicyConfiguration => {
    const newNestedConfiguration = {
      ...currentFullConfig.configuration,
      ...sectionData,
    };

    const initialConfig = getInitialPolicyConfiguration().configuration;

    // In LIVE edit mode, preserve existing data instead of resetting
    const shouldPreserveData =
      isLiveEditMode && configuratorStatus === POLICY_CONFIGURATOR_STATUS.LIVE;

    // After PDF extraction, carry over extracted choices exactly like LIVE edit mode does
    const shouldPreserveChoices = shouldPreserveData || wasConfigExtracted;

    // 1. Clear dependent sections when relationships change (skip in LIVE edit mode)
    if (
      !shouldPreserveData &&
      sectionData.relationships &&
      currentFullConfig.configuration.relationships
    ) {
      const previousRelations =
        currentFullConfig.configuration.relationships.enabledPolicyRelations ||
        [];
      const parentsRelationEnabled =
        sectionData.relationships.enabledPolicyRelations?.some(
          (relation) =>
            relation.type?.toLowerCase() === "parents" && relation.enabled
        ) ?? false;

      // Function to create a comparable string from a single relationship object
      const getComparableRelationString = (relation) => {
        const sortedConfiguredOptions = (relation.configuredOptions || [])
          .map((option) => ({
            name: option.name,
            maxAge: option.maxAge,
            minAge: option.minAge,
            enabled: option.enabled,
            // Omit maxAgeError and minAgeError as they are often UI-driven and not part of the core configuration change
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort by name for consistent comparison

        return JSON.stringify({
          type: relation.type,
          enabled: relation.enabled,
          maxCount: relation.maxCount,
          configuredOptions: sortedConfiguredOptions,
        });
      };

      // Create comparable JSON strings for both old and new relations
      const oldRelationsJSON = JSON.stringify(
        previousRelations.map(getComparableRelationString).sort() // Sort the strings themselves for consistent array comparison
      );

      const newRelationsJSON = JSON.stringify(
        sectionData.relationships.enabledPolicyRelations
          .map(getComparableRelationString)
          .sort() // Sort the strings themselves for consistent array comparison
      );

      if (oldRelationsJSON !== newRelationsJSON) {
        // Reset ONLY relationship-related parameters
        const preservedParameters =
          currentFullConfig.configuration.parameters.filter(
            (param) => param.type !== "relation"
          );

        newNestedConfiguration.parameters = [
          ...preservedParameters, // Preserve non-relationship parameters
          ...initialConfig.parameters.filter(
            (param) => param.type === "relation"
          ), // Reset relationship-related parameters to default
        ];
        newNestedConfiguration.policyOptions = shouldPreserveChoices
          ? buildPolicyChoicesStructure(
              newNestedConfiguration,
              currentFullConfig.configuration.policyOptions
            )
          : buildPolicyChoicesStructure(newNestedConfiguration);
      }

      if (!parentsRelationEnabled) {
        newNestedConfiguration.policyTemplate = {
          ...newNestedConfiguration.policyTemplate,
          parentalPolicy: undefined,
        };
      }
    }

    // 2. Handle component changes - preserve or reset based on mode
    if (sectionData.components) {
      const oldComponents = currentFullConfig.configuration.components;
      const newComponents = sectionData.components;

      // Only sum-insured OPTION changes reset/rebuild downstream template + choices.
      // All other component fields (sumInsuredModel, siMultipleLabel, siMultipleMin/Max,
      // nextSumInsuredId, type, label, flags) intentionally do NOT trigger a reset.
      const projectSumInsuredOptions = (comps: PolicyComponent[]) =>
        [...comps]
          .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
          .map((c) => ({ id: c.id, sumInsuredOptions: c.sumInsuredOptions }));

      if (
        !areDeepEqual(
          projectSumInsuredOptions(oldComponents),
          projectSumInsuredOptions(newComponents)
        )
      ) {
        if (shouldPreserveData) {
          // In LIVE edit mode: rebuild choices with existing data preserved
          newNestedConfiguration.policyOptions = buildPolicyChoicesStructure(
            newNestedConfiguration,
            currentFullConfig.configuration.policyOptions
          );
        } else {
          // Normal mode: reset template and choices
          newNestedConfiguration.policyTemplate = initialConfig.policyTemplate;
          newNestedConfiguration.policyOptions = initialConfig.policyOptions;
        }
      }
    }

    // 3. Handle template changes - preserve or reset based on mode
    if (sectionData.policyTemplate) {
      const oldTemplate = currentFullConfig.configuration.policyTemplate;
      const newTemplate = sectionData.policyTemplate;

      if (!areDeepEqual(oldTemplate, newTemplate)) {
        if (shouldPreserveChoices) {
          // LIVE edit mode or post-extraction: rebuild choices with existing data preserved
          newNestedConfiguration.policyOptions = buildPolicyChoicesStructure(
            newNestedConfiguration,
            currentFullConfig.configuration.policyOptions
          );
        } else {
          // Normal mode: reset choices
          newNestedConfiguration.policyOptions = initialConfig.policyOptions;
        }
      }
    }

    // 4. Rebuild choices when parameters change
    if (
      sectionData.parameters &&
      !areDeepEqual(
        sectionData.parameters,
        currentFullConfig.configuration.parameters
      )
    ) {
      if (shouldPreserveChoices) {
        // LIVE edit mode or post-extraction: rebuild with existing data preserved
        newNestedConfiguration.policyOptions = buildPolicyChoicesStructure(
          newNestedConfiguration,
          currentFullConfig.configuration.policyOptions
        );
      } else {
        // Normal mode: rebuild from scratch
        newNestedConfiguration.policyOptions = buildPolicyChoicesStructure(
          newNestedConfiguration
        );
      }

      // Auto-prepopulate User Details labels from net-new non-Age parameters
      const oldParams = currentFullConfig.configuration.parameters;
      const newParams = sectionData.parameters;
      const netNew = newParams.filter(
        (p) =>
          !oldParams.find((o) => o.id === p.id) &&
          p.parameterMasterName !== "Age" &&
          p.type !== "relation"
      );
      if (netNew.length > 0) {
        const existingItems =
          newNestedConfiguration.userDetailsSection?.items ?? [];
        const emptyItems = existingItems.filter((item) => !item.label?.trim());
        const nonEmptyItems = existingItems.filter((item) => item.label?.trim());
        const maxId = existingItems.reduce((acc, item) => {
          const n = parseInt(item.id.split("-")[1] ?? "0", 10);
          return n > acc ? n : acc;
        }, 0);
        let nextId = maxId + 1;
        const addedItems = netNew.flatMap((p) => {
          const ranges = p.rangeDetails?.filter((r) => r.rangeDisplayName?.trim());
          if (ranges && ranges.length > 0) {
            return ranges.map((r) => ({ id: `ud-${nextId++}`, label: r.rangeDisplayName }));
          }
          return [{ id: `ud-${nextId++}`, label: p.displayName }];
        });
        // Fill empty slots first, then append remaining new items
        const mergedItems = [...nonEmptyItems];
        addedItems.forEach((newItem, i) => {
          if (i < emptyItems.length) {
            mergedItems.push({ ...emptyItems[i], label: newItem.label });
          } else {
            mergedItems.push(newItem);
          }
        });
        if (emptyItems.length > addedItems.length) {
          mergedItems.push(...emptyItems.slice(addedItems.length));
        }
        newNestedConfiguration.userDetailsSection = {
          ...(newNestedConfiguration.userDetailsSection ?? {
            displayName: "User Details",
          }),
          items: mergedItems,
        };
      }
    }

    return { ...currentFullConfig, configuration: newNestedConfiguration };
  };

  const performSaveConfiguration = async (
    exitAfterSave: boolean,
    configToSave: PolicyConfiguration
  ): Promise<boolean> => {
    // Set saving state to true to disable buttons and
    setIsSaving(true);
    // Ensure the step number in the config being saved matches the current UI step
    const finalConfigToSave: PolicyConfiguration = {
      ...configToSave,
      step: mapCurrentStepToPolicyStepNumber(currentStep),
    };

    try {
      const method = "PUT";
      const url = endPoints.policyConfigurationById(configToSave.id);

      const payload = {
        companyId: configuratorGetData?.data?.companyId,
        policyTypeLid: configuratorGetData?.data?.policyTypeLid,
        policyConfiguartionStatusLid: getStatusIdByValue(
          finalConfigToSave.status
        ),
        policyStep: finalConfigToSave.step,
        policyId: Number(effectivePolicyId),
        policyConfiguration: finalConfigToSave.configuration,
      };

      const result: any = await mutateAsync({
        endpoint: url,
        method,
        data: payload,
      });
      if (!result?.data) {
        throw new Error(
          result?.message || "Failed to save policy configuration."
        );
      }

      // Update local state with the response from the API
      // result.data is the Prisma policy_configuration type
      const savedPolicyFromApi = result.data;
      const newConfigurationObject = savedPolicyFromApi.policyConfiguration
        ? (savedPolicyFromApi.policyConfiguration as unknown as PolicyConfiguration["configuration"])
        : configToSave.configuration;

      setPolicyConfiguration((prev) => ({
        ...prev,
        id: savedPolicyFromApi.id ?? prev.id,
        status: prev.status,
        step: savedPolicyFromApi.policyStep ?? prev.step,
        configuration: newConfigurationObject,
      }));
      updateConfiguratorStatusAndEditability(
        savedPolicyFromApi.policy_status || finalConfigToSave.status
      );

      if (exitAfterSave) navigate("/policies");
      return true;
    } catch (error) {
      console.error("Error saving policy configuration:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentSectionRef =
    (): React.RefObject<SectionRef | null> | null => {
      switch (currentStep) {
        case "policyComponents":
          return componentsSectionRef;
        case "policyRelationships":
          return relationshipsSectionRef;
        case "policyParameters":
          return parametersSectionRef;
        case "policyChoiceTemplate":
          return templateSectionRef;
        case "policyChoices":
          return choicesSectionRef; // Corrected this line
        case "policyConstraints":
          return constraintsSectionRef; // Use the ref for constraints section
        case "policyLocations":
          return null; // No ref needed — state-driven checkboxes
        default:
          return null; // Return null for any unhandled or unexpected step.
      }
    };

  const handlePrevious = () => {
    setAttemptedValidationStep(null);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = () => handleSaveAction(false);
  const handleSaveAndExit = () => handleSaveAction(true);

  const handleSaveAction = async (exitAfterSave: boolean = false) => {
    if (!isEditable) {
      // When not editable, save the current policyConfiguration state.
      // The step might need to be updated if user navigated in read-only mode.
      const configForNonEditableSave = {
        ...policyConfiguration, // Current state
        step: mapCurrentStepToPolicyStepNumber(currentStep),
      };
      performSaveConfiguration(exitAfterSave, configForNonEditableSave);
      return;
    }

    const sectionRef = getCurrentSectionRef();
    if (sectionRef?.current?.validateAndGetData) {
      const { isValid, data } = await sectionRef.current.validateAndGetData();
      // For PolicyChoices, save even if not "fully valid" by its own rules, but data must be present.
      if (currentStep === "policyChoices") {
        if (!isValid) {
          dispatch(setToastMessage(VALIDATION_MSG_POLICY_CHOICES_SECTION));
          return;
        }
        if (data) {
          const newComputedConfig = computeNextPolicyConfigurationState(
            policyConfiguration,
            data
          );
          if (newComputedConfig.status === POLICY_CONFIGURATOR_STATUS.DRAFT) {
            newComputedConfig.status = POLICY_CONFIGURATOR_STATUS.WIP;
          }
          setPolicyConfiguration(newComputedConfig);
          performSaveConfiguration(exitAfterSave, newComputedConfig);
          setAttemptedValidationStep(null); // Clear any previous validation attempt visuals
        } else {
          console.error(
            `${stepLabels[currentStep]} did not return data on save attempt.`
          );
        }
      } else {
        // For all other steps (and constraints if it had complex validation)
        if (isValid && data) {
          const newComputedConfig = computeNextPolicyConfigurationState(
            policyConfiguration,
            data
          );
          // For constraints step, ensure status is Complete on save
          if (newComputedConfig?.status === POLICY_CONFIGURATOR_STATUS.DRAFT) {
            newComputedConfig.status = POLICY_CONFIGURATOR_STATUS.WIP;
          }

          setPolicyConfiguration(newComputedConfig);
          performSaveConfiguration(exitAfterSave, newComputedConfig);
          setAttemptedValidationStep(null);
        } else {
          setAttemptedValidationStep(currentStep);
        }
      }
    } else if (sectionRef === null && currentStep !== "policyConstraints") {
      // Check currentStep !== "policyConstraints" here
      // Fallback: if no section ref, save current state. This case should
      // ideally not be hit for sections that are supposed to provide data.
      const fallbackConfig = {
        ...policyConfiguration, // Current state
        step: mapCurrentStepToPolicyStepNumber(currentStep),
      };
      if (fallbackConfig.status === POLICY_CONFIGURATOR_STATUS.DRAFT) {
        fallbackConfig.status = POLICY_CONFIGURATOR_STATUS.WIP;
      }
      performSaveConfiguration(exitAfterSave, fallbackConfig);
    }
  };

  const handleNext = async () => {
    if (
      !isEditable &&
      (configuratorStatus === POLICY_CONFIGURATOR_STATUS.COMPLETE ||
        configuratorStatus === POLICY_CONFIGURATOR_STATUS.SUBMITTED ||
        configuratorStatus === POLICY_CONFIGURATOR_STATUS.LIVE)
    ) {
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
      return;
    }
    const sectionRef = getCurrentSectionRef();

    if (sectionRef?.current?.validateAndGetData) {
      const { isValid, data } = await sectionRef.current.validateAndGetData();
      if (isValid && data) {
        // Similar to handleSaveAction, ensure data from policyChoices is merged.
        // computeNextPolicyConfigurationState should handle this.
        const newComputedConfig = computeNextPolicyConfigurationState(
          policyConfiguration,
          data
        );

        setPolicyConfiguration(newComputedConfig); // Update state
        setAttemptedValidationStep(null);
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          setCurrentStep(steps[currentIndex + 1]);
        }
      } else {
        if (currentStep === "policyChoices") {
          dispatch(setToastMessage(VALIDATION_MSG_POLICY_CHOICES_SECTION));
        }
        setAttemptedValidationStep(currentStep);
      }
    } else if (sectionRef === null) {
      // Fallback for steps that might not have a ref but are not the constraints step
      setAttemptedValidationStep(null);
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const handleSubmitForApproval = async () => {
    if (hasPreviousApproval) {
      setResubmitApprovalModalOpen(true);
      return;
    }
    await submitForApproval();
  };

  const submitForApproval = async () => {
    scrollToTop();

    // policyLocations has no sectionRef — save directly
    if (currentStep === "policyLocations") {
      const configToSubmit = {
        ...policyConfiguration,
        status: isLiveEditMode
          ? POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL
          : POLICY_CONFIGURATOR_STATUS.SUBMITTED,
      };
      setPolicyConfiguration(configToSubmit);
      const isSaved = await performSaveConfiguration(false, configToSubmit);
      if (isSaved) {
        if (typeof refetchConfigurator === "function") {
          await refetchConfigurator();
        }
        dispatch(
          setToastMessage({
            message: POLICY_CONFIGURATOR_TOASTS.SUBMITTED,
            duration: TOAST_NAVIGATION_DELAY_MS,
          })
        );
        if (!isLiveEditMode) {
          scheduleNavigationToPolicyDetails();
        }
      }
      return;
    }

    const sectionRef = getCurrentSectionRef();
    if (sectionRef?.current?.validateAndGetData) {
      const { isValid, data } = await sectionRef.current.validateAndGetData();
      if (isValid && data) {
        const newComputedConfig = computeNextPolicyConfigurationState(
          policyConfiguration,
          data
        );
        // Use different status based on whether this is a LIVE edit
        newComputedConfig.status = isLiveEditMode
          ? POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL
          : POLICY_CONFIGURATOR_STATUS.SUBMITTED;
        setPolicyConfiguration(newComputedConfig);

        const isSaved = await performSaveConfiguration(
          false,
          newComputedConfig
        );
        if (isSaved) {
          if (typeof refetchConfigurator === "function") {
            await refetchConfigurator();
          }
          dispatch(
            setToastMessage({
              message: POLICY_CONFIGURATOR_TOASTS.SUBMITTED,
              duration: TOAST_NAVIGATION_DELAY_MS,
            })
          );

          // For LIVE edit mode: stay on page to show approve/reject buttons
          // For normal mode: navigate to policy details
          if (!isLiveEditMode) {
            scheduleNavigationToPolicyDetails();
          }
        }
      } else {
        setAttemptedValidationStep(currentStep);
      }
    }
  };

  const handleApproval = async (isApproved: boolean) => {
    if (!policyConfiguration.id) return;

    scrollToTop();
    setIsSaving(true);

    try {
      const result: any = await mutateApproval({
        endpoint: endPoints.policyConfigurationApproval(policyConfiguration.id),
        method: "PUT",
        data: { isApproved, remarks },
      });
      const updatedConfig = result?.data;
      // Prioritize policyStatus.lookUpValue from API (for LIVE policies)
      const derivedStatus =
        updatedConfig?.policyStatus?.lookUpValue ||
        (updatedConfig?.policyConfiguartionStatusLid &&
          getStatusValueById(updatedConfig.policyConfiguartionStatusLid)) ||
        (isApproved
          ? POLICY_CONFIGURATOR_STATUS.COMPLETE
          : POLICY_CONFIGURATOR_STATUS.WIP);

      setPolicyConfiguration((prev) => ({
        ...prev,
        id: updatedConfig?.id ?? prev.id,
        status: derivedStatus,
        step: updatedConfig?.policyStep ?? prev.step,
        configuration: updatedConfig?.policyConfiguration
          ? (updatedConfig.policyConfiguration as PolicyConfiguration["configuration"])
          : prev.configuration,
      }));

      updateConfiguratorStatusAndEditability(derivedStatus);
      if (!isApproved) {
        // Handle rejection based on whether it was a LIVE edit
        // Check if previous status was LIVEEDITPENDINGAPPROVAL to determine LIVE edit rejection
        const wasLiveEditRejection =
          policyConfiguration.status ===
          POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL;

        if (wasLiveEditRejection) {
          // LIVE edit rejected - reset to non-editable LIVE state
          setIsLiveEditMode(false);
          setLiveEditSnapshot(null);
          setIsEditable(false);
        } else {
          // Normal rejection - keep editable for WIP state
          setIsEditable(true);
        }
        setRemarks("");
        dispatch(setToastMessage(POLICY_CONFIGURATOR_TOASTS.REJECTED));
      } else {
        dispatch(
          setToastMessage({
            message: POLICY_CONFIGURATOR_TOASTS.APPROVED,
            duration: TOAST_NAVIGATION_DELAY_MS,
          })
        );
        scheduleNavigationToPolicyDetails();
      }
    } catch (error) {
      // Handle error
      console.error("Failed to update policy approval status:", error);
      dispatch(setToastMessage(POLICY_CONFIGURATOR_TOASTS.APPROVAL_ERROR));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = () => {
    // If editing LIVE configuration, show confirmation modal
    if (isLiveEditMode) {
      setApprovalConfirmModalOpen(true);
    } else {
      handleApproval(true);
    }
  };
  const handleReject = () => handleApproval(false);

  const handleConfirmApproval = () => {
    setApprovalConfirmModalOpen(false);
    handleApproval(true);
  };

  const handleConfirmResubmitApproval = () => {
    setResubmitApprovalModalOpen(false);
    submitForApproval();
  };

  const handleEnableLiveEdit = () => {
    // Open confirmation modal instead of directly enabling LIVE edit
    setLiveEditModalOpen(true);
  };

  const handleConfirmLiveEdit = () => {
    // Store snapshot of current configuration
    setLiveEditSnapshot(policyConfiguration.configuration);
    // Enable LIVE edit mode
    updateConfiguratorStatusAndEditability(configuratorStatus, true);
    // Close modal
    setLiveEditModalOpen(false);
  };

  const showHighlightsPolicyComponents =
    currentStep === "policyComponents" &&
    attemptedValidationStep === "policyComponents";
  const showHighlightsPolicyRelationships =
    currentStep === "policyRelationships" &&
    attemptedValidationStep === "policyRelationships";
  const showHighlightsPolicyParameters =
    currentStep === "policyParameters" &&
    attemptedValidationStep === "policyParameters";
  const showHighlightsPolicyChoices =
    currentStep === "policyChoices" &&
    attemptedValidationStep === "policyChoices";

  // Determine section editability based on step and mode
  const getSectionEditability = (step: ConfigStep): boolean => {
    if (!isEditable) return false; // Base read-only check

    if (isLiveEditMode) {
      // In LIVE edit mode, only these sections support additions
      const editableSectionsInLiveMode: ConfigStep[] = [
        "policyComponents",
        "policyChoiceTemplate",
        "policyChoices",
      ];
      return editableSectionsInLiveMode.includes(step);
    }

    return true; // Normal mode - all sections editable
  };

  const currentSectionIsEditable = getSectionEditability(currentStep);

  const handleStepClick = (stepIndex: number) => {
    const currentIndex = steps.indexOf(currentStep);
    // In LIVE edit mode, allow navigation to all steps for viewing
    // In normal edit mode, allow forward navigation only if current step is valid
    if (isLiveEditMode || !isEditable || stepIndex <= currentIndex) {
      setAttemptedValidationStep(null);
      setCurrentStep(steps[stepIndex]);
    }
  };

  const handleLocationSelectionChange = (locations: { id: number; address_1: string }[]) => {
    setPolicyConfiguration((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        selectedLocationIds: locations,
      },
    }));
  };

  const handleEnablePolicyLocationsChange = (enabled: boolean) => {
    setPolicyConfiguration((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        enablePolicyLocations: enabled,
      },
    }));
  };

  const handleUserDetailsSectionChange = (
    data: NonNullable<typeof policyConfiguration.configuration.userDetailsSection>
  ) => {
    setPolicyConfiguration((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        userDetailsSection: data,
      },
    }));
  };

  const dispatch = useDispatch();

  const canApprovePolicy = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CONFIGURE_POLICY_APPROVAL)(state)
  );

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const currentUserId = userDetails?.userId;
  const approverId = configuratorGetData?.data?.approverId;
  
  // Condition to hide save buttons
  const shouldHideSaveButtons = 
    (currentUserId !== approverId) &&
    configuratorStatus === POLICY_CONFIGURATOR_STATUS.COMPLETE;

  const canShowExportButton =
    configuratorStatus === POLICY_CONFIGURATOR_STATUS.WIP ||
    configuratorStatus === POLICY_CONFIGURATOR_STATUS.DRAFT;

  // Memoize the export form configuration
  const exportFormConfig = useMemo(
    () => exportPolicyFormConfig(exportFormMethods?.watch),
    [exportFormMethods]
  );

  const handleExportModalClose = () => {
    setExportModalOpen(false);
    // Reset the form when modal closes
    if (exportFormMethods) {
      exportFormMethods.reset(exportPolicyDefaultValues);
    }
  };

  const handleExtractConfirm = (extracted: PolicyConfiguration["configuration"]) => {
    setPolicyConfiguration((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        components: extracted.components,
        relationships: extracted.relationships,
        policyTemplate: extracted.policyTemplate,
        parameters: extracted.parameters,
        policyOptions: extracted.policyOptions,
        constraints: extracted.constraints,
      },
    }));
    setCurrentStep("policyComponents");
    setWasConfigExtracted(true);
    setShowExtractionBanner(true);
    dispatch(setToastMessage({ message: POLICY_CONFIGURATOR_TOASTS.EXTRACT_LOADED }));
  };

  const handleExportPolicyConfiguration = async () => {
    if (!exportFormMethods) return;

    // Validate the form
    const isValid = await exportFormMethods.trigger();
    if (!isValid) {
      dispatch(
        setToastMessage({
          message: "Please fill in all required fields.",
        })
      );
      return;
    }

    // Get the form data
    const formData = exportFormMethods.getValues();
    
    // Extract values from select field objects
    const extractValue = (field: any) => {
      if (field && typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      return field;
    };
    
    const selectedExportConfigurationId = extractValue(formData.selectedExportConfigurationId);

    if (!effectivePolicyId || !selectedExportConfigurationId) return;

    try {
      setIsSaving(true);
      const response: any = await mutateExport({
        endpoint: endPoints.policyConfigurationExport(effectivePolicyId),
        method: "POST",
        data: {
          sourcePolicyConfigurationId: selectedExportConfigurationId,
        },
      });

      const exportedConfiguration = response?.data;
      if (exportedConfiguration) {
        const statusFromApi =
          getStatusValueById(exportedConfiguration.policyConfiguartionStatusLid) ||
          POLICY_CONFIGURATOR_STATUS.WIP;

        setPolicyConfiguration((prev) => ({
          ...prev,
          id: exportedConfiguration.id,
          status: statusFromApi,
          step: exportedConfiguration.policyStep ?? prev.step,
          configuration:
            (exportedConfiguration.policyConfiguration as PolicyConfiguration["configuration"]) ||
            prev.configuration,
        }));
        updateConfiguratorStatusAndEditability(statusFromApi);
        setCurrentStep(mapApiStepToConfigStep(exportedConfiguration.policyStep || 1));
        dispatch(
          setToastMessage({ message: "Policy configuration exported successfully" })
        );
      }
      handleExportModalClose();
    } catch (error) {
      console.error("Error exporting policy configuration:", error);
      dispatch(
        setToastMessage({
          message: "Failed to export policy configuration. Please try again.",
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PolicyConfiguratorStyledContainer maxWidth="xl">
      <div ref={pageTopAnchorRef} />
      {isPageLoading && (
        <LoaderWrapper>
          <CircularProgress />
          <LoadingText>{LOADING_POLICY_CONFIGURATION}</LoadingText>
        </LoaderWrapper>
      )}
      {!isPageLoading && fetchError && (
        <LoaderWrapper>
          <PolicyConfiguratorNoDataBox>
            <img src={backgroundImage} alt="" />
            <PolicyConfiguratorNoDataText>
              {NO_POLICY_CONFIGURATOR}
            </PolicyConfiguratorNoDataText>
          </PolicyConfiguratorNoDataBox>
        </LoaderWrapper>
      )}
      {!isPageLoading && !fetchError && (
        <>
          <StepperContainer>
            <PolicyProgressStepper
              steps={progressSteps}
              activeStep={steps.indexOf(currentStep)}
              onStepChange={handleStepClick}
              data={stepperData}
              showEditButton={
                !isEditable &&
                configuratorStatus === POLICY_CONFIGURATOR_STATUS.LIVE &&
                canEditLivePolicy
              }
              onEditClick={handleEnableLiveEdit}
            />
          </StepperContainer>
          <ContentWrapper
            data-testid={`policy-configurator-content-${currentStep}`}
          >
            {currentStep === "policyComponents" && (
              <StepPaper elevation={3}>
                <SectionHeader>
                  <Heading variant="h5" component="h1">
                    {stepLabels.policyComponents}
                  </Heading>
                  {/* "Add" buttons are now inside PolicyComponentsSection */}
                </SectionHeader>
                {isLiveEditMode && currentSectionIsEditable && (
                  <StyledWarningAlert severity="warning">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_COMPONENTS}
                  </StyledWarningAlert>
                )}
                <PolicyComponentsSection
                  ref={componentsSectionRef}
                  initialData={policyConfiguration.configuration.components}
                  isEditable={currentSectionIsEditable}
                  isLiveEditMode={isLiveEditMode}
                  liveEditSnapshot={liveEditSnapshot?.components}
                  showHighlights={showHighlightsPolicyComponents}
                  onFocusChange={setFocusTargetId}
                />
                {showExtractionBanner && (
                    <StyledInfoAlert
                      severity="info"
                      sx={{ cursor: "pointer" }}
                      onClose={() => setShowExtractionBanner(false)}
                      onClick={() => setShowExtractionBanner(false)}
                    >
                      {POLICY_CONFIGURATOR_ALERTS.EXTRACT_AI_DISCLAIMER}
                    </StyledInfoAlert>
                )}
              </StepPaper>
            )}
            {currentStep === "policyRelationships" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyRelationships}
                </Heading>
                {isLiveEditMode && (
                  <StyledInfoAlert severity="info">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_RELATIONSHIPS}
                  </StyledInfoAlert>
                )}
                <PolicyRelationshipsSection
                  ref={relationshipsSectionRef}
                  initialData={policyConfiguration.configuration.relationships}
                  isEditable={currentSectionIsEditable}
                  showHighlights={showHighlightsPolicyRelationships}
                />
              </StepPaper>
            )}
            {currentStep === "policyChoiceTemplate" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyChoiceTemplate}
                </Heading>
                {isLiveEditMode && currentSectionIsEditable && (
                  <StyledWarningAlert severity="warning">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_TEMPLATE}
                  </StyledWarningAlert>
                )}
                <PolicyTemplateSection
                  ref={templateSectionRef}
                  initialData={policyConfiguration.configuration.policyTemplate}
                  policyComponents={
                    policyConfiguration.configuration.components
                  }
                  relationships={
                    policyConfiguration.configuration.relationships
                  }
                  isEditable={currentSectionIsEditable}
                  isLiveEditMode={isLiveEditMode}
                  liveEditSnapshot={liveEditSnapshot?.policyTemplate}
                />
              </StepPaper>
            )}
            {currentStep === "policyParameters" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyParameters}
                </Heading>
                {isLiveEditMode && (
                  <StyledInfoAlert severity="info">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_PARAMETERS}
                  </StyledInfoAlert>
                )}
                <PolicyParametersSection
                  ref={parametersSectionRef}
                  initialData={policyConfiguration.configuration.parameters}
                  enabledPolicyRelations={
                    policyConfiguration.configuration.relationships
                      .enabledPolicyRelations
                  }
                  isEditable={currentSectionIsEditable}
                  showHighlights={showHighlightsPolicyParameters}
                />
              </StepPaper>
            )}
            {currentStep === "policyChoices" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyChoices}
                </Heading>
                {isLiveEditMode && currentSectionIsEditable && (
                  <StyledWarningAlert severity="warning">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_CHOICES}
                  </StyledWarningAlert>
                )}
                <PolicyChoicesSection
                  ref={choicesSectionRef}
                  initialData={
                    policyConfiguration.configuration.policyOptions || []
                  }
                  fullConfiguration={policyConfiguration.configuration}
                  isEditable={currentSectionIsEditable}
                  isLiveEditMode={isLiveEditMode}
                  liveEditSnapshot={liveEditSnapshot?.policyOptions}
                  showHighlights={showHighlightsPolicyChoices}
                />
              </StepPaper>
            )}
            {currentStep === "policyConstraints" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyConstraints}
                </Heading>
                {isLiveEditMode && (
                  <StyledInfoAlert severity="info">
                    {POLICY_CONFIGURATOR_ALERTS.LIVE_EDIT_CONSTRAINTS}
                  </StyledInfoAlert>
                )}
                <PolicyConstraintsSection // Pass the ref here
                  ref={constraintsSectionRef}
                  initialPolicyConfig={policyConfiguration}
                  isEditable={currentSectionIsEditable}
                  // showHighlights={attemptedValidationStep === currentStep} // If you add highlights
                />
              </StepPaper>
            )}
            {currentStep === "policyLocations" && (
              <StepPaper elevation={3}>
                <Heading variant="h5" component="h1">
                  {stepLabels.policyLocations}
                </Heading>
                <PolicyUserDetailsSection
                  sectionData={
                    policyConfiguration.configuration.userDetailsSection ?? {
                      displayName: "User Details",
                      items: [{ id: "ud-1", label: "", value: "" }],
                    }
                  }
                  isEditable={currentSectionIsEditable}
                  onChange={handleUserDetailsSectionChange}
                />
                <PolicyLocationsSection
                  companyId={companyId!}
                  policyConfigurationLocations={policyConfigurationLocations}
                  selectedLocationIds={
                    policyConfiguration.configuration.selectedLocationIds ?? []
                  }
                  isEditable={currentSectionIsEditable}
                  returnTo={`/policies/configure/${effectivePolicyId}`}
                  onSelectionChange={handleLocationSelectionChange}
                  enablePolicyLocations={
                    policyConfiguration.configuration.enablePolicyLocations ?? false
                  }
                  onEnablePolicyLocationsChange={handleEnablePolicyLocationsChange}
                />
              </StepPaper>
            )}
          </ContentWrapper>
          <StyledBtnContainer>
            <ActionBarInner>
              <ActionBarContent>
                <Stack direction="row" spacing={2}>
                {steps.indexOf(currentStep) !== 0 && (
                  <StyledPrevButton
                    variantType={BUTTON_VARIANTS.SECONDARY}
                    onClick={handlePrevious}
                    disabled={isSaving}
                    data-testid="policy-previous-button"
                  >
                    {BUTTON_LABELS.PREVIOUS}
                  </StyledPrevButton>
                )}
                {canShowExportButton && (
                  <StyledPrevButton
                    variantType={BUTTON_VARIANTS.SECONDARY}
                    onClick={() => setExportModalOpen(true)}
                    disabled={isSaving}
                    data-testid="policy-export-configuration-button"
                  >
                    Import Policy Configuration
                  </StyledPrevButton>
                )}
                {/* {canShowExportButton && (
                  <StyledPrevButton
                    variantType={BUTTON_VARIANTS.SECONDARY}
                    onClick={() => setExtractPdfModalOpen(true)}
                    disabled={isSaving}
                    data-testid="policy-extract-from-pdf-button"
                  >
                    {POLICY_CONFIGURATOR_BUTTONS.EXTRACT_FROM_PDF}
                  </StyledPrevButton>
                )} */}
                {/* Disable Save and Save & Exit buttons during LIVE edit mode or when conditions are met */}
                {isEditable && !isLiveEditMode &&!shouldHideSaveButtons && (
                  <>
                    <StyledPrevButton
                      variantType={BUTTON_VARIANTS.SECONDARY}
                      onClick={handleSave}
                      disabled={isSaving}
                      data-testid="policy-save-button"
                    >
                      {SAVE}
                    </StyledPrevButton>
                    <StyledNextButton
                      variantType={BUTTON_VARIANTS.PRIMARY}
                      onClick={handleSaveAndExit}
                      disabled={isSaving}
                      data-testid="policy-save-and-exit-button"
                    >
                      {POLICY_CONFIGURATOR_BUTTONS.SAVE_AND_EXIT}
                    </StyledNextButton>
                  </>
                )}
                {/* "Next" button logic */}
                {isEditable && currentStep !== lastStep && (
                  <StyledNextButton
                    variantType={BUTTON_VARIANTS.PRIMARY}
                    color="primary"
                    onClick={handleNext}
                    disabled={isSaving}
                    data-testid="policy-next-button"
                  >
                    {BUTTON_LABELS.NEXT}
                  </StyledNextButton>
                )}
                {/* Submit for Approval on last step */}
                {isEditable && currentStep === lastStep && (
                  <StyledNextButton
                    variant="contained"
                    color="success"
                    onClick={handleSubmitForApproval}
                    disabled={isSaving}
                    data-testid="policy-constraints-submit-for-approval-button"
                  >
                    {POLICY_CONFIGURATOR_BUTTONS.SUBMIT_FOR_APPROVAL}
                  </StyledNextButton>
                )}
                {/* Approval actions when submitted */}

                {!isEditable &&
                  (configuratorStatus ===
                    POLICY_CONFIGURATOR_STATUS.SUBMITTED ||
                    configuratorStatus ===
                      POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL) &&
                  currentStep === lastStep && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <StyledNextButton
                        variantType={BUTTON_VARIANTS.PRIMARY}
                        color="error"
                        onClick={handleReject}
                        disabled={!canApprovePolicy}
                        data-testid="policy-constraints-reject-button"
                      >
                        {POLICY_CONFIGURATOR_BUTTONS.REJECT}
                      </StyledNextButton>
                      <StyledNextButton
                        variantType={BUTTON_VARIANTS.PRIMARY}
                        color="success"
                        onClick={handleApprove}
                        disabled={!canApprovePolicy}
                        data-testid="policy-constraints-approve-button"
                      >
                        {POLICY_CONFIGURATOR_BUTTONS.APPROVE}
                      </StyledNextButton>
                    </Stack>
                  )}
                {/* "Next" button for non-editable (view mode) on non-constraint steps */}
                {currentStep !== lastStep && !isEditable && (
                  <StyledNextButton
                    variantType={BUTTON_VARIANTS.PRIMARY}
                    color="primary"
                    onClick={handleNext} // handleNext allows navigation in view mode
                    data-testid="policy-next-button-view-mode"
                  >
                    {BUTTON_LABELS.NEXT}
                  </StyledNextButton>
                )}
              </Stack>
                {requestSentToName &&
                  currentUserId !== approverId &&
                  !canApprovePolicy &&
                  (configuratorStatus ===
                    POLICY_CONFIGURATOR_STATUS.SUBMITTED ||
                    configuratorStatus ===
                      POLICY_CONFIGURATOR_STATUS.LIVEEDITPENDINGAPPROVAL ||
                    configuratorStatus ===
                      POLICY_CONFIGURATOR_STATUS.LIVEEDITSUBMIT) && (
                    <ApprovalMessageText variant="body2">
                      Approval request has been sent to {requestSentToName}
                    </ApprovalMessageText>
                  )}
                {approverDetails &&
                  (configuratorStatus ===
                    POLICY_CONFIGURATOR_STATUS.COMPLETE ||
                    configuratorStatus === POLICY_CONFIGURATOR_STATUS.LIVE) && (
                  <ApprovalMessageText variant="body2">
                    This is approved by {approverDetails.name}
                    {approverDetails.status?.approvedOn && (
                      <> on {approverDetails.status.approvedOn} at {approverDetails.status.approvedTime}</>
                    )}
                  </ApprovalMessageText>
                )}
              </ActionBarContent>
            </ActionBarInner>
          </StyledBtnContainer>
        </>
      )}


      <CustomModal
        open={exportModalOpen}
        handleClose={handleExportModalClose}
        heading="Import Policy Configuration"
        modalBoxRef={exportModalBoxRef}
        modalBoxStyles={{ width: "550px" }}
        buttons={[
          {
            label: "Cancel",
            variant: "secondary",
            onClick: handleExportModalClose,
          },
          {
            label: "Import",
            variant: "primary",
            onClick: handleExportPolicyConfiguration,
          },
        ]}
      >
          <DynamicForm
            formConfig={exportFormConfig}
            defaultValues={exportPolicyDefaultValues}
            formMethods={setExportFormMethods}
          />
      </CustomModal>

      <CustomModal
        open={liveEditModalOpen}
        handleClose={() => setLiveEditModalOpen(false)}
        heading={POLICY_CONFIGURATOR_MODALS.LIVE_EDIT_HEADING}
        buttons={[
          {
            label: POLICY_CONFIGURATOR_MODALS.BUTTON_NO,
            variant: "secondary",
            onClick: () => setLiveEditModalOpen(false),
          },
          {
            label: POLICY_CONFIGURATOR_MODALS.BUTTON_YES,
            variant: "primary",
            onClick: handleConfirmLiveEdit,
          },
        ]}
      >
        <div style={{ padding: "16px 0" }}>
          {POLICY_CONFIGURATOR_MODALS.LIVE_EDIT_MESSAGE}
        </div>
      </CustomModal>

      <CustomModal
        open={approvalConfirmModalOpen}
        handleClose={() => setApprovalConfirmModalOpen(false)}
        heading={POLICY_CONFIGURATOR_MODALS.APPROVAL_HEADING}
        buttons={[
          {
            label: POLICY_CONFIGURATOR_MODALS.BUTTON_NO,
            variant: "secondary",
            onClick: () => setApprovalConfirmModalOpen(false),
          },
          {
            label: POLICY_CONFIGURATOR_MODALS.BUTTON_YES,
            variant: "primary",
            onClick: handleConfirmApproval,
          },
        ]}
      >
        <div style={{ padding: "16px 0" }}>
          {POLICY_CONFIGURATOR_MODALS.APPROVAL_MESSAGE}
        </div>
      </CustomModal>

      <CustomModal
        open={resubmitApprovalModalOpen}
        handleClose={() => setResubmitApprovalModalOpen(false)}
        heading={POLICY_CONFIGURATOR_MODALS.RESUBMIT_APPROVAL_HEADING}
        buttons={[
          {
            label: POLICY_CONFIGURATOR_MODALS.BUTTON_NO,
            variant: "secondary",
            onClick: () => setResubmitApprovalModalOpen(false),
          },
          {
            label: "Submit",
            variant: "primary",
            onClick: handleConfirmResubmitApproval,
          },
        ]}
      >
        <StyledSubmitForApprovalMessage>
          {POLICY_CONFIGURATOR_MODALS.RESUBMIT_APPROVAL_MESSAGE}
        </StyledSubmitForApprovalMessage>
      </CustomModal>

      <ExtractPolicyFromPdfModal
        open={extractPdfModalOpen}
        onClose={() => setExtractPdfModalOpen(false)}
        onConfirm={handleExtractConfirm}
        policyId={effectivePolicyId}
      />
    </PolicyConfiguratorStyledContainer>
  );
}
