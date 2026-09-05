import { CircularProgress } from "@mui/material";
import {
  CommonBreadcrumb,
  CustomModal,
  ReloadGuardModal,
  endPoints,
  httpMethods,
  HTTP_METHODS,
  apiRequest,
  setToastMessage,
  SummaryCard,
  theme,
  useApiMutation,
  useApiQuery,
  useReloadGuard,
  VALIDATION_ERROR_MESSAGE,
  environment,
  FeatureKey,
  useHasPermission,
} from "@ui/ui-lib";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DocumentIconBlue from "../../../assets/svgs/document-icon-blue.svg";
import EndorsementProcessWrapper from "../../../components/EndorsementProcessWrapper/index.js";
import NestedStepper from "../../../components/NestedStepper/index.js";
import { useNestedStepper } from "../../../components/NestedStepper/useNestedStepper.js";
import {
  cardSections,
  policyDetailsViewMoreItems,
} from "../../CompanyPage/PolicyDetails/detailsConfig.js";
import {
  PolicyDetailsContainer,
  priorityStyleMap,
} from "../../CompanyPage/PolicyDetails/styles.js";
import {
  CreationType,
  getCreationFlowConfig,
  getCreationStepConfigResolvers,
  resolveCreationType,
} from "./creationFlowConfigs";
import RenderEndorsementRequestComponentUI from "./RenderEndorsementRequestStep";
import RenderTpaIdUploadStep from "./RenderTpaIdUploadStep";
import RenderEndorsementStep, {
  StepInterface,
} from "./RenderEndorsementStep/index.js";
import {
  BreadCrumbWrapper,
  EndorsementProcessContainer,
  InstructionsList,
  InstructionsTitle,
  InstructionItem,
  InstructionDot,
  LoaderContainer,
  NestedStepperWrapper,
  StepperColumnWrapper,
} from "./styles.js";
import { updateEmptyDateFields } from "../utils/updateEmptyDateFields";
import {
  isNextButtonDisabled,
  isSendButtonDisabled,
} from "../utils/endorsementButtons";
import {
  CLIENT_TAG,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
  EMAIL_TO_CLIENT_SENT_SUCCESSFULLY,
  EMAIL_TO_INSURER_SENT_SUCCESSFULLY,
  ENDORSEMENT_STEP_KEYS,
  ENDORSEMENT_TOASTS,
  INCEPTION_INSTRUCTIONS,
  INSURER_TAG,
  POLICY_DETAILS,
  PROCESS_COMPLETED_SUCCESSFULLY,
  SEND_TO_CLIENT,
  SEND_TO_INSURER,
  YOU_CAN_NOW_RETURN_TO_POLICY_DETAILS,
} from "../../../constants";
import { GROUP_POLICY_TYPE_KEYS } from "../../../constants/lookupValues";

import DownloadIcon from "../../../assets/svgs/download-icon.svg";
import SendToContactsModal from "./SendToContactsModal";

enum EndorsementStatus {
  PENDING = "Pending",
  CURRENT = "Current",
  COMPLETED = "Completed",
}

// File status enum constants for document processing
const FILE_STATUS = {
  CREATED: "Created",
  PROCESSING: "Processing",
  FAILED: "Failed",
  COMPLETED: "Completed",
} as const;

interface CreateEndorsementProps {
  creationTypeOverride?: CreationType;
}

const CreateEndorsement = ({
  creationTypeOverride,
}: CreateEndorsementProps) => {
  const {
    policyId,
    creationType,
    endorsementId: endorsementIdParam,
  } = useParams<{
    policyId?: string;
    creationType?: string;
    endorsementId?: string;
  }>();

  const resolvedCreationType = resolveCreationType(
    creationTypeOverride ?? creationType
  );
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const endorsementIdFromQuery = queryParams.get("endorsementId");

  const endorsementIdFromUrl =
    endorsementIdParam && endorsementIdParam !== ""
      ? endorsementIdParam
      : endorsementIdFromQuery && endorsementIdFromQuery !== ""
      ? endorsementIdFromQuery
      : null;

  const parsedInitialEndorsementId =
    endorsementIdFromUrl !== null && endorsementIdFromUrl !== undefined
      ? Number(endorsementIdFromUrl)
      : null;

  const initialEndorsementId =
    typeof parsedInitialEndorsementId === "number" &&
    !Number.isNaN(parsedInitialEndorsementId)
      ? parsedInitialEndorsementId
      : null;

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [uploadFormMethods, setUploadFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [endorsementStepsData, setEndorsementStepsData] = useState<
    Record<string, any>
  >({});

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState<boolean>(false);
  const [isSendToContactsModalOpen, setIsSendToContactsModalOpen] =
    useState<boolean>(false);
  const [contactModalType, setContactModalType] = useState<string>(INSURER_TAG);
  const [documentIdsForCurrentStep, setDocumentIdsForCurrentStep] = useState<number[]>([]);
  const FF_IWORK_SERVICE_EMAIL_CONFIGURATION =
    environment?.featureFlag?.FF_IWORK_SERVICE_EMAIL_CONFIGURATION ?? false;

  const [fieldPaymentAmount, setFieldPaymentAmount] = useState<number>(0);
  const [fieldPaymentMethod, setFieldPaymentMethod] = useState<string>("");
  const prevBrokerageValuesRef = useRef<{
    basicBrokeragePercentage: number | null;
    basicBrokerageAmount: number | null;
  }>({ basicBrokeragePercentage: null, basicBrokerageAmount: null });
  // Prevents re-entrant processing when setValues fires onValuesChange mid-update
  const skipBrokerageCalcRef = useRef(false);
  // Holds the latest netPremium so stale onValuesChange closures can still read it
  const netPremiumRef = useRef(0);
  // Track if prefill has been applied to prevent race conditions
  const prefillAppliedRef = useRef(false);
  // Holds brokerage values to set once the CREATE_ENDORSEMENT form is mounted
  const [pendingBrokerageSet, setPendingBrokerageSet] = useState<{
    pct: string;
    amount: string;
  } | null>(null);

  // Fallback if navigation state wasn't provided (e.g., direct access / page reload / default click on <a>)
  const breadcrumbNavigationState = useMemo(
    () =>
      (location.state as
        | { navigationFrom: string; navigationLabel: string }
        | undefined) ?? {
        navigationFrom: `/policies/${policyId}`,
        navigationLabel: POLICY_DETAILS,
        filters: location.state?.filters ?? null,
      },
    [location.state, policyId]
  );

  const isPolicyExtension = !!(location.state as any)?.isPolicyExtension;
  // When navigate() remounts this component after extension submit, endorsementId is already in
  // the URL and isPolicyExtension is in location.state — treat the extension as done immediately.
  const [isPolicyExtensionDone, setIsPolicyExtensionDone] = useState(
    isPolicyExtension && initialEndorsementId !== null
  );

  // True once both extension steps are saved — forms become read-only and all stepper buttons are disabled.
  const isExtensionFullyComplete =
    isPolicyExtension &&
    endorsementStepsData?.createEndorsement?.isCompleted === true;

  const [isEndorsementPending, setIsEndorsementPending] = useState(false);
  // Track if specific steps that require an explicit send action have been sent.
  const [sentToInsurerMap, setSentToInsurerMap] = useState<
    Record<string, boolean>
  >({});
  // Track document file status for SEND_ENDORSEMENT_TO_INSURER step
  const [documentFileStatus, setDocumentFileStatus] = useState<string | null>(
    null
  );

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { mutate } = useApiMutation({});
  const [persistedEndorsementId, setPersistedEndorsementId] = useState<
    number | null
  >(initialEndorsementId);
  const [hasUploadedInSession, setHasUploadedInSession] = useState(() => {
    const state = location.state as
      | {
          endorsementCreationContext?: { hasUploadedInSession?: boolean };
        }
      | undefined;
    return Boolean(state?.endorsementCreationContext?.hasUploadedInSession);
  });

  const handlePersistedEndorsementId = useCallback(
    (newEndorsementId: number | null) => {
      setPersistedEndorsementId(newEndorsementId);

      if (newEndorsementId === null || newEndorsementId === undefined) {
        setHasUploadedInSession(false);
        return;
      }

      if (initialEndorsementId === null) {
        setHasUploadedInSession(true);
      }
    },
    [initialEndorsementId]
  );

  useEffect(() => {
    if (
      initialEndorsementId !== null &&
      initialEndorsementId !== undefined &&
      initialEndorsementId !== persistedEndorsementId
    ) {
      handlePersistedEndorsementId(initialEndorsementId);
    }
  }, [
    initialEndorsementId,
    persistedEndorsementId,
    handlePersistedEndorsementId,
  ]);

  const shouldGuardReload =
    Boolean(persistedEndorsementId) &&
    hasUploadedInSession &&
    resolvedCreationType !== "inception";

  const {
    isModalOpen: isReloadGuardModalOpen,
    closeModal: closeReloadGuardModal,
  } = useReloadGuard({ shouldGuard: Boolean(shouldGuardReload) });

  const handleReloadGuardCreateNew = useCallback(() => {
    closeReloadGuardModal();
    handlePersistedEndorsementId(null);

    if (!policyId) {
      return;
    }

    navigate(`/${policyId}/create-${resolvedCreationType}`, {
      replace: true,
      state: {
        ...breadcrumbNavigationState,
      },
    });
  }, [
    breadcrumbNavigationState,
    closeReloadGuardModal,
    handlePersistedEndorsementId,
    navigate,
    policyId,
    resolvedCreationType,
  ]);

  const { data: policyDetailsData, isLoading: isPolicyDetailsLoading } =
    useApiQuery({
      url: policyId
        ? endPoints.getBasicDetailsByPolicyId(Number(policyId))
        : "",
      queryKey: [],
      enabled: !!policyId,
    });

  const policyTypeKey = policyDetailsData?.data?.PolicyType?.lookUpKey;

  const isGroupPolicyType = useMemo(() => {
    // Default to group while the policy is still loading, matching the
    // previous behaviour. Compared by lookUpKey (org-independent string),
    // not id: lookup_data has one row per organisation_id per key, so the
    // same key resolves to a different numeric id per org and an id-based
    // comparison can mismatch.
    if (policyTypeKey === undefined || policyTypeKey === null) {
      return true;
    }

    return (GROUP_POLICY_TYPE_KEYS as readonly string[]).includes(policyTypeKey);
  }, [policyTypeKey]);

  const creationFlowConfig = useMemo(
    () => getCreationFlowConfig(resolvedCreationType, isGroupPolicyType),
    [isGroupPolicyType, resolvedCreationType]
  );
  const creationStepResolvers = useMemo(
    () =>
      getCreationStepConfigResolvers(resolvedCreationType, isGroupPolicyType),
    [isGroupPolicyType, resolvedCreationType]
  );
  const creationLabels = creationFlowConfig.labels;

  // Check if we have loaded the endorsement data to determine step filtering
  const hasEndorsementData = Object.keys(endorsementStepsData).length > 0;

  const endorsementType =
    endorsementStepsData?.endorsementRequestReceived?.data
      ?.endorsementRequestReceived?.endorsementType;
  const isNonFinancialEndorsement =
    Boolean(endorsementType) && endorsementType !== "FINANCIAL_ENDORSEMENT";

  // Determine if we should wait for API data before rendering stepper
  const shouldWaitForApiData =
    !hasEndorsementData && (initialEndorsementId || persistedEndorsementId);

  // Filter stepper config based on TPA mandatory flag from API
  const filteredStepperConfig = useMemo(() => {
    // Policy extension flow only needs first 2 steps
    if (isPolicyExtension) {
      return creationFlowConfig.stepperConfig.slice(0, 2);
    }

    const isTpaMandatory = endorsementStepsData?.tpaIdUpload?.isTpaMandatory;

    // If TPA is not mandatory or endorsement type is non-financial, filter out TPA_ID_UPLOAD
    if (isTpaMandatory === false || isNonFinancialEndorsement) {
      const filtered = creationFlowConfig.stepperConfig.filter(
        (step) => step.key !== ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD
      );
      return filtered;
    }

    // If TPA is mandatory or undefined (default behavior), include all steps
    return creationFlowConfig.stepperConfig;
  }, [
    creationFlowConfig.stepperConfig,
    endorsementStepsData,
    isNonFinancialEndorsement,
    isPolicyExtension,
  ]);

  const {
    steps,
    selectedKey,
    openSteps,
    handleStepHeaderClick,
    handleItemClick,
    handleNext,
    handleBack,
    selectedStep,
    markComplete,
    completedKeys,
    activeStepIndex,
    setActiveStepIndex,
    setSelectedKey,
  } = useNestedStepper({
    stepsConfig: shouldWaitForApiData ? [] : filteredStepperConfig,
    autoSelectFirstStep: !initialEndorsementId || isPolicyExtension,
  });

  const resolvedEndorsementId =
    persistedEndorsementId !== null && persistedEndorsementId !== undefined
      ? persistedEndorsementId
      : initialEndorsementId;

  const getUrl = useMemo(() => {
    if (!policyId) {
      return "";
    }

    if (resolvedEndorsementId !== null && resolvedEndorsementId !== undefined) {
      return isGroupPolicyType
        ? endPoints.endorsementStepsByEndorsementId(
            Number(policyId),
            resolvedEndorsementId
          )
        : endPoints.assetEndorsementStepsByEndorsementId(
            Number(policyId),
            resolvedEndorsementId
          );
    }

    return endPoints.endorsementStepsByPolicyId(Number(policyId));
  }, [isGroupPolicyType, policyId, resolvedEndorsementId]);

  const {
    data: endorsementGetSResponse,
    isLoading: isEndorsmentGetLoading,
    error: endorsmentFetchError,
    refetch: refetchEndorsementSteps,
  } = useApiQuery({
    url: getUrl,
    queryKey: ["endorsement-steps", getUrl],
    enabled: !!getUrl,
  });

  const { data: enrollmentUploadsResponse } = useApiQuery({
    url:
      policyId && resolvedEndorsementId
        ? endPoints.enrollmentUploadSummaryByEndorsement(
            Number(policyId),
            resolvedEndorsementId
          )
        : "",
    queryKey: ["enrollment-uploads-doc-type", policyId, resolvedEndorsementId],
    enabled: !!policyId && !!resolvedEndorsementId,
  });

  const hasEnrollmentDocType = useMemo(() => {
    const uploads: any[] = enrollmentUploadsResponse?.data?.data ?? [];
    return uploads.some(
      (item: any) =>
        item?.documentProcessingFile?.documentType ===
          DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA ||
        item?.documentProcessingFile?.documentType ===
          DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT
    );
  }, [enrollmentUploadsResponse]);

  const formRefToAcessFromChild = useRef<StepInterface>(null);
  const uploadSummaryRef = useRef<HTMLDivElement>(null);

  const hydrateBrokerageIntoStepsData = useCallback(
    (rawData: any, shouldQueuePendingPrefill = false) => {
      const updated = updateEmptyDateFields(rawData);
      const createEndorsementData = updated?.createEndorsement?.data ?? {};
      const endorsementSummary = createEndorsementData?.endorsementSummary ?? {};
      netPremiumRef.current = Number(endorsementSummary?.netPremium ?? 0);

      const prefilledPct =
        endorsementSummary?.basicBrokeragePercentage ??
        createEndorsementData?.inceptionBrokerageDetails
          ?.basicBrokeragePercentage ??
        createEndorsementData?.endorsementBrokerageDetails
          ?.basicBrokeragePercentage;
      const prefilledAmountFromApi =
        createEndorsementData?.inceptionBrokerageDetails?.basicBrokerageAmount ??
        createEndorsementData?.endorsementBrokerageDetails?.basicBrokerageAmount ??
        endorsementSummary?.basicBrokerageAmount;
      const netPremium = netPremiumRef.current;
      const pctNum = Number(prefilledPct);
      const amountFromApiNum = Number(prefilledAmountFromApi);
      const hasPrefilledPct =
        prefilledPct !== null &&
        prefilledPct !== undefined &&
        prefilledPct !== "" &&
        !Number.isNaN(pctNum);
      const hasAmountFromApi =
        prefilledAmountFromApi !== null &&
        prefilledAmountFromApi !== undefined &&
        prefilledAmountFromApi !== "" &&
        !Number.isNaN(amountFromApiNum);

      if (!hasPrefilledPct) {
        return updated;
      }

      const computedAmount =
        netPremium > 0 ? Number(((netPremium * pctNum) / 100).toFixed(2)) : null;
      const resolvedAmount =
        computedAmount !== null
          ? computedAmount
          : hasAmountFromApi
          ? amountFromApiNum
          : null;

      prevBrokerageValuesRef.current = {
        basicBrokeragePercentage: pctNum,
        basicBrokerageAmount: resolvedAmount,
      };

      if (shouldQueuePendingPrefill && !prefillAppliedRef.current) {
        prefillAppliedRef.current = true;
        setPendingBrokerageSet({
          pct: String(pctNum),
          amount: resolvedAmount !== null ? String(resolvedAmount) : "",
        });
      }

      return {
        ...updated,
        createEndorsement: {
          ...updated.createEndorsement,
          data: {
            ...updated.createEndorsement?.data,
            inceptionBrokerageDetails: {
              ...updated.createEndorsement?.data?.inceptionBrokerageDetails,
              basicBrokeragePercentage: String(pctNum),
              basicBrokerageAmount:
                resolvedAmount !== null ? String(resolvedAmount) : null,
            },
            endorsementBrokerageDetails: {
              ...updated.createEndorsement?.data?.endorsementBrokerageDetails,
              basicBrokeragePercentage: String(pctNum),
              basicBrokerageAmount:
                resolvedAmount !== null ? String(resolvedAmount) : null,
            },
          },
        },
      };
    },
    []
  );

  useEffect(() => {
    if (!persistedEndorsementId || !policyId) {
      return;
    }

    const parseNumericId = (value?: string | null) => {
      if (!value || value === "") {
        return null;
      }
      const numericValue = Number(value);
      return Number.isNaN(numericValue) ? null : numericValue;
    };

    const endorsementIdFromPath = parseNumericId(endorsementIdParam);

    const endorsementIdFromSearch = parseNumericId(endorsementIdFromQuery);

    const endorsementIdInLocation =
      endorsementIdFromPath ?? endorsementIdFromSearch;

    if (endorsementIdInLocation === persistedEndorsementId) {
      return;
    }

    navigate(
      `/${policyId}/create-${resolvedCreationType}/${persistedEndorsementId}`,
      {
        replace: true,
        state: {
          ...breadcrumbNavigationState,
          endorsementCreationContext: { hasUploadedInSession: true },
        },
      }
    );
  }, [
    resolvedCreationType,
    persistedEndorsementId,
    policyId,
    endorsementIdParam,
    endorsementIdFromQuery,
    navigate,
    breadcrumbNavigationState,
  ]);

  useEffect(() => {
    if (endorsementGetSResponse?.data) {
      const hydratedStepData = hydrateBrokerageIntoStepsData(
        endorsementGetSResponse.data,
        true
      );
      setEndorsementStepsData(hydratedStepData);
    }
  }, [endorsementGetSResponse, hydrateBrokerageIntoStepsData]);

  // Once CREATE_ENDORSEMENT step is selected and the form is mounted, apply pending brokerage prefill
  useEffect(() => {
    if (
      selectedStep?.key === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT &&
      pendingBrokerageSet
    ) {
      const { pct, amount } = pendingBrokerageSet;
      // Defer to next tick to ensure nested forms are mounted and registered.
      const timer = setTimeout(() => {
        if (!formRefToAcessFromChild.current?.setValues) {
          return;
        }
        // Guard against triggering the auto-calc loop in handleCreateEndorsementValuesChange
        skipBrokerageCalcRef.current = true;
        formRefToAcessFromChild.current.setValues({
          inceptionBrokerageDetails: {
            basicBrokeragePercentage: pct,
            basicBrokerageAmount: amount,
          },
          endorsementBrokerageDetails: {
            basicBrokeragePercentage: pct,
            basicBrokerageAmount: amount,
          },
        });
        skipBrokerageCalcRef.current = false;
        setPendingBrokerageSet(null);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [selectedStep?.key, pendingBrokerageSet]);

  const currentStepEntry: [string, any] | undefined = Object.entries(
    endorsementStepsData || {}
  ).find(
    ([, value]) => value && typeof value === "object" && value.isCurrentStep
  );

  const currentStepKeyFromApi = currentStepEntry?.[0];
  const currentStepDataFromApi = currentStepEntry?.[1];

  useEffect(() => {
    Object.entries(endorsementStepsData).forEach(([key, value]: any) => {
      if (value?.isCompleted) {
        try {
          markComplete(key);
        } catch (e) {
          dispatch(
            setToastMessage(ENDORSEMENT_TOASTS.ERROR_MARKING_STEP_COMPLETE)
          );
        }
      }
    });
  }, [endorsementStepsData]);

  const currentStepNumber =
    steps.findIndex((s) => s.key === selectedStep?.key) + 1;

  const currentStep = currentStepDataFromApi?.stepOrder ?? currentStepNumber;
  const isMissingEndorsementData =
    endorsementGetSResponse?.data?.endorsementExists === false;
  const missingEndorsementMessage =
    endorsementGetSResponse?.data?.emptyStateMessage ||
    "";

  useEffect(() => {
    if (isMissingEndorsementData) {
      dispatch(setToastMessage(missingEndorsementMessage));
    }
  }, [dispatch, isMissingEndorsementData, missingEndorsementMessage]);

  /**
   * Centralized loading state - Show loader until ALL critical data is ready:
   * 1. Policy details data (required for policy type and other dependencies)
   * 2. Endorsement steps data (when editing existing endorsement)
   * 3. Step selection logic completed
   */
  const isPageLoading =
    isPolicyDetailsLoading ||
    (shouldWaitForApiData && isEndorsmentGetLoading) ||
    (Boolean(initialEndorsementId) && !selectedStep);

  useEffect(() => {
    if (currentStepKeyFromApi) {
      // Check if the current step from API exists in the filtered steps
      const stepExistsInFilteredConfig = filteredStepperConfig.some(
        (step) => step.key === currentStepKeyFromApi
      );

      // If the current step is TPA_ID_UPLOAD but it's been filtered out,
      // select the previous step (CLIENT_CONFIRMATION) instead
      if (
        !stepExistsInFilteredConfig &&
        currentStepKeyFromApi === ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD
      ) {
        const clientConfirmationStep = filteredStepperConfig.find(
          (step) => step.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
        );
        if (clientConfirmationStep) {
          setSelectedKey(ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION);
          const clientConfirmationIndex = filteredStepperConfig.findIndex(
            (step) => step.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
          );
          setActiveStepIndex(
            clientConfirmationIndex >= 0 ? clientConfirmationIndex : 0
          );
        }
      } else if (stepExistsInFilteredConfig) {
        // Normal case: step exists in filtered config
        setSelectedKey(currentStepKeyFromApi);
        setActiveStepIndex((currentStepDataFromApi?.stepOrder ?? 1) - 1);
      }
    }
  }, [
    currentStepKeyFromApi,
    currentStepDataFromApi,
    setSelectedKey,
    setActiveStepIndex,
    filteredStepperConfig,
  ]);

  // When a completed extension is opened from the track table, auto-select step 2.
  // Runs once after data loads; a ref guard prevents it from interfering with
  // normal in-session completion (where handleNext() handles navigation instead).
  const didInitialExtensionSelectRef = useRef(false);
  useEffect(() => {
    if (
      !didInitialExtensionSelectRef.current &&
      isPolicyExtension &&
      initialEndorsementId &&
      !shouldWaitForApiData &&
      endorsementStepsData?.createEndorsement?.isCompleted
    ) {
      didInitialExtensionSelectRef.current = true;
      const createStepIndex = filteredStepperConfig.findIndex(
        (s) => s.key === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT
      );
      if (createStepIndex !== -1) {
        setSelectedKey(ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT);
        setActiveStepIndex(createStepIndex);
      }
    }
  }, [shouldWaitForApiData, endorsementStepsData?.createEndorsement?.isCompleted]);

  // Track previous paymentAmount specifically for createEndorsement step

  const handleCreateEndorsementValuesChange = (values: Record<string, any>) => {
    const paymentAmount = Number(values?.premiumPaymentTerm?.paymentAmount) || 0;
    if (
      fieldPaymentAmount !== paymentAmount &&
      typeof paymentAmount === "number"
    ) {
      setFieldPaymentAmount(paymentAmount);
    }

    const paymentMethod = values?.premiumPaymentTerm?.paymentMethod ?? "";
    if (fieldPaymentMethod !== paymentMethod) {
      setFieldPaymentMethod(paymentMethod);
    }

    // Auto-calculate basicBrokeragePercentage <-> basicBrokerageAmount
    // Guard: skip processing when we are the ones triggering onValuesChange via setValues
    if (skipBrokerageCalcRef.current) {
      return;
    }

    // netPremium read from ref so stale closures always get the latest value
    const netPremium = netPremiumRef.current;

    const currentPct =
      values?.inceptionBrokerageDetails?.basicBrokeragePercentage;
    const currentAmt =
      values?.inceptionBrokerageDetails?.basicBrokerageAmount;

    const prevPct = prevBrokerageValuesRef.current.basicBrokeragePercentage;
    const prevAmt = prevBrokerageValuesRef.current.basicBrokerageAmount;

    const pctChanged = currentPct !== prevPct;
    const amtChanged = currentAmt !== prevAmt;

    if (pctChanged && netPremium) {
      const pct = Number(currentPct);
      if (!Number.isNaN(pct)) {
        const computed = Number(((netPremium * pct) / 100).toFixed(2));
        prevBrokerageValuesRef.current = {
          basicBrokeragePercentage: pct,
          basicBrokerageAmount: computed,
        };
        // Block intermediate onValuesChange callbacks fired by setValues mid-update
        skipBrokerageCalcRef.current = true;
        formRefToAcessFromChild.current?.setValues?.({
          inceptionBrokerageDetails: {
            basicBrokeragePercentage: currentPct,
            basicBrokerageAmount: computed,
          },
        });
        skipBrokerageCalcRef.current = false;
      }
    } else if (amtChanged && !pctChanged && netPremium) {
      const amt = Number(currentAmt);
      if (!Number.isNaN(amt)) {
        const computed = Number(((amt / netPremium) * 100).toFixed(4));
        prevBrokerageValuesRef.current = {
          basicBrokeragePercentage: computed,
          basicBrokerageAmount: amt,
        };
        // Block intermediate onValuesChange callbacks fired by setValues mid-update
        skipBrokerageCalcRef.current = true;
        formRefToAcessFromChild.current?.setValues?.({
          inceptionBrokerageDetails: {
            basicBrokeragePercentage: computed,
            basicBrokerageAmount: currentAmt,
          },
        });
        skipBrokerageCalcRef.current = false;
      }
    } else {
      // no cross-calc needed, just update tracking
      prevBrokerageValuesRef.current = {
        basicBrokeragePercentage: Number(currentPct) || prevPct,
        basicBrokerageAmount: Number(currentAmt) || prevAmt,
      };
    }
  };

  const getPaymentVsCdBalance = () => {
    const paymentAmount = fieldPaymentAmount;
    const summaryObj =
      endorsementStepsData?.createEndorsement?.data?.endorsementSummary;
    const cdBalance = summaryObj?.cdBalance ?? 0;
    const grossPremium = summaryObj?.grossPremium ?? 0;
    return {
      paymentAmount: Number(paymentAmount),
      cdBalance: Number(cdBalance),
      grossPremium: Number(grossPremium),
    };
  };

  const hasRbacPermissionEndorsement = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const hasRbacPermissionInception = useHasPermission(FeatureKey.EXPORT_INCEPTION);
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD ||
    (resolvedCreationType === "inception" ? hasRbacPermissionInception : hasRbacPermissionEndorsement);

  const renderStepComponent = () => {
    if (!selectedStep) {
      return null;
    }
    const { config, key } = selectedStep;

    // sampleData to show EndorsementSummary cards

    const stepData = endorsementStepsData[key];

    if (key === ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED) {
      return (
        <RenderEndorsementRequestComponentUI
          config={config}
          setFormMethods={setFormMethods}
          uploadFormMethods={uploadFormMethods}
          setUploadFormMethods={setUploadFormMethods}
          policyId={Number(policyId)}
          setIsEndorsementPending={setIsEndorsementPending}
          isEndorsementPending={isEndorsementPending}
          endorsementId={resolvedEndorsementId ?? null}
          stateData={stepData}
          formMethods={formMethods}
          setEndorsementId={handlePersistedEndorsementId}
          overAllData={endorsementStepsData}
          summaryRef={uploadSummaryRef}
          creationLabel={creationLabels.singular}
          creationType={resolvedCreationType}
          isGroupPolicyType={isGroupPolicyType}
          onPolicyExtended={isPolicyExtension ? () => setIsPolicyExtensionDone(true) : undefined}
        />
      );
    }

    let resolvedConfig = config;

    if (typeof config === "function") {
      let enableDownloadIcon = false;
      let enableDownloadIconForClientConfirmation = false;
      if (
        endorsementStepsData?.sendEndorsementToInsurer?.isCurrentStep ||
        endorsementStepsData?.sendEndorsementToInsurer?.isCompleted
      ) {
        enableDownloadIcon = isDownloadAllowed;
      }

      if (
        endorsementStepsData?.clientConfirmation?.isCurrentStep ||
        endorsementStepsData?.clientConfirmation?.isCompleted
      ) {
        enableDownloadIconForClientConfirmation = isDownloadAllowed;
      }
      const enableDownloadIconForTpaUpload =
        isDownloadAllowed &&
        Boolean(
          endorsementStepsData?.tpaUpload?.isCurrentStep ||
            endorsementStepsData?.tpaUpload?.isCompleted
        );
      const endorsementFileDetails =
        endorsementStepsData?.sendEndorsementToInsurer?.data
          ?.endorsementDocumentContainer ?? null;

      const clientConfirmationDocs =
        endorsementStepsData?.clientConfirmation?.data?.clientDocuments;
      const endorsementFileId =
        clientConfirmationDocs?.endorsementData?.endorsementFileId;
      const insurerPolicyDocumentId =
        clientConfirmationDocs?.insurerPolicyDocument?.insurerPolicyDocumentId;
      const tpaUploadData =
        endorsementStepsData?.tpaIdUpload?.data?.tpaIdUpload;

      const tpaDocumentDetails = tpaUploadData?.tpaFileId
        ? {
            fileId: tpaUploadData.tpaFileId,
            generatedDate: tpaUploadData.tpaIdUploadDate?.split("T")[0] || "",
            fileName:
              tpaUploadData.tpaFileName?.split("/").pop() || "TPA Document",
          }
        : null;

      switch (key) {
        case ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER:
          resolvedConfig = creationStepResolvers.sendToInsurer(
            `${creationLabels.singular} Document`,
            "File that needs to be sent to insurer",
            endorsementFileDetails,
            enableDownloadIcon,
            creationLabels.singularLower,
            Number(policyId),
            resolvedEndorsementId ?? undefined,
            setDocumentFileStatus,
            refetchEndorsementSteps
          );
          break;
        case ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT: {
          const rawSummary =
            endorsementStepsData?.createEndorsement?.data?.endorsementSummary;
          const summaryCardData =
            isPolicyExtension && rawSummary
              ? {
                  cdBalance: rawSummary.cdBalance,
                  netPremium: rawSummary.netPremium,
                  grossPremium: rawSummary.grossPremium,
                }
              : rawSummary;
          resolvedConfig = creationStepResolvers.create(
            `${creationLabels.singular} Summary`,
            DocumentIconBlue,
            { borderColor: theme.palette.button.secondary },
            summaryCardData,
            creationLabels.singularLower,
            isGroupPolicyType,
            environment.featureFlag.FF_PREMIUM_CALCULATOR && hasEnrollmentDocType,
            endorsementType,
            isPolicyExtension
          );
          break;
        }
        case ENDORSEMENT_STEP_KEYS.RECEIVE_INSURER_ACKNOWLEDGEMENT:
          resolvedConfig = creationStepResolvers.receiveAcknowledgement(
            policyId ? Number(policyId) : undefined,
            creationFlowConfig.companyType,
            596,
            resolvedEndorsementId ?? undefined
          );
          break;
        case ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD:
          resolvedConfig = tpaUploadData?.tpaFileId
            ? creationStepResolvers.tpaUpload(
                Number(policyId),
                creationFlowConfig.companyType,
                596,
                `TPA Document`,
                "File uploaded during the TPA ID process",
                tpaDocumentDetails,
                enableDownloadIconForTpaUpload,
                creationLabels.singularLower
              )
            : creationStepResolvers.tpaUpload(
                Number(policyId),
                creationFlowConfig.companyType,
                596
              );
          break;
        case ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION:
          resolvedConfig = creationStepResolvers.clientConfirmation(
            DownloadIcon,
            endorsementFileId,
            insurerPolicyDocumentId,
            enableDownloadIconForClientConfirmation
          );
          break;
        default:
          resolvedConfig = config;
          break;
      }
    }

    if (key === ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD) {
      return (
        <RenderTpaIdUploadStep
          config={resolvedConfig}
          stepData={stepData}
          policyId={Number(policyId)}
          endorsementId={resolvedEndorsementId ?? null}
          tpaId={policyDetailsData?.data?.headerDetails?.tpaDetails?.id}
          creationLabel={creationLabels.singular}
          creationType={resolvedCreationType}
          isGroupPolicyType={isGroupPolicyType}
          summaryRef={uploadSummaryRef}
          setIsEndorsementPending={setIsEndorsementPending}
          formRef={formRefToAcessFromChild}
          stepKey={key}
        />
      );
    }
    return (
      <RenderEndorsementStep
        config={resolvedConfig}
        stepName={key}
        stepData={stepData}
        ref={formRefToAcessFromChild}
        onValuesChange={
          key === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT
            ? handleCreateEndorsementValuesChange
            : undefined
        }
      />
    );
  };

  const stepperSubmit = async () => {
    const stepKey = selectedStep?.key;

    // For policy extension step 2: validate form, PUT step 1 to advance
    // currentEndorsementStep to 2, then PUT step 2 with actual form values.
    if (isPolicyExtension && stepKey === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT) {
      const submission = await formRefToAcessFromChild.current?.submitAll?.();
      if (!submission || typeof submission !== 'object' || !submission.isAllValid) {
        dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
        return;
      }

      const step1Data = endorsementStepsData[ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED];
      const step1Payload = {
        [ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED]: {
          stepOrder: step1Data?.stepOrder,
          stepLabel: step1Data?.stepLabel,
          isCurrentStep: true,
          isCompleted: true,
          data: {
            endorsementRequestReceived: step1Data?.data?.endorsementRequestReceived ?? {},
          },
        },
      };

      try {
        await apiRequest(
          endPoints.putAssetEndorsementStepsByEndorsementId(
            Number(policyId),
            Number(resolvedEndorsementId),
          ),
          { method: HTTP_METHODS.PUT, data: step1Payload },
        );
      } catch {
        // step 1 PUT failure doesn't block step 2 submit
      }

      const currentData = endorsementStepsData[stepKey];
      const extensionPayload = {
        [stepKey]: {
          stepOrder: currentData?.stepOrder,
          stepLabel: currentData?.stepLabel,
          isCurrentStep: true,
          isCompleted: true,
          data: submission.result || {},
        },
      };
      mutate(
        {
          endpoint: endPoints.putAssetEndorsementStepsByEndorsementId(
            Number(policyId),
            Number(resolvedEndorsementId),
          ),
          method: httpMethods.PUT,
          data: extensionPayload,
        },
        {
          onSuccess: (response: any) => {
            if (response?.data) {
              const hydratedStepData = hydrateBrokerageIntoStepsData(response.data, true);
              setEndorsementStepsData(hydratedStepData);
            }
            markComplete(stepKey);
            handleNext();
            refetchEndorsementSteps();
            dispatch(
              setToastMessage(
                ENDORSEMENT_TOASTS.STEP_SAVED_SUCCESSFULLY(selectedStep?.title || "Step")
              )
            );
            if (
              selectedStep?.key &&
              endorsementStepsData[selectedStep.key]?.stepOrder === filteredStepperConfig.length
            ) {
              setIsProcessModalOpen(true);
            }
          },
          onError: (error: any) => {
            const msg = Array.isArray(error?.message)
              ? error.message[0]
              : error?.message || "Failed to save step";
            dispatch(setToastMessage(msg));
          },
        }
      );
      return;
    }

    // if (!stepKey || !endorsementId) return;
    const [isEndorsmentRequestValid] = await Promise.all([
      formMethods?.trigger(),
    ]);

    const endorsmentRequestValues = await formMethods?.getValues();

    const stepKeyCheck =
      stepKey === ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED;

    const submission = stepKeyCheck
      ? isEndorsmentRequestValid
      : await formRefToAcessFromChild.current?.submitAll?.();
    if (stepKeyCheck ? !submission : !submission?.isAllValid) {
      dispatch(setToastMessage(VALIDATION_ERROR_MESSAGE));
      return;
    }

    const endorsementRequestReceived = {
      endorsementRequestReceived: endorsmentRequestValues,
    };

    const values = stepKeyCheck
      ? endorsementRequestReceived
      : submission.result || {};
    const currentData = endorsementStepsData[stepKey];

    const tpaIdUpload = {
      tpaIdUpload: {
        tpaIdUploadDate: values?.tpaIdUpload?.tpaIdUploadDate ?? null,
        tpaUploadRemarks: values?.tpaIdUpload?.tpaUploadRemarks ?? null,
      },
    };

    const receiveInsurerAcknowledgement = {
      ...values,
      endorsementPolicyDocumentId:
        values?.endorsementPolicyDocument?.fileUpload?.id,
    };

    const payload = {
      [stepKey]: {
        stepOrder: currentData?.stepOrder,
        stepLabel: currentData?.stepLabel,
        isCurrentStep: true,
        isCompleted: true,
        data:
          stepKey === ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD
            ? tpaIdUpload
            : stepKey === ENDORSEMENT_STEP_KEYS.RECEIVE_INSURER_ACKNOWLEDGEMENT
            ? receiveInsurerAcknowledgement
            : values,
      },
    };

    const updateEndpoint = isGroupPolicyType
      ? endPoints.putEndorsementStepsByEndorsementId(
          Number(policyId),
          Number(resolvedEndorsementId)
        )
      : endPoints.putAssetEndorsementStepsByEndorsementId(
          Number(policyId),
          Number(resolvedEndorsementId)
        );

    mutate(
      {
        endpoint: updateEndpoint,
        method: httpMethods.PUT,
        data: payload,
      },
      {
        onSuccess: (response: any) => {
          if (response?.data) {
            const hydratedStepData = hydrateBrokerageIntoStepsData(
              response.data,
              true
            );
            setEndorsementStepsData(hydratedStepData);
          }

          markComplete(stepKey);
          handleNext();
          refetchEndorsementSteps();
          dispatch(
            setToastMessage(
              ENDORSEMENT_TOASTS.STEP_SAVED_SUCCESSFULLY(
                selectedStep?.title || "Step"
              )
            )
          );
          if (
            endorsementStepsData[selectedStep?.key] &&
            selectedStep?.key &&
            endorsementStepsData[selectedStep.key]?.stepOrder ===
              filteredStepperConfig.length
          ) {
            setIsProcessModalOpen(true);
          }
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to save step";
          dispatch(setToastMessage(msg));
        },
      }
    );
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const sendEndorsementNotificationEmail = (data: any) => {
    const arr = [
      data?.clientDocuments?.endorsementData?.endorsementFileId,
      data?.clientDocuments?.insurerPolicyDocument?.insurerPolicyDocumentId,
    ];

    const payload = {
      url: window.location.href,
      attachmentFileIds:
        selectedStep?.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
          ? arr
          : [
              endorsementStepsData?.sendEndorsementToInsurer?.data
                ?.endorsementDocumentContainer?.fileId ?? null,
            ],
      isClientConfirmation:
        selectedStep?.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
          ? true
          : false,
      contactType:
      selectedStep?.key === ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER
          ? INSURER_TAG
          : CLIENT_TAG,
    };

    if (!policyId) return;

    mutate(
      {
        endpoint: endPoints.endorsementNotificationEmails(Number(policyId)),
        method: httpMethods.POST,
        data: payload,
      },
      {
        onSuccess: (response: any) => {
          setIsModalOpen(true);
          if (response) {
            dispatch(setToastMessage(response?.message));
          }
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || "Failed to send notification email";
          dispatch(setToastMessage(msg));
        },
      }
    );
  };
  const handleProcessCloseModal = () => setIsProcessModalOpen(false);

  const buttonLabel =
    selectedStep?.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
      ? SEND_TO_CLIENT
      : SEND_TO_INSURER;

  const sendInsurerClientMsg =
    selectedStep?.key === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION
      ? EMAIL_TO_CLIENT_SENT_SUCCESSFULLY
      : EMAIL_TO_INSURER_SENT_SUCCESSFULLY;

  const modalMessage = sendInsurerClientMsg;

  // const documentIdsForCurrentStep = useMemo(() => {
  //   const stepKey = selectedStep?.key;
    
  //   if (stepKey === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION) {
  //     const clientDocs = endorsementStepsData?.clientConfirmation?.data?.clientDocuments;
  //     return [
  //       clientDocs?.endorsementData?.endorsementFileId,
  //       clientDocs?.insurerPolicyDocument?.insurerPolicyDocumentId,
  //     ].filter(Boolean);
  //   }
    
  //   if (stepKey === ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER) {
  //     const fileId = endorsementStepsData?.sendEndorsementToInsurer?.data
  //       ?.endorsementDocumentContainer?.fileId;
  //     return fileId ? [fileId] : [];
  //   }
    
  //   return [];
  // }, [selectedStep?.key, endorsementStepsData]);

  // Derive the overall status for the currently selected step from API data
  const selectedStepMeta = selectedStep?.key
    ? endorsementStepsData?.[selectedStep.key]
    : undefined;
  const derivedStatus:
    | EndorsementStatus.PENDING
    | EndorsementStatus.CURRENT
    | EndorsementStatus.COMPLETED = (() => {
    if (selectedStepMeta?.isCompleted) return EndorsementStatus.COMPLETED;
    if (selectedStepMeta?.isCurrentStep && !selectedStepMeta?.isCompleted)
      return EndorsementStatus.CURRENT;
    return EndorsementStatus.PENDING;
  })();

  return (
    <PolicyDetailsContainer>
      <BreadCrumbWrapper>
        <CommonBreadcrumb
          crumbs={creationFlowConfig.breadcrumb(breadcrumbNavigationState)}
        />
      </BreadCrumbWrapper>
      {isPageLoading ? (
        <LoaderContainer>
          <CircularProgress color="secondary" />
        </LoaderContainer>
      ) : (
        <>
          <SummaryCard
            data={{
              ...policyDetailsData?.data?.headerDetails,
              displayName:
                policyDetailsData?.data?.headerDetails?.displayName ||
                "No Title Available",
              policyId:
                policyDetailsData?.data?.basicDetails?.insurerPolicyNumber ??
                null,
              company: {
                companyName:
                  policyDetailsData?.data?.headerDetails?.companyName ||
                  "Unknown Company",
                companyId:
                  policyDetailsData?.data?.headerDetails?.companyId || 0,
              },
            }}
            nameLink={""}
            sections={cardSections}
            headerConfig={{
              titleKey: "displayName",
              chip: [
                {
                  key: "status",
                  styleMap: priorityStyleMap,
                  variant: "withDot",
                  labelPrefix: "Status - ",
                },
              ],
            }}
            viewMore={true}
            viewMoreItems={policyDetailsViewMoreItems}
          />
          <EndorsementProcessContainer>
            <EndorsementProcessWrapper
              title={selectedStep?.title}
              stepNumber={currentStepNumber}
              totalSteps={steps?.length}
              status={derivedStatus}
              nextButtonLabel={
                isPolicyExtension &&
                selectedStep?.key === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT
                  ? "Submit"
                  : "Next"
              }
              backButtonProps={{ onClick: handleBack, disabled: isExtensionFullyComplete }}
              sendButtonProps={{
                label: buttonLabel,
                shouldHide: ![
                  ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER,
                  ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION,
                ].includes(selectedStep?.key ?? ""),
                disabled: (() => {
                  if (isMissingEndorsementData) {
                    return true;
                  }
                  const baseDisabled = isSendButtonDisabled(
                    endorsementStepsData?.[selectedStep?.key] || {}
                  );
                  // Disable if file is Processing, Created, or Failed for SEND_ENDORSEMENT_TO_INSURER step
                  if (
                    selectedStep?.key ===
                    ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER
                  ) {
                    const normalizedStatus = documentFileStatus
                      ?.toString()
                      .trim()
                      .toLowerCase();
                    if (
                      normalizedStatus !== FILE_STATUS.COMPLETED.toLowerCase()
                    ) {
                      return true;
                    }
                  }
                  return baseDisabled;
                })(),
                onClick: async () => {
                  const stepKey = selectedStep?.key;
                  if (!stepKey) return;

                  // Determine contact type based on step
                  const contactType =
                    stepKey ===
                    ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER
                      ? INSURER_TAG
                      : CLIENT_TAG;
                  
                  if(FF_IWORK_SERVICE_EMAIL_CONFIGURATION) {
                    // Get selected document IDs based on user's checkbox selections
                    const selectedDocIds: number[] = [];
                    
                    if (stepKey === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION) {
                      // Get form values to check which documents are selected
                      const formResult = await formRefToAcessFromChild.current?.submitAll?.();
                      const formData = formResult?.result || {};
                      
                      const clientDocs = endorsementStepsData?.clientConfirmation?.data?.clientDocuments;
                      
                      // Access checkbox values from the selectDocumentsToSendToClient section
                      const selectedDocs = formData.selectDocumentsToSendToClient || {};
                      
                      // Only include endorsementFileId if checkbox is checked
                      if (selectedDocs.endorsementData && clientDocs?.endorsementData?.endorsementFileId) {
                        selectedDocIds.push(clientDocs.endorsementData.endorsementFileId);
                      }
                      
                      // Only include insurerPolicyDocumentId if checkbox is checked
                      if (selectedDocs.insurerEndorsementPolicyDocument && clientDocs?.insurerPolicyDocument?.insurerPolicyDocumentId) {
                        selectedDocIds.push(clientDocs.insurerPolicyDocument.insurerPolicyDocumentId);
                      }
                    } else if (stepKey === ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER) {
                      // For insurer step, always include the endorsement document
                      const fileId = endorsementStepsData?.sendEndorsementToInsurer?.data
                        ?.endorsementDocumentContainer?.fileId;
                      if (fileId) {
                        selectedDocIds.push(fileId);
                      }
                    }
                    
                    setDocumentIdsForCurrentStep(selectedDocIds);
                    setContactModalType(contactType);
                    setIsSendToContactsModalOpen(true);
                  } else {
                    setSentToInsurerMap((prev) => ({
                      ...prev,
                      [stepKey]: true,
                    }));
                    // setIsModalOpen(true); // Open modal instead of toast
                    sendEndorsementNotificationEmail(
                      endorsementStepsData?.[selectedStep?.key]?.data
                    );
                  }
                },
              }}
              nextButtonProps={{
                onClick: stepperSubmit,
                disabled: (() => {
                  if (isExtensionFullyComplete) {
                    return true;
                  }
                  if (
                    isPolicyExtension &&
                    isPolicyExtensionDone &&
                    selectedStep?.key !== ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT
                  ) {
                    return false;
                  }
                  if (isMissingEndorsementData) {
                    return true;
                  }
                  const endorsementSummary =
                    endorsementGetSResponse?.data?.createEndorsement?.data
                      ?.endorsementSummary;
                  const enrollmentStats = {
                    notStartedCount: endorsementSummary?.notStartedCount || 0,
                    inProgressCount: endorsementSummary?.inProgressCount || 0,
                  };

                  const base = isNextButtonDisabled(
                    selectedStep?.key,
                    endorsementStepsData?.[selectedStep?.key] || {},
                    endorsementStepsData,
                    isEndorsementPending,
                    sentToInsurerMap,
                    creationFlowConfig,
                    enrollmentStats,
                    isNonFinancialEndorsement
                  );
                  if (
                    selectedStep?.key ===
                    ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT
                  ) {
                    const { cdBalance, grossPremium } = getPaymentVsCdBalance();
                    if (isPolicyExtension) {
                      // Extension: enable Submit only when the entered transaction
                      // amount equals the gross premium. Non-financial / 0-premium
                      // extensions have gross 0, so the default amount 0 satisfies it.
                      if (
                        Math.round(fieldPaymentAmount * 100) !==
                        Math.round(grossPremium * 100)
                      ) {
                        return true;
                      }
                    } else if (fieldPaymentAmount + cdBalance < grossPremium) {
                      // Normal endorsement: payment + CD balance must cover gross premium
                      return true;
                    }
                  }
                  // Disable if file is Processing, Created, or Failed for SEND_ENDORSEMENT_TO_INSURER step
                  if (
                    selectedStep?.key ===
                    ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER
                  ) {
                    const normalizedStatus = documentFileStatus
                      ?.toString()
                      .trim()
                      .toLowerCase();
                    if (
                      normalizedStatus !== FILE_STATUS.COMPLETED.toLowerCase()
                    ) {
                      return true;
                    }
                  }
                  return base;
                })(),
              }}
            >
              {renderStepComponent()}
            </EndorsementProcessWrapper>

            <StepperColumnWrapper>
              <NestedStepperWrapper>
                <NestedStepper
                  steps={steps}
                  openSteps={openSteps}
                  selectedKey={selectedKey}
                  handleStepHeaderClick={handleStepHeaderClick}
                  handleItemClick={handleItemClick}
                  title={`${creationLabels.singular} Process Steps`}
                  activeStepIndex={activeStepIndex}
                  setActiveStepIndex={setActiveStepIndex}
                  currentStep={currentStep}
                  currentStepDataFromApi={currentStepDataFromApi}
                />
              </NestedStepperWrapper>

              {isGroupPolicyType && (
                <NestedStepperWrapper>
                  <InstructionsTitle>
                    {resolvedCreationType === INCEPTION_INSTRUCTIONS.INCEPTION
                      ? INCEPTION_INSTRUCTIONS.INCEPTION_TITLE
                      : INCEPTION_INSTRUCTIONS.ENDORSEMENT_TITLE}
                  </InstructionsTitle>
                  <InstructionsList>
                    <InstructionItem>
                      <InstructionDot />
                      {INCEPTION_INSTRUCTIONS.NOTE_1}
                    </InstructionItem>
                    <InstructionItem>
                      <InstructionDot />
                      {INCEPTION_INSTRUCTIONS.NOTE_2}
                    </InstructionItem>
                  </InstructionsList>
                </NestedStepperWrapper>
              )}

            </StepperColumnWrapper>
            <ReloadGuardModal
              open={isReloadGuardModalOpen}
              onCancel={closeReloadGuardModal}
              onCreateNew={handleReloadGuardCreateNew}
            />
            {/* Custom Modal for send action */}
            <CustomModal
              open={isModalOpen}
              handleClose={handleCloseModal}
              heading="Success"
              buttons={[
                {
                  label: "OK",
                  onClick: handleCloseModal,
                  variant: "primary",
                },
              ]}
            >
              <div>{modalMessage}</div>
            </CustomModal>
          </EndorsementProcessContainer>
          <CustomModal
            open={isProcessModalOpen}
            handleClose={handleProcessCloseModal}
            heading={`${creationLabels.singular} process info`}
            buttons={[
              {
                label: "Done",
                onClick: () => {
                  handleProcessCloseModal();
                  navigate(`/policies/${policyId}`);
                },
                variant: "primary",
              },
            ]}
          >
            <div>
              {creationLabels.singular} {PROCESS_COMPLETED_SUCCESSFULLY}
              <br />
              {YOU_CAN_NOW_RETURN_TO_POLICY_DETAILS}
            </div>
          </CustomModal>

          {/* Send to Contacts Modal */}
          <SendToContactsModal
            open={isSendToContactsModalOpen}
            onClose={() => setIsSendToContactsModalOpen(false)}
            policyId={Number(policyId)}
            contactType={contactModalType}
            documentIds={documentIdsForCurrentStep}
            onSendSuccess={() => {
              const stepKey = selectedStep?.key;
              if (stepKey) {
                setSentToInsurerMap((prev) => ({
                  ...prev,
                  [stepKey]: true,
                }));
              }
            }}
          />
        </>
      )}
    </PolicyDetailsContainer>
  );
};

export default CreateEndorsement;