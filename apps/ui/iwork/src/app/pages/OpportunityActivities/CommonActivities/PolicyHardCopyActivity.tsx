import { CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { environment } from "@ui/ui-lib/environment";
import { useParams } from "react-router-dom";
import {
  endPoints,
  Button,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  useApiQuery,
  useApiMutation,
  setToastMessage,
  apiRequest,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
  FeatureKey,
  formatDate,
  cleanEmptyArrayRows,
  sanitizeRestForInsurerDetails,
} from "@ui/ui-lib";
import {
  ALERT_MESSAGES,
  DEVIATION_TASK_NAMES,
  ENDORSEMENT_TOASTS,
  THIS_ACTIVITY_WAS_APPROVED_BY,
  WAITING_FOR_ACTIVITY_APPROVAL_BY,
} from "../../../constants";
import { transformPremiumData } from "../../../constants/transformUtils";
import { HTTP_METHODS } from "@ui/ui-lib";
import { calculatePercentageAmountUpdate } from "../../../Utils/calculatePercentageAmountUpdate";
import {
  approvalButtonsConfig,
  buttonsConfig,
  onlyApproveButtonConfig,
} from "../Constants/config.js";
import {
  ActivitiesButtonsContainer,
  LoaderContainer,
  CommonActivitiesMainContainer,
  PolicyDocDiffHelperText,
} from "./styles";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import {
  AutoPopulateConfig,
  parseNumericInput,
  useAutoPopulateCalculatedFields,
} from "../Constants/autoPopulateFields";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils";
import { buildDocumentsPayload } from "./utils/documents";
import { buildSectionAwareCoverConfig } from "./utils/buildSectionAwareCoverConfig";
import { stripSriLankaBrokerage } from "./utils/stripSriLankaBrokerage";
import {
  buildInsurerDetailsValue,
} from "./utils/insurerDetails";
import { useActivityTasks } from "../hooks/useActivityTasks";
import {
  OPPORTUNITY_ACTIVITY_STATUS,
  ACTIVITY_KEYS,
  SECTION_KEYS,
  FIELD_NAMES,
  BrokerageFieldSet,
  PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS,
  DEVIATION_FIELDS_TO_REMOVE,
  ACTION_TYPES,
  ROLE_KEYS,
  APPROVAL_VALUES,
} from "./constants";

export interface CommonActivityProps {
  onSubmit: (data: any) => void;
  activity: any;
  dynamicValues: Record<string, string | number>;
  setBreadCumbStep: React.Dispatch<React.SetStateAction<number | null>>;
  saveStatusData: any;
  submitStatusData: any;
  approvedStatusData: any;
  rejectedStatusData: any;
  breadCumbSep: number;
  setSubmittedBreadCumb: React.Dispatch<React.SetStateAction<number>>;
  opportunityActivityStatus: any;
  submitStatusDataForApproval?: any;
  Role: string;
  isLost?: boolean;
  setIsOpportunityWon: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOptyWorkInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  optyActivitiesState: any;
  setOptyActivitiesState: React.Dispatch<React.SetStateAction<any[]>>;
}

const enforceLeadInsurerFlags = (
  list: any[] | undefined,
  LEAD: any,
  CO: any
) => {
  if (!Array.isArray(list)) return list;
  return list.map((row, idx) => ({
    ...row,
    isLeadInsurer: idx === 0 ? LEAD : CO,
  }));
};

const resolveChangedField = (
  percentageValue: number,
  amountValue: number,
  prevPercentageValue: number,
  prevAmountValue: number
): "percentage" | "amount" | undefined => {
  const percentageChanged = percentageValue !== prevPercentageValue;
  const amountChanged = amountValue !== prevAmountValue;

  if (percentageChanged) {
    return "percentage";
  }

  if (amountChanged) {
    return "amount";
  }

  return undefined;
};

// Compares the live field value against the extracted document value.
// Numeric compare (with tolerance) when both parse as numbers; otherwise a
// trimmed, case-insensitive string compare. An empty live value never matches.
const policyDocValuesMatch = (liveValue: any, docValue: any): boolean => {
  const norm = (v: any) => String(v ?? "").replace(/,/g, "").trim();
  const liveNorm = norm(liveValue);
  if (liveNorm === "") return false;
  const docNorm = norm(docValue);
  const liveNum = Number(liveNorm);
  const docNum = Number(docNorm);
  if (!Number.isNaN(liveNum) && !Number.isNaN(docNum)) {
    return Math.abs(liveNum - docNum) < 0.01;
  }
  return liveNorm.toLowerCase() === docNorm.toLowerCase();
};

const POLICY_DETAILS_FIELD_MAP: Record<string, string> = {
  sum_insured:    'sumInsured',
  basic_premium:  'basicPremium',
  net_premium:    'netPremium',
  gst_percentage: 'gstPercentage',
  gst_amount:     'gstAmount',
  fee:            'fee',
  other_amount:   'other',
  total_premium:  'grossPremium',
};

const SHARED_INSURER_ACTIVITY_KEYS = new Set([ACTIVITY_KEYS.POLICY_HARD_COPY]);

const LEAD_SECTION_CONFIG_MAP = {
  [ACTIVITY_KEYS.POLICY_HARD_COPY]: {
    sectionKey: SECTION_KEYS.DEVIATION_SECTION,
    policyPlacedField: FIELD_NAMES.POLICY_PLACED_TYPE_LID,
    leadInsurerField: FIELD_NAMES.LEAD_INSURER_ID,
    leadPaysField: FIELD_NAMES.IS_LEAD_INSURER_PAY_COMMISSION,
  },
};

const createBrokerageAutoPopulateConfig = (
  section: string,
  baseField: string,
  percentageField: string,
  amountField: string
): AutoPopulateConfig => ({
  target: `${section}.${percentageField}`,
  fields: [`${section}.${baseField}`, `${section}.${amountField}`],
  compute: ({ values }) => {
    const sectionValues = values?.[section];

    if (!sectionValues || typeof sectionValues !== "object") {
      return "";
    }

    const baseNumeric = parseNumericInput(sectionValues?.[baseField]);
    const amountNumeric = parseNumericInput(
      sectionValues?.[amountField]
    );

    if (baseNumeric === null || amountNumeric === null) {
      return "";
    }

    if (baseNumeric === 0) {
      return "";
    }

    const computedPercentage = Number(
      ((amountNumeric / baseNumeric) * 100).toFixed(4)
    );

    const currentPercentageNumeric = parseNumericInput(
      sectionValues?.[percentageField]
    );

    if (
      currentPercentageNumeric !== null &&
      Math.abs(currentPercentageNumeric - computedPercentage) < 0.01
    ) {
      return undefined;
    }

    return computedPercentage;
  },
});

const buildBrokerageAutoPopulateConfigs = (
  section: string,
  fieldSet: BrokerageFieldSet
): AutoPopulateConfig[] => {
  const configs: AutoPopulateConfig[] = [
    createBrokerageAutoPopulateConfig(
      section,
      fieldSet.basicBase,
      "basicBrokeragePercentage",
      "basicBrokerageAmount"
    ),
    createBrokerageAutoPopulateConfig(
      section,
      fieldSet.srccBase,
      "srccPercentage",
      "srccBrokerageAmount"
    ),
    createBrokerageAutoPopulateConfig(
      section,
      fieldSet.tcBase,
      "terrorismBrokeragePercentage",
      "tcBrokerageAmount"
    ),
  ];

  return configs;
};

const PolicyHardCopyActivity: React.FC<CommonActivityProps> = ({
  onSubmit,
  activity,
  dynamicValues,
  setBreadCumbStep,
  saveStatusData,
  submitStatusData,
  approvedStatusData,
  rejectedStatusData,
  breadCumbSep,
  setSubmittedBreadCumb,
  opportunityActivityStatus,
  submitStatusDataForApproval,
  Role,
  isLost = false,
  setIsOpportunityWon,
  setIsOptyWorkInProgress,
  optyActivitiesState,
  setOptyActivitiesState,
}) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const submissionInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAppliedInitialNormalizeRef = useRef(false);

  const userOrganisationKey = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.organisationKey
    : null;

  const beginSubmission = () => {
    if (submissionInFlightRef.current) return false;
    submissionInFlightRef.current = true;
    setIsSubmitting(true);
    return true;
  };

  const endSubmission = () => {
    submissionInFlightRef.current = false;
    setIsSubmitting(false);
  };
  const latestValuesRef = useRef<Record<string, any>>({});
  const skipNextOnChange = useRef(false);
  const userChangedPolicyPlacedTypeRef = useRef(false);
  const userPolicyPlacedChangedAtRef = useRef<number>(0);
  const activeUserPolicyPlacedTransitionRef = useRef<{
    from: string;
    to: string;
    startedAt: number;
  } | null>(null);
  const initialPolicyPlacedFlipSuppressedRef = useRef(false);
  const userChangedPremiumInstallmentToggleRef = useRef(false);
  const lastMergedLeadInsurerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { id: opportunityId } = useParams<{ id: string }>();

  const dispatch = useDispatch();
  const isInUserPolicyPlacedToggleWindow = useCallback(
    () => Date.now() - userPolicyPlacedChangedAtRef.current < 1200,
    []
  );

  // Function to scroll to accordion header on validation failure
  const scrollToAccordionHeader = () => {
    const accordionEl = containerRef.current?.closest(
      '[data-testid="Root-accordion"]'
    ) as HTMLElement | null;
    accordionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [isPutCall, setIsPutCall] = React.useState(false);
  const [suppressBreadCrumbAdvance, setSuppressBreadCrumbAdvance] =
    useState(false);
  const [deviationAddressedId, setDeviationsAddressedLid] = useState<
    string | null
  >(null);
  const [deviationCoveragesId, setDeviationCoveragesId] = useState<
    string | null
  >(null);
  const [premiumInstallmentToggle, setPremiumInstallmentToggle] = useState<
    string | null
  >(null);

  const hasInitializedHeldCoverNoteDeviationRef = useRef(false);

  useEffect(() => {
    if (activity?.activityKey !== ACTIVITY_KEYS.HELD_COVER_NOTE) {
      hasInitializedHeldCoverNoteDeviationRef.current = false;
    }
  }, [activity?.activityKey]);

  const [isPolicyHardCopyDisabled, setIsPolicyHardCopyDisabled] =
    useState(false);

  const [
    isCoverageDeviationsYesInPolicyHardCopy,
    setIsCoverageDeviationsYesInPolicyHardCopy,
  ] = useState<string | null>(null);

  const [lockFirstInsurer, setLockFirstInsurer] = useState(false);
  const updateLockFirstInsurer = useCallback(
    (nextValue: boolean) =>
      setLockFirstInsurer((prev) => (prev === nextValue ? prev : nextValue)),
    []
  );

  const skipNextOnChangeRef = skipNextOnChange;
  const [insurerPrefillVersion, setInsurerPrefillVersion] = useState(0);
  const pendingLeadPrefillRef = useRef<number | null>(null);
  const lastLeadInsurerIdRef = useRef<number | null>(null);
  const [leadInsurerSelectionVersion, setLeadInsurerSelectionVersion] =
    useState(0);
  const [insurerDetailsVersion, setInsurerDetailsVersion] = useState(0);

  const [isFormMounted, setIsFormMounted] = useState(false);

  const isUnsetValue = (value: unknown) =>
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && !Number.isNaN(value) && value === 0);
  const isInstallmentValueMissing = (value: unknown) =>
    value === null || value === undefined || value === "";
  const normalizeInstallmentDetails = (rows: any): any[] => {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      if (!row || typeof row !== "object") return false;
      return !(
        isInstallmentValueMissing(row?.installmentNetAmount) &&
        isInstallmentValueMissing(row?.installmentPercentage)
      );
    });
  };
  const buildEmptyInstallmentRow = () => ({
    installmentDate: null,
    installmentNetAmount: null,
    installmentNo: null,
    installmentSequence: 1,
    installmentPercentage: null,
    taxPercentage: null,
    taxAmount: null,
    installmentGrossAmount: null,
    modeOfPayment: null,
  });
  const normalizeInsurerDetailsValue = (value: any) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      if (Array.isArray(value.retArray)) return value.retArray;
      if (Array.isArray(value.data)) return value.data;
    }
    return value;
  };

  const attachInstallmentSummarySection = (values: any) => {
    if (!values || typeof values !== "object") return values;
    const deviation = values?.deviationSection ?? {};
    const summary = values?.installmentSummarySection ?? {};
    const normalizedInstallmentDetails = normalizeInstallmentDetails(
      values?.installmentDetails
    );
    const hasInstallments = normalizedInstallmentDetails.length > 0;
    const normalizedInstallmentToggle = hasInstallments
      ? deviation?.isPremiumInstallmentBased ??
        summary?.isPremiumInstallmentBased ??
        dynamicValues?.TOGGLE_YES
      : dynamicValues?.TOGGLE_NO;
    return {
      ...values,
      installmentDetails: hasInstallments
        ? normalizedInstallmentDetails
        : [buildEmptyInstallmentRow()],
      deviationSection: {
        ...deviation,
        isPremiumInstallmentBased: normalizedInstallmentToggle,
      },
      installmentSummarySection: {
        ...summary,
        isPremiumInstallmentBased: normalizedInstallmentToggle,
        totalInstallmentAmount:
          deviation?.totalInstallmentAmount ?? summary?.totalInstallmentAmount,
      },
    };
  };

  const mergeInstallmentSummaryIntoDeviation = (values: any) => {
    if (!values || typeof values !== "object") return values;
    const summary = values?.installmentSummarySection;
    if (!summary) return values;
    const deviation = values?.deviationSection ?? {};
    values.deviationSection = { ...deviation, ...summary };
    delete values.installmentSummarySection;
    return values;
  };

  const applyFormUpdatesOnce = (currValues: any, updates: any) => {
    if (
      !updates ||
      !formRef.current?.isMounted ||
      !formRef.current?.setValues
    ) {
      return;
    }

    const nextValues: any = { ...currValues };

    Object.entries(updates).forEach(([key, value]) => {
      if (key === "insurerDetails") {
        value = normalizeInsurerDetailsValue(value);
      }
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        currValues?.[key] &&
        typeof currValues[key] === "object" &&
        !Array.isArray(currValues[key])
      ) {
        nextValues[key] = {
          ...currValues[key],
          ...value,
        };
      } else {
        nextValues[key] = value;
      }
    });

    skipNextOnChangeRef.current = true;
    formRef.current.setValues(updates);
    latestValuesRef.current = nextValues;
    if (Object.prototype.hasOwnProperty.call(updates, "insurerDetails")) {
      setInsurerDetailsVersion((prev) => prev + 1);
      
      setTimeout(() => {
        const formValues = formRef.current?.getValues?.() || {};
        if (grossPremiumAutoPopulateConfigs.length > 0) {
          handleAutoPopulateGrossPremium(formValues);
        }
        if (isSriLankaUser && brokerageAutoPopulateConfigs.length > 0) {
          handleAutoPopulateBrokerageAmounts(formValues);
        }
      }, 100);
    }
  };

  useEffect(() => {
    hasAppliedInitialNormalizeRef.current = false;
  }, [activity?.activityKey, activity?.opportunityActivityId]);

  const currActivityDataFromGlobalState =
    optyActivitiesState[activity?.activityKey];

  const shouldSaveOnUnmountRef = useRef(true);
  const [approverName, setApproverName] = useState<string | null>(null);
  const [isPolicyDocUploading, setIsPolicyDocUploading] = useState(false);
  const [policyDocDiff, setPolicyDocDiff] = useState<Record<string, any>>({});
  const policyDocInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      const formValues = latestValuesRef.current;
      const hasValidFormData = (formValues: Record<string, any>): boolean => {
        return Object.values(formValues).some((section) => {
          if (Array.isArray(section)) {
            return section.some((item) => {
              if (typeof item === "object" && item !== null) {
                return Object.values(item).some(
                  (val) => val !== null && val !== "" && val !== undefined
                );
              }
              return item !== null && item !== "" && item !== undefined;
            });
          }

          if (typeof section === "object" && section !== null) {
            return Object.values(section).some(
              (value) => value !== null && value !== "" && value !== undefined
            );
          }

          return section !== null && section !== "" && section !== undefined;
        });
      };

      if (shouldSaveOnUnmountRef.current && hasValidFormData(formValues)) {
        setOptyActivitiesState((prevState) => {
          return {
            ...prevState,
            [activity?.activityKey]: {
              key: activity?.activityKey,
              data: formValues,
            },
          };
        });
      }
    };
  }, []);

  //activity config
  const { data: activityMetaData, isLoading: isActivityMetaLoading } = useQuery(
    {
      queryKey: ["activityMetaData", opportunityId, activity.id],
      enabled: !!opportunityId && !!activity.id,

      queryFn: async () => {
        if (activity.isCoversRequired) {
          const [configData, coverConfigData, coversPrefillData] =
            await Promise.all([
              apiRequest(
                endPoints.activityMetaByOpportunityId(
                  Number(opportunityId),
                  activity.id
                )
              ),
              apiRequest(
                endPoints.coversMetaByOpportunityId(
                  Number(opportunityId),
                  activity.id
                )
              ),
              apiRequest(
                endPoints.opportunityCoversPrefill(
                  Number(activity.opportunityActivityId)
                )
              ),
            ]);

          const sectionAwareCoversConfig = buildSectionAwareCoverConfig(
            coverConfigData?.data
          );

          const response = configData?.data?.activityMeta?.map((item) => {
            if (item?.isCoversRequired) {
              return {
                ...item,
                config: sectionAwareCoversConfig, // section-aware formConfig for covers
                defaultValues: coversPrefillData?.data?.covers || {},
              };
            }
            return item;
          });

          return {
            ...configData?.data,
            activityMeta: response,
            coversConfig: sectionAwareCoversConfig || [],
            coversPrefillData: coversPrefillData?.data?.covers || {},
          };
        } else {
          const response = await apiRequest(
            endPoints.activityMetaByOpportunityId(
              Number(opportunityId),
              activity.id
            )
          );
          return response?.data;
        }
      },
    }
  );

  //activity data to render in form
  const { data: getActivityData, isLoading: isGetActivityLoading } =
    useApiQuery({
      queryKey: [
        "opportunityGetCall",
        activity.opportunityActivityId,
        activityMetaData,
      ],
      url: endPoints.opportunityActivitiesByopportunityActivityId(
        Number(activity.opportunityActivityId)
      ),
      enabled: !!activity.opportunityActivityId && !!activityMetaData,
      //  &&
      // !currActivityDataFromGlobalState,
    });

  const shouldPrefillPreferredInsurers = [
    ACTIVITY_KEYS.POLICY_HARD_COPY,
  ].includes(activity?.activityKey ?? "");

  const { data: preferredInsurersData } = useApiQuery({
    queryKey: [
      "preferredInsurers",
      opportunityId,
      activity?.opportunityActivityId,
      activity?.activityKey,
      latestValuesRef.current?.leadInsurerId,
      latestValuesRef.current?.policyPlacedTypeLid,
      latestValuesRef.current?.insurerDetails?.length,
    ],
    url: endPoints.preferredInsurersByOpportunityId(Number(opportunityId)),
    enabled: shouldPrefillPreferredInsurers && !!opportunityId,
  });

  const shouldPrefillInstallments = [ACTIVITY_KEYS.POLICY_HARD_COPY].includes(
    activity?.activityKey ?? ""
  );

  const { data: installmentsPrefillData } = useApiQuery({
    queryKey: [
      "installmentsPrefill",
      opportunityId,
      activity?.opportunityActivityId,
      activity?.activityKey,
    ],
    url: endPoints.installmentsByOpportunityId(Number(opportunityId)),
    enabled: shouldPrefillInstallments && !!opportunityId,
  });

  const policyHardCopyActivityKey = ACTIVITY_KEYS.POLICY_HARD_COPY;
  const isPolicyHardCopyActivity =
    activity?.activityKey === policyHardCopyActivityKey ||
    activityMetaData?.activityKey === policyHardCopyActivityKey;

  const hasMeaningfulActivityData = React.useCallback((data: any): boolean => {
    if (!data) {
      return false;
    }
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    if (typeof data === "object") {
      return Object.values(data).some((value) => {
        if (value === null || value === "" || value === undefined) {
          return false;
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === "object") {
          return Object.keys(value).length > 0;
        }
        return true;
      });
    }
    return true;
  }, []);

  useEffect(() => {
    const hasServerData = hasMeaningfulActivityData(
      getActivityData?.data?.dataActivity
    );
    if (hasServerData) {
      setIsPutCall(true);
    }
  }, [
    activity?.opportunityActivityId,
    getActivityData?.data?.dataActivity,
    hasMeaningfulActivityData,
  ]);

  useEffect(() => {
    if (!shouldPrefillInstallments || installmentPrefillApplied.current) {
      return;
    }
    if (!isFormMounted || !formRef.current?.isMounted) {
      return;
    }

    const activityDataInstallments =
      getActivityData?.data?.dataActivity?.installmentDetails;
    const hasActivityInstallmentsField = Object.prototype.hasOwnProperty.call(
      getActivityData?.data?.dataActivity ?? {},
      "installmentDetails"
    );
    if (hasActivityInstallmentsField) {
      installmentPrefillApplied.current = true;
      return;
    }

    const existingInstallments = activityDataInstallments;
    if (normalizeInstallmentDetails(existingInstallments).length > 0) {
      installmentPrefillApplied.current = true;
      return;
    }

    const prefillRows = resolvePrefillInstallments();
    if (prefillRows.length === 0) {
      return;
    }

    const normalized = prefillRows
      .map((row: any, index: number) => ({
        installmentDate: row?.installmentDate ?? null,
        installmentNetAmount: row?.installmentNetAmount ?? null,
        installmentPercentage: row?.installmentPercentage ?? null,
        installmentSequence: row?.installmentSequence ?? index + 1,
        id: row?.id ?? null,
      }))
      .sort(
        (a, b) =>
          (a.installmentSequence ?? Number.MAX_SAFE_INTEGER) -
          (b.installmentSequence ?? Number.MAX_SAFE_INTEGER)
      );

    const baseValues = latestValuesRef.current ?? {};
    const updates: Record<string, any> = { installmentDetails: normalized };
    if (baseValues?.deviationSection) {
      updates.deviationSection = {
        ...baseValues.deviationSection,
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_YES,
      };
    } else if (baseValues?.premiumReceiptDetailsSection) {
      updates.premiumReceiptDetailsSection = {
        ...baseValues.premiumReceiptDetailsSection,
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_YES,
      };
    }
    updates.installmentSummarySection = {
      ...(baseValues?.installmentSummarySection ?? {}),
      isPremiumInstallmentBased: dynamicValues?.TOGGLE_YES,
    };
    applyFormUpdatesOnce(baseValues, updates);
    installmentPrefillApplied.current = true;
  }, [
    shouldPrefillInstallments,
    installmentsPrefillData,
    getActivityData?.data?.dataActivity?.installmentDetails,
    applyFormUpdatesOnce,
    isFormMounted,
  ]);

  useEffect(() => {
    if (!isFormMounted || !formRef.current?.isMounted) {
      return;
    }
    if (userChangedPremiumInstallmentToggleRef.current) {
      return;
    }
    const hasActivityInstallmentsField = Object.prototype.hasOwnProperty.call(
      getActivityData?.data?.dataActivity ?? {},
      "installmentDetails"
    );
    const existingInstallments = normalizeInstallmentDetails(
      getActivityData?.data?.dataActivity?.installmentDetails
    );
    const prefillRows = resolvePrefillInstallments();
    const hasInstallments = hasActivityInstallmentsField
      ? existingInstallments.length > 0
      : existingInstallments.length > 0 || prefillRows.length > 0;
    const currentValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};
    const desiredToggle = hasInstallments
      ? dynamicValues?.TOGGLE_YES
      : dynamicValues?.TOGGLE_NO;
    const currentToggle =
      currentValues?.deviationSection?.isPremiumInstallmentBased ??
      currentValues?.installmentSummarySection?.isPremiumInstallmentBased;
    if (String(currentToggle) === String(desiredToggle)) {
      return;
    }
    const updates: Record<string, any> = {
      deviationSection: {
        ...(currentValues?.deviationSection ?? {}),
        isPremiumInstallmentBased: desiredToggle,
      },
      installmentSummarySection: {
        ...(currentValues?.installmentSummarySection ?? {}),
        isPremiumInstallmentBased: desiredToggle,
      },
    };
    applyFormUpdatesOnce(currentValues, updates);
  }, [
    isFormMounted,
    installmentsPrefillData,
    getActivityData?.data?.dataActivity?.installmentDetails,
    dynamicValues?.TOGGLE_YES,
    dynamicValues?.TOGGLE_NO,
  ]);

  //for post call
  const mutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        endSubmission();
        setIsPutCall(true);
        dispatch(setToastMessage(response?.message));
        if (!suppressBreadCrumbAdvance) {
          setBreadCumbStep((prev) => (prev === null ? 0 : prev + 1));
          setSubmittedBreadCumb((breadCumbSep ?? 0) + 1);
        }

        setSuppressBreadCrumbAdvance(false);
      },
      onError: (error) => {
        endSubmission();
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const sanitizeParticipant = (participant: any) => {
    if (!participant) return {};
    const hasValue = Object.values(participant).some((val: any) => {
      if (Array.isArray(val)) return val.length > 0;
      return val !== null && val !== undefined && val !== "";
    });
    return hasValue ? participant : {};
  };

  const sanitizeParticipantFields = (data: any) => {
    const updated = { ...data };
    if (updated.insurerParticipants !== undefined) {
      updated.insurerParticipants = sanitizeParticipant(
        updated.insurerParticipants
      );
    }
    if (updated.tpaParticipants !== undefined) {
      updated.tpaParticipants = sanitizeParticipant(updated.tpaParticipants);
    }
    const toggleYes = String(dynamicValues?.TOGGLE_YES ?? "");
    const summaryInstallmentToggle = String(
      updated?.installmentSummarySection?.isPremiumInstallmentBased ?? ""
    );
    const deviationInstallmentToggle = String(
      updated?.deviationSection?.isPremiumInstallmentBased ?? ""
    );
    const normalizedInstallmentDetails = normalizeInstallmentDetails(
      updated?.installmentDetails
    );
    const isInstallmentBased =
      summaryInstallmentToggle === toggleYes ||
      deviationInstallmentToggle === toggleYes;
    if (!isInstallmentBased || normalizedInstallmentDetails.length === 0) {
      updated.installmentDetails = [];
      updated.deviationSection = {
        ...(updated?.deviationSection ?? {}),
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
      };
      updated.installmentSummarySection = {
        ...(updated?.installmentSummarySection ?? {}),
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
      };
    } else {
      updated.installmentDetails = normalizedInstallmentDetails;
    }
    return updated;
  };

  const stripDeviationFields = (data: any) => {
    if (data?.deviationsAddressedSection) {
      DEVIATION_FIELDS_TO_REMOVE.forEach((field) => {
        delete data.deviationsAddressedSection[field];
      });
      delete data.deviationsAddressedSection.deviationSection;
    }
    if (data?.deviationSection) {
      delete data.deviationSection.deviationCoveragesLid;
      delete data.deviationSection.installmentDetails;
    }
  };

  const stripWrongSectionBrokerage = (data: any) => {
    if (data?.policyDataWrongSection) {
      delete data.policyDataWrongSection.brokeragePercentage;
      delete data.policyDataWrongSection.brokerageAmount;
    }
  };

  const mutate = useApiMutation({
    config: {
      onSuccess: (response) => {
        endSubmission();
        setIsPutCall(true);
        dispatch(setToastMessage(response?.message));
      },
      onError: (error) => {
        endSubmission();
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handlePolicyDocUpload = async (file: File) => {
    setIsPolicyDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest(
        endPoints.extractPolicyDetails(activity.opportunityActivityId),
        { method: 'POST', data: formData }
      );
      const fields = response?.data?.fields ?? {};

      if (fields.policy_number?.extracted) {
        formRef.current?.setValues?.({
          insurerPolicyHardCopyDetails: { insurerPolicyNo: fields.policy_number.extracted },
        });
      }

      const diff: Record<string, any> = {};
      Object.keys(POLICY_DETAILS_FIELD_MAP).forEach((k) => {
        const f = fields[k];
        if (f && f.extracted !== undefined && f.extracted !== null && f.extracted !== "") {
          diff[POLICY_DETAILS_FIELD_MAP[k]] = f.extracted;
        }
      });
      setPolicyDocDiff(diff);
      dispatch(setToastMessage('File uploaded successfully'));
    } catch {
      dispatch(setToastMessage('Failed to process policy document'));
    } finally {
      setIsPolicyDocUploading(false);
    }
  };

  const createTaskForPolicyHardCopy = async () => {
    const getValues = formRef?.current?.getValues?.();
    const isValid = formRef.current?.validateSection
      ? await formRef.current.validateSection(["deviationSection"])
      : false;

    if (isValid) {
      mutate.mutate({
        endpoint: endPoints.createDeviationTask,
        method: HTTP_METHODS.POST,
        data: {
          taskName: DEVIATION_TASK_NAMES.POLICY_HARD_COPY_TASK,
          description: getValues?.deviationSection?.basicPremium.toString(),
          opportunityActivityId: activity?.opportunityActivityId,
        },
      });
    }
  };

  const saveActivity = async () => {
    // Same submission guard as submit/approve/reject
    if (!beginSubmission()) return;

    try {
      if (formRef.current) {
        formRef.current?.clearErrors?.([], true);
        const values = formRef.current?.getValues?.() || {};
        const {
          // basicCovers,
          isMandateExists,
          dataValidationTitle,
          validationButton,
          policyConfirmationTitle,
          isPolicyDataWrongConfig,
          // policyHardCopyCoversConfig,
          documents,
          ...rest
        } = values;
        let sanitizedRest = sanitizeParticipantFields(rest);
        mergeInstallmentSummaryIntoDeviation(sanitizedRest);
        const cleanedRest = cleanEmptyArrayRows(sanitizedRest);
        stripDeviationFields(cleanedRest);
        if (cleanedRest?.policyDataWrongSection) {
          delete cleanedRest.policyDataWrongSection.basicPremium;
        }
        stripWrongSectionBrokerage(cleanedRest);
        stripSriLankaBrokerage({
          data: cleanedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        const finalPayload = sanitizeRestForInsurerDetails(cleanedRest);

        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: finalPayload?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
        });

        mutate.mutate({
          endpoint: isPutCall
            ? endPoints.updateOpportunityActivity(
                activity.opportunityActivityId
              )
            : endPoints.activityMeta,
          method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
          data: {
            opportunityActivityId: activity.opportunityActivityId,
            ...finalPayload,
            ...(activity.activityKey !== "opportunity_lost_activity" &&
              documentsPayload),
            statusLid: saveStatusData.data[0].id,
            activityStatusKey: "SAVE_ACTIVITY",
          },
        });
      } else {
        // no formRef, end submission to avoid stuck loading
        endSubmission();
      }
    } catch (error) {
      endSubmission();
      throw error;
    }
  };

  const submit = async () => {
    if (!beginSubmission()) return;
    try {
      const values = await formRef.current?.submitAll?.();

      if (values && values.isAllValid) {
        const {
          // basicCovers,
          dataValidationTitle,
          validationButton,
          isMandateExists,
          policyConfirmationTitle,
          isPolicyDataWrongConfig,
          documents,
          // policyHardCopyCoversConfig,
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        mergeInstallmentSummaryIntoDeviation(sanitizedRest);
        stripDeviationFields(sanitizedRest);
        if (sanitizedRest?.policyDataWrongSection) {
          delete sanitizedRest.policyDataWrongSection.basicPremium;
        }
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        // stripFinalNegotiationDisallowedFields(sanitizedRest);
        // let parsed = parseNumbersDeep(rest);

        // Ensure chequeNumber is a string
        // parsed = parseStringsDeep(parsed, STRING_FIELDS);
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
        });

        mutation.mutate(
          {
            endpoint: isPutCall
              ? endPoints.updateOpportunityActivity(
                  activity.opportunityActivityId
                )
              : endPoints.activityMeta,
            method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
            data: {
              opportunityActivityId: activity.opportunityActivityId,
              ...sanitizedRest,
              ...(activity.activityKey !== "opportunity_lost_activity" &&
                documentsPayload),
              statusLid: submitStatusData.data[0].id,
              activityStatusKey: "COMPLETE_ACTIVITY",
            },
          },
          {
            onSuccess() {
              if (activity.activityKey === "kdm_meeting_activity") {
                setIsOptyWorkInProgress(true);
              }
            },
          }
        );
      } else {
        endSubmission();
        // Scroll to accordion header if validation fails
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
        );
        scrollToAccordionHeader();
      }
    } catch (error) {
      endSubmission();
      throw error;
    }
  };

  const submitWithStatus = async (statusData, suppressBreadCrumb = false) => {
    if (!beginSubmission()) return;
    if (suppressBreadCrumb) setSuppressBreadCrumbAdvance(true);
    try {
      const values = await formRef.current?.submitAll?.();

      if (values && values.isAllValid) {
        const {
          // basicCovers,
          dataValidationTitle,
          validationButton,
          isMandateExists,
          policyConfirmationTitle,
          isPolicyDataWrongConfig,
          documents,
          // policyHardCopyCoversConfig,
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        mergeInstallmentSummaryIntoDeviation(sanitizedRest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        // stripFinalNegotiationDisallowedFields(sanitizedRest);

        // let parsed = parseNumbersDeep(rest);

        // Ensure chequeNumber is a string
        // parsed = parseStringsDeep(parsed, STRING_FIELDS);

        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
        });

        mutation.mutate(
          {
            endpoint: isPutCall
              ? endPoints.updateOpportunityActivity(
                  activity.opportunityActivityId
                )
              : endPoints.activityMeta,
            method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
            data: {
              opportunityActivityId: activity.opportunityActivityId,
              ...sanitizedRest,
              ...(activity.activityKey !== "opportunity_lost_activity" &&
                documentsPayload),
              statusLid: statusData.data[0].id,
              activityStatusKey: "SUBMIT_ACTIVITY",
            },
          },
          {
            onSuccess(response) {
              const approvedByName = response?.data?.approverDetails?.name;
              if (approvedByName) {
                setApproverName(approvedByName);
              }
              setStatusLid(statusData.data[0].id);
            },
          }
        );
      } else {
        endSubmission();
        // Scroll to accordion header if validation fails
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
        );
        scrollToAccordionHeader();
      }
    } catch (error) {
      endSubmission();
      throw error;
    }
  };
  const handleApproveReject = async (
    statusData,
    suppressBreadCrumb = false,
    actionType
  ) => {
    if (!beginSubmission()) return;
    if (suppressBreadCrumb) setSuppressBreadCrumbAdvance(true);
    try {
      const values = await formRef.current?.submitAll?.();

      if (values && values.isAllValid) {
        const {
          // basicCovers,
          dataValidationTitle,
          validationButton,
          isMandateExists,
          policyConfirmationTitle,
          isPolicyDataWrongConfig,
          documents,
          // policyHardCopyCoversConfig,
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        mergeInstallmentSummaryIntoDeviation(sanitizedRest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        // stripFinalNegotiationDisallowedFields(sanitizedRest);
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
        });
        mutation.mutate(
          {
            endpoint: endPoints.activityApproval(
              activity.opportunityActivityId
            ),
            method: HTTP_METHODS.PUT,
            data: {
              opportunityActivityId: activity.opportunityActivityId,
              ...sanitizedRest,
              ...(activity.activityKey !== "opportunity_lost_activity" &&
                documentsPayload),
              statusLid: statusData.data[0].id,
              activityStatusKey: actionType,
            },
          },
          {
            onSuccess: (response) => {
              if (
                activity.activityKey === "placement_slip_generation_activity" &&
                actionType === "APPROVE_ACTIVITY"
              ) {
                setIsOpportunityWon(true);
              }
              setStatusLid(statusData.data[0].id);
            },
          }
        );
      } else {
        endSubmission();
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
        );
        scrollToAccordionHeader();
      }
    } catch (error) {
      endSubmission();
      throw error;
    }
  };
  const approve = () =>
    handleApproveReject(
      approvedStatusData,
      false,
      ACTION_TYPES.APPROVE_ACTIVITY
    );
  const reject = () =>
    handleApproveReject(rejectedStatusData, true, ACTION_TYPES.REJECT_ACTIVITY);
  const submitForApproval = () =>
    submitWithStatus(submitStatusDataForApproval, true);

  const hasAppliedFinalizedQuotePrefill = useRef(false);
  const initialQuotePrefillApplied = useRef(false);
  const hasUserChangedFinalizedQuoteRef = useRef(false);
  const preferredInsurerPrefillApplied = useRef(false);
  const installmentPrefillApplied = useRef(false);
  const insurerDetailsServerPrefillApplied = useRef(false);
  const lastServerInsurerSnapshotRef = useRef<string | null>(null);
  const skipRecalculateShareRef = useRef(false);
  const resolvePreferredInsurerRows = () => {
    if (!preferredInsurersData) return [];

    const insurerDetailsRows =
      preferredInsurersData?.data?.insurerDetails?.data ??
      preferredInsurersData?.insurerDetails?.data;

    if (Array.isArray(insurerDetailsRows) && insurerDetailsRows.length > 0) {
      return insurerDetailsRows;
    }

    if (isPolicyHardCopyActivity) {
      return [];
    }

    const rowsFromApi =
      preferredInsurersData?.data?.data ?? preferredInsurersData?.data ?? [];

    return Array.isArray(rowsFromApi) ? rowsFromApi : [];
  };

  const resolvePrefillInstallments = () => {
    if (!installmentsPrefillData) return [];
    const rows =
      installmentsPrefillData?.data?.installmentDetails ??
      installmentsPrefillData?.installmentDetails ??
      installmentsPrefillData?.data ??
      [];
    return normalizeInstallmentDetails(rows);
  };

  useEffect(() => {
    hasAppliedFinalizedQuotePrefill.current = false;
    initialQuotePrefillApplied.current = false;
    hasUserChangedFinalizedQuoteRef.current = false;
    preferredInsurerPrefillApplied.current = false;
    installmentPrefillApplied.current = false;
    lastMergedLeadInsurerIdRef.current = null;
    insurerDetailsServerPrefillApplied.current = false;
    lastServerInsurerSnapshotRef.current = null;
  }, [activity?.opportunityActivityId]);

  const mergePreferredInsurersIntoData = useCallback(
    (
      target: Record<string, any>,
      leadInsurerId?: number | null,
      options?: { force?: boolean; onlyLeadRow?: boolean }
    ): boolean => {
      const force = options?.force ?? false;
      const onlyLeadRow = options?.onlyLeadRow ?? false;
      const shouldPrefillAllRows = !onlyLeadRow;
      const sectionKey = "insurerDetails";

      if (insurerDetailsServerPrefillApplied.current && !force) {
        preferredInsurerPrefillApplied.current = true;
        return false;
      }

      if (!shouldPrefillPreferredInsurers) {
        preferredInsurerPrefillApplied.current = false;
        return false;
      }

      if (!force && preferredInsurerPrefillApplied.current) {
        return false;
      }

      const apiRows = resolvePreferredInsurerRows();
      if (!Array.isArray(apiRows) || apiRows.length === 0) {
        return false;
      }

      const toNumberOrNull = (value: any) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };
      const normalizeNumber = (value: any) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      let effectiveLeadInsurerId = leadInsurerId;
      if (!effectiveLeadInsurerId) {
        const fallbackLeadId = toNumberOrNull(apiRows?.[0]?.insurerId);
        if (!fallbackLeadId) {
          return false;
        }
        effectiveLeadInsurerId = fallbackLeadId;
        if (leadSectionMeta?.leadInsurerField) {
          const leadSectionKey = leadSectionMeta.sectionKey;
          const existingLeadSection =
            (target?.[leadSectionKey] as Record<string, any>) ?? {};
          target[leadSectionKey] = {
            ...existingLeadSection,
            [leadSectionMeta.leadInsurerField]: fallbackLeadId,
          };
        }
      }

      const selectedLead = apiRows.find(
        (row: any) => Number(row?.insurerId) === Number(effectiveLeadInsurerId)
      );
      if (!selectedLead) {
        return false;
      }

      if (!shouldPrefillAllRows) {
        const mappedRow = {
          insurerId: toNumberOrNull(selectedLead?.insurerId),
          insurerBranchId: toNumberOrNull(selectedLead?.insurerBranchId),
          insurerContactId: toNumberOrNull(selectedLead?.insurerContactId),
          insurerLocationId: toNumberOrNull(selectedLead?.insurerLocationId),
          sharePercentage:
            normalizeNumber(selectedLead?.sharePercentage) ?? 100,
          shareAmount: normalizeNumber(selectedLead?.shareAmount),
          brokeragePercentage: normalizeNumber(
            selectedLead?.brokeragePercentage
          ),
          brokerageAmount: normalizeNumber(selectedLead?.brokerageAmount),
          terrorismSharePercentage:
            normalizeNumber(selectedLead?.terrorismSharePercentage) ??
            normalizeNumber(selectedLead?.sharePercentage),
          terrorismShareAmount: normalizeNumber(
            selectedLead?.terrorismShareAmount
          ),
          terrorismBrokeragePercentage: normalizeNumber(
            selectedLead?.terrorismBrokeragePercentage
          ),
          terrorismBrokerageAmount: normalizeNumber(
            selectedLead?.terrorismBrokerageAmount
          ),
          totalBrokerageAmount: normalizeNumber(
            selectedLead?.totalBrokerageAmount
          ),
          isLeadInsurer: dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
        };

        if (mappedRow.insurerId === null) {
          pendingLeadPrefillRef.current = effectiveLeadInsurerId ?? null;
          return false;
        }

        const existingValue = target[sectionKey];
        if (Array.isArray(existingValue)) {
          target[sectionKey] = [mappedRow, ...existingValue.slice(1)];
        } else if (
          existingValue &&
          typeof existingValue === "object" &&
          Array.isArray(existingValue?.retArray)
        ) {
          target[sectionKey] = {
            ...existingValue,
            retArray: [mappedRow, ...existingValue.retArray.slice(1)],
          };
        } else {
          target[sectionKey] = [mappedRow];
        }

        if (!force) {
          preferredInsurerPrefillApplied.current = true;
        }
        pendingLeadPrefillRef.current = null;
        setInsurerPrefillVersion((prev) => prev + 1);
        return true;
      }

      const preferredRows = (() => {
        const normalizedRows = apiRows
          .map((row: any) => ({
            insurerId: toNumberOrNull(row?.insurerId),
            insurerLocationId: toNumberOrNull(row?.insurerLocationId),
            insurerBranchId: toNumberOrNull(row?.insurerBranchId),
            insurerContactId: toNumberOrNull(row?.insurerContactId),
            sharePercentage: row?.sharePercentage ?? null,
            shareAmount: row?.shareAmount ?? null,
            brokeragePercentage: row?.brokeragePercentage ?? null,
            brokerageAmount: row?.brokerageAmount ?? null,
            terrorismSharePercentage:
              row?.terrorismSharePercentage ?? row?.sharePercentage ?? null,
            terrorismShareAmount: row?.terrorismShareAmount ?? null,
            terrorismBrokeragePercentage:
              row?.terrorismBrokeragePercentage ?? null,
            terrorismBrokerageAmount: row?.terrorismBrokerageAmount ?? null,
            totalBrokerageAmount: row?.totalBrokerageAmount ?? null,
            raw: row,
          }))
          .filter((item) => item.insurerId !== null);

        const leadIndex = normalizedRows.findIndex(
          (item) => Number(item.insurerId) === Number(selectedLead?.insurerId)
        );
        if (leadIndex > 0) {
          const [leadRow] = normalizedRows.splice(leadIndex, 1);
          normalizedRows.unshift(leadRow);
        }

        return normalizedRows.map((item, index) => ({
          insurerId: item.insurerId,
          insurerLocationId: item.insurerLocationId,
          insurerBranchId: item.insurerBranchId,
          insurerContactId: item.insurerContactId,
          sharePercentage: item.sharePercentage,
          shareAmount: item.shareAmount,
          brokeragePercentage: item.brokeragePercentage,
          brokerageAmount: item.brokerageAmount,
          terrorismSharePercentage: item.terrorismSharePercentage,
          terrorismShareAmount: item.terrorismShareAmount,
          terrorismBrokeragePercentage: item.terrorismBrokeragePercentage,
          terrorismBrokerageAmount: item.terrorismBrokerageAmount,
          totalBrokerageAmount: item.totalBrokerageAmount,
          isLeadInsurer:
            index === 0
              ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
              : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO,
        }));
      })();

      if (preferredRows.length > 1 && leadSectionMeta?.policyPlacedField) {
        const leadSectionKey = leadSectionMeta.sectionKey;
        const existingLeadSection =
          (target?.[leadSectionKey] as Record<string, any>) ?? {};
        const multipleValue =
          dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER ??
          existingLeadSection[leadSectionMeta.policyPlacedField];
        target[leadSectionKey] = {
          ...existingLeadSection,
          [leadSectionMeta.policyPlacedField]: multipleValue,
        };
      }

      if (preferredRows.length === 0) {
        pendingLeadPrefillRef.current = effectiveLeadInsurerId ?? null;
        return false;
      }

      const originalInsurerDetailsValue = target[sectionKey];

      const normalizeInsurerDetails = (value: any) => {
        if (Array.isArray(value)) {
          return [...value];
        }
        if (
          value &&
          typeof value === "object" &&
          Array.isArray(value.retArray)
        ) {
          return [...value.retArray];
        }
        return [];
      };

      const buildMergedRows = (rows: any[]) => {
        const mergedRows: any[] = [];
        preferredRows.forEach((preferredRow, index) => {
          const baseRow = rows[index] ?? {};
          const nextRow = { ...baseRow };
          [
            "insurerId",
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
            "sharePercentage",
            "shareAmount",
            "brokeragePercentage",
            "brokerageAmount",
            "terrorismSharePercentage",
            "terrorismShareAmount",
            "terrorismBrokeragePercentage",
            "terrorismBrokerageAmount",
            "totalBrokerageAmount",
          ].forEach((field) => {
            if (
              preferredRow[field] !== null &&
              preferredRow[field] !== undefined
            ) {
              nextRow[field] = preferredRow[field];
            }
          });
          if (preferredRow.isLeadInsurer) {
            nextRow.isLeadInsurer = preferredRow.isLeadInsurer;
          } else if (
            nextRow.isLeadInsurer !==
            dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
          ) {
            nextRow.isLeadInsurer = preferredRow.isLeadInsurer;
          }
          mergedRows.push(nextRow);
        });

        if (rows.length > preferredRows.length) {
          mergedRows.push(...rows.slice(preferredRows.length));
        }

        return mergedRows;
      };

      const existingRows = normalizeInsurerDetails(originalInsurerDetailsValue);

      const selectLeadInsurerId = toNumberOrNull(selectedLead?.insurerId);
      if (selectLeadInsurerId === null) {
        pendingLeadPrefillRef.current = effectiveLeadInsurerId ?? null;
        return false;
      }

      const finalRows = buildMergedRows(existingRows);

      if (Array.isArray(originalInsurerDetailsValue)) {
        target[sectionKey] = finalRows;
      } else if (
        originalInsurerDetailsValue &&
        typeof originalInsurerDetailsValue === "object" &&
        Array.isArray(originalInsurerDetailsValue.retArray)
      ) {
        target[sectionKey] = {
          ...originalInsurerDetailsValue,
          retArray: finalRows,
        };
      } else {
        target[sectionKey] = finalRows;
      }

      if (!force) {
        preferredInsurerPrefillApplied.current = true;
      }

      pendingLeadPrefillRef.current = null;
      setInsurerPrefillVersion((prev) => prev + 1);
      return true;
    },
    [
      preferredInsurersData,
      shouldPrefillPreferredInsurers,
      dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
      dynamicValues?.INSURER_PARTICIPATION_TYPE_CO,
    ]
  );

  const getLeadInsurerIdFromValues = (values?: Record<string, any>) =>
    values?.feeDetails?.leadInsurerId ??
    values?.policyDetails?.leadInsurerId ??
    values?.premiumReceiptDetailsSection?.leadInsurerId ??
    null;

  const toNumberOrNull = (value: any): number | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const extractInsurerRows = (source?: any): any[] => {
    if (!source) {
      return [];
    }
    if (Array.isArray(source)) {
      return source.map((row) => ({ ...(row || {}) }));
    }
    if (
      typeof source === "object" &&
      source !== null &&
      Array.isArray(source.retArray)
    ) {
      return source.retArray.map((row: any) => ({ ...(row || {}) }));
    }

    if (
      typeof source === "object" &&
      source !== null &&
      Array.isArray(source.data)
    ) {
      return source.data.map((row: any) => ({ ...(row || {}) }));
    }

    return [];
  };

  const hasMeaningfulInsurerRows = (rows: any[]): boolean =>
    rows.some(
      (row) =>
        row &&
        typeof row === "object" &&
        Object.values(row).some(
          (value) => value !== null && value !== "" && value !== undefined
        )
    );

  const hasInsurerSelections = (rows: any[]): boolean =>
    rows.some((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }
      const value = row?.insurerId;
      if (value === null || value === undefined || value === "") {
        return false;
      }
      const parsed = Number(value);
      return !Number.isNaN(parsed);
    });

  const hasInsurerSelectionsInValues = (values?: Record<string, any>) =>
    hasInsurerSelections(extractInsurerRows(values?.insurerDetails));

  const hasInsurerDetailsInValues = (values?: Record<string, any>) =>
    hasMeaningfulInsurerRows(extractInsurerRows(values?.insurerDetails));

  const shouldForcePreferredInsurerPrefill = (values?: Record<string, any>) => {
    if (userChangedPolicyPlacedTypeRef.current) {
      return false;
    }
    const shouldApplyMultiplePrefill = isPolicyHardCopyActivity;
    if (!shouldApplyMultiplePrefill) {
      return false;
    }
    const preferredRows = resolvePreferredInsurerRows();
    if (!Array.isArray(preferredRows) || preferredRows.length === 0) {
      return false;
    }
    const currentRows = extractInsurerRows(values?.insurerDetails);
    const selectedCount = currentRows.reduce((count, row) => {
      const id = Number(row?.insurerId);
      return Number.isNaN(id) ? count : count + 1;
    }, 0);
    return selectedCount < preferredRows.length;
  };

  const getBasePremiumForInsurerRows = (values?: Record<string, any>) => {
    if (!values) {
      return null;
    }
    return (
      parseNumericInput(values?.selectFinalisedQuote?.basicPremium) ??
      parseNumericInput(values?.policyDetails?.basicPremium) ??
      parseNumericInput(values?.policyDetails?.totalPremium) ??
      null
    );
  };

  const getTerrorismPremiumForInsurerRows = (
    values?: Record<string, any>
  ) => {
    if (!values) {
      return null;
    }
    return (
      parseNumericInput(values?.deviationSection?.terrorism) ??
      parseNumericInput(values?.selectFinalisedQuote?.terrorism) ??
      null
    );
  };

  const normalizeInsurerRowsFromSource = (
    rows: any[],
    basePremium: number | null,
    terrorismPremium: number | null = null
  ) => {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row, index) => {
        if (!row || typeof row !== "object") {
          return null;
        }

        const sharePercentage = parseNumericInput(row?.sharePercentage);
        let shareAmount = parseNumericInput(row?.shareAmount);
        if (
          shareAmount === null &&
          sharePercentage !== null &&
          basePremium !== null
        ) {
          shareAmount = Number(
            ((basePremium * sharePercentage) / 100).toFixed(4)
          );
        }

        const brokeragePercentage = parseNumericInput(row?.brokeragePercentage);
        let brokerageAmount = parseNumericInput(row?.brokerageAmount);
        if (
          brokerageAmount === null &&
          shareAmount !== null &&
          brokeragePercentage !== null
        ) {
          brokerageAmount = Number(
            ((shareAmount * brokeragePercentage) / 100).toFixed(4)
          );
        }

        const terrorismBrokeragePercentage = parseNumericInput(
          row?.terrorismBrokeragePercentage
        );
        let terrorismBrokerageAmount = parseNumericInput(
          row?.terrorismBrokerageAmount ?? row?.tcBrokerageAmount
        );
        // Terrorism brokerage rides on the terrorism premium share, not the basic one.
        // Rows saved before terrorism had its own split fall back to the premium share.
        const terrorismSharePercentage =
          parseNumericInput(row?.terrorismSharePercentage) ?? sharePercentage;
        const terrorismShareAmount =
          parseNumericInput(row?.terrorismShareAmount) ??
          (terrorismPremium !== null && terrorismSharePercentage !== null
            ? Number(
                ((terrorismPremium * terrorismSharePercentage) / 100).toFixed(4)
              )
            : null);
        if (
          terrorismBrokerageAmount === null &&
          terrorismShareAmount !== null &&
          terrorismBrokeragePercentage !== null
        ) {
          terrorismBrokerageAmount = Number(
            ((terrorismShareAmount * terrorismBrokeragePercentage) / 100).toFixed(
              4
            )
          );
        }

        const totalBrokerageAmount = parseNumericInput(
          row?.totalBrokerageAmount
        );

        return {
          ...row,
          insurerId: toNumberOrNull(row?.insurerId ?? row?.id),
          insurerLocationId: toNumberOrNull(row?.insurerLocationId),
          insurerBranchId: toNumberOrNull(row?.insurerBranchId),
          insurerContactId: toNumberOrNull(row?.insurerContactId),
          sharePercentage,
          shareAmount,
          brokeragePercentage,
          brokerageAmount,
          terrorismSharePercentage,
          terrorismShareAmount,
          terrorismBrokeragePercentage,
          terrorismBrokerageAmount,
          totalBrokerageAmount,
          isLeadInsurer:
            row?.isLeadInsurer ??
            (index === 0
              ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
              : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO),
        };
      })
      .filter((row): row is Record<string, any> => row !== null);
  };

  const syncLeadSectionWithInsurerRows = (
    values: Record<string, any>
  ): Record<string, any> => {
    if (!isSharedInsurerActivity) {
      return values;
    }

    // stop auto-syncing it based on insurer rows.
    if (userChangedPolicyPlacedTypeRef.current) {
      return values;
    }

    const rows = extractInsurerRows(values?.insurerDetails);
    if (rows.length === 0) {
      return values;
    }

    const leadSectionKey = leadSectionMeta.sectionKey;
    const leadSection = { ...(values?.[leadSectionKey] ?? {}) };
    let changed = false;

    if (
      leadSectionMeta.leadInsurerField &&
      rows[0]?.insurerId &&
      !leadSection?.[leadSectionMeta.leadInsurerField]
    ) {
      leadSection[leadSectionMeta.leadInsurerField] = rows[0].insurerId;
      changed = true;
    }

    if (
      leadSectionMeta.policyPlacedField &&
      dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER &&
      dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
    ) {
      const currentValue = leadSection[leadSectionMeta.policyPlacedField];
      const desiredValue =
        rows.length > 1
          ? dynamicValues.POLICY_PLACED_TYPE_MULTIPLE_INSURER
          : dynamicValues.POLICY_PLACED_TYPE_SINGLE_INSURER;

      if (
        desiredValue &&
        String(currentValue ?? "") !== String(desiredValue)
      ) {
        leadSection[leadSectionMeta.policyPlacedField] = desiredValue;
        changed = true;
      }
    }

    if (changed) {
      return {
        ...values,
        [leadSectionKey]: leadSection,
      };
    }

    return values;
  };

  const apiInsurerRows = extractInsurerRows(
    getActivityData?.data?.dataActivity?.insurerDetails
  );
  const hasApiInsurerDetails = hasMeaningfulInsurerRows(apiInsurerRows);

  useEffect(() => {
    if (!pendingLeadPrefillRef.current) {
      return;
    }

    let baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    if (!hasInsurerDetailsInValues(baseValues)) {
      const synced = syncLeadSectionWithInsurerRows(baseValues);
      if (synced !== baseValues) {
        skipNextOnChange.current = true;
        formRef.current?.setValues?.({
          [leadSectionMeta.sectionKey]: synced[leadSectionMeta.sectionKey],
        });
        latestValuesRef.current = {
          ...(latestValuesRef.current || {}),
          [leadSectionMeta.sectionKey]: synced[leadSectionMeta.sectionKey],
        };
        baseValues = synced;
      }
    }

    const hasSelections = hasInsurerSelectionsInValues(baseValues);
    const forcePlacementPrefill =
      !preferredInsurerPrefillApplied.current &&
      shouldForcePreferredInsurerPrefill(baseValues);

    if (hasSelections && !forcePlacementPrefill) {
      return;
    }

    const target: Record<string, any> = {
      insurerDetails: baseValues?.insurerDetails,
      [leadSectionMeta.sectionKey]: baseValues?.[leadSectionMeta.sectionKey],
    };

    const merged = mergePreferredInsurersIntoData(
      target,
      pendingLeadPrefillRef.current,
      { force: true }
    );

    if (merged) {
      applyFormUpdatesOnce(baseValues, {
        insurerDetails: target.insurerDetails,
        [leadSectionMeta.sectionKey]: target[leadSectionMeta.sectionKey],
      });
      pendingLeadPrefillRef.current = null;
    }
  }, [
    preferredInsurersData,
    mergePreferredInsurersIntoData,
    applyFormUpdatesOnce,
  ]);

  useEffect(() => {
    if (!isFormMounted || !formRef.current?.isMounted) return;
    if (hasAppliedInitialNormalizeRef.current) return;

    // always prefer latest data from activity-data API
    const apiData = getActivityData?.data?.dataActivity;
    const source = apiData;
    if (!source) return;

    let normalized = normalizeApiDataForResetting(source);
    normalized = attachInstallmentSummarySection(normalized);
    const basePremiumForRows = getBasePremiumForInsurerRows(source);
    const terrorismPremiumForRows = getTerrorismPremiumForInsurerRows(source);
    const normalizedInsurerRows = normalizeInsurerRowsFromSource(
      extractInsurerRows(normalized?.insurerDetails),
      basePremiumForRows,
      terrorismPremiumForRows
    );
    if (normalizedInsurerRows.length > 0) {
      normalized.insurerDetails = normalizedInsurerRows;
    }
    const normalizedHasSelections = hasInsurerSelectionsInValues(normalized);
    const forcePlacementPrefill =
      !preferredInsurerPrefillApplied.current &&
      shouldForcePreferredInsurerPrefill(normalized);

    if (!normalizedHasSelections || forcePlacementPrefill) {
      mergePreferredInsurersIntoData(
        normalized,
        getLeadInsurerIdFromValues(normalized)
      );
    }

    if (isSharedInsurerActivity && !userChangedPolicyPlacedTypeRef.current) {
      normalized = syncLeadSectionWithInsurerRows(normalized);
    }

    // prevent onValuesChange from firing business logic for these programmatic updates
    skipNextOnChange.current = true;

    const baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    if (formRef.current?.resetForms) {
      skipNextOnChange.current = true;
      formRef.current.resetForms(normalized);
      latestValuesRef.current = normalized;
      if (Object.prototype.hasOwnProperty.call(normalized, "insurerDetails")) {
        setInsurerDetailsVersion((prev) => prev + 1);
      }
    } else {
      applyFormUpdatesOnce(baseValues, normalized);
    }

    // mark as done (prevents repeat runs = prevents loop)
    hasAppliedInitialNormalizeRef.current = true;

    updateLockFirstInsurer(false);
  }, [
    // stable triggers only when it matters
    isFormMounted,
    activity?.activityKey,
    activity?.opportunityActivityId,
    // use booleans instead of whole objects to avoid ref-churn loops
    !!currActivityDataFromGlobalState?.data,
    !!getActivityData?.data?.dataActivity,
    mergePreferredInsurersIntoData,
    hasApiInsurerDetails,
  ]);

  useEffect(() => {
    if (currActivityDataFromGlobalState?.data && !hasApiInsurerDetails) {
      let normalized = normalizeApiDataForResetting(
        currActivityDataFromGlobalState.data
      );
      normalized = attachInstallmentSummarySection(normalized);
      const basePremiumForRows = getBasePremiumForInsurerRows(
        currActivityDataFromGlobalState.data
      );
      const terrorismPremiumForRows = getTerrorismPremiumForInsurerRows(
        currActivityDataFromGlobalState.data
      );
      const normalizedInsurerRows = normalizeInsurerRowsFromSource(
        extractInsurerRows(normalized?.insurerDetails),
        basePremiumForRows,
        terrorismPremiumForRows
      );
      if (normalizedInsurerRows.length > 0) {
        normalized.insurerDetails = normalizedInsurerRows;
      }
      const normalizedHasSelections = hasInsurerSelectionsInValues(normalized);
      const forcePlacementPrefill =
        !preferredInsurerPrefillApplied.current &&
        shouldForcePreferredInsurerPrefill(normalized);

      if (!normalizedHasSelections || forcePlacementPrefill) {
        mergePreferredInsurersIntoData(
          normalized,
          getLeadInsurerIdFromValues(normalized)
        );
      }

      if (isSharedInsurerActivity && !userChangedPolicyPlacedTypeRef.current) {
        normalized = syncLeadSectionWithInsurerRows(normalized);
      }

      const currentValues =
        Object.keys(latestValuesRef.current || {}).length > 0
          ? latestValuesRef.current
          : formRef.current?.getValues?.() ?? {};
      if (formRef.current?.resetForms) {
        skipNextOnChange.current = true;
        formRef.current.resetForms(normalized);
        latestValuesRef.current = normalized;
        if (
          Object.prototype.hasOwnProperty.call(normalized, "insurerDetails")
        ) {
          setInsurerDetailsVersion((prev) => prev + 1);
        }
      } else {
        applyFormUpdatesOnce(currentValues, normalized);
      }
    }
  }, [
    activity?.activityKey,
    currActivityDataFromGlobalState?.data,
    getActivityData?.data?.dataActivity,
    mergePreferredInsurersIntoData,
    hasApiInsurerDetails,
  ]);

  // Updated validation functions with state management
  const currentActivityKey = activityMetaData?.activityKey ?? "";
  const isPolicyHardCopyMeta = currentActivityKey === policyHardCopyActivityKey;
  const isSharedInsurerActivity =
    SHARED_INSURER_ACTIVITY_KEYS.has(currentActivityKey);
  const leadSectionMeta =
    LEAD_SECTION_CONFIG_MAP[
      currentActivityKey as keyof typeof LEAD_SECTION_CONFIG_MAP
    ] ?? LEAD_SECTION_CONFIG_MAP[ACTIVITY_KEYS.POLICY_HARD_COPY];
  const latestLeadSectionValues =
    latestValuesRef.current?.[leadSectionMeta.sectionKey];
  const syncPolicyHardCopyFlags = useCallback(
    (values: Record<string, any> | null | undefined) => {
      if (!isPolicyHardCopyMeta) {
        return;
      }
      const deviationId =
        values?.deviationsAddressedSection?.deviationsAddressedLid ?? null;
      setDeviationsAddressedLid((prev) =>
        prev === deviationId ? prev : deviationId
      );
      const anyDeviation =
        values?.deviationsAddressedSection?.deviationCoveragesLid ?? null;
      setDeviationCoveragesId((prev) =>
        prev === anyDeviation ? prev : anyDeviation
      );
      const isDeviationsYesInHardCopy =
        values?.deviationSection?.deviationsLid ?? null;
      setIsCoverageDeviationsYesInPolicyHardCopy((prev) =>
        prev === isDeviationsYesInHardCopy ? prev : isDeviationsYesInHardCopy
      );
      const installmentToggle =
        values?.deviationSection?.isPremiumInstallmentBased ??
        values?.installmentSummarySection?.isPremiumInstallmentBased ??
        null;
      setPremiumInstallmentToggle((prev) =>
        prev === installmentToggle ? prev : installmentToggle
      );
    },
    [
      isPolicyHardCopyMeta,
      setDeviationsAddressedLid,
      setDeviationCoveragesId,
      setIsCoverageDeviationsYesInPolicyHardCopy,
    ]
  );

  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

  const resolvedConfig = React.useMemo(() => {
    if (!activityMetaData?.activityKey) return [];

    const activityMeta = getActivityConfig(
      activityMetaData.activityKey,
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

    // Inject covers config and documents
    const shouldDisableInsurerSelection =
      isSharedInsurerActivity &&
      !latestLeadSectionValues?.[leadSectionMeta.leadInsurerField];

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
          const docValue = policyDocDiff[field.name];
          if (docValue !== undefined) {
            return {
              ...field,
              helperText: (liveValue: any) => (
                <PolicyDocDiffHelperText
                  matched={policyDocValuesMatch(liveValue, docValue)}
                >
                  {`Document: ${docValue}`}
                </PolicyDocDiffHelperText>
              ),
            };
          }
          return field;
        });
      }

      return finalGroup;
    });

    return enhancedConfig;
  }, [
    activityMetaData,
    dynamicValues,
    getActivityData,
    latestLeadSectionValues?.[leadSectionMeta.leadInsurerField],
    deviationAddressedId,
    deviationCoveragesId,
    isCoverageDeviationsYesInPolicyHardCopy,
    premiumInstallmentToggle,
    lockFirstInsurer,
    isSharedInsurerActivity,
    insurerPrefillVersion,
    leadInsurerSelectionVersion,
    insurerDetailsVersion,
    isExportAllowed,
    activity.isDocumentMandatory,
    policyDocDiff,
  ]);

  useEffect(() => {
    if (!isSharedInsurerActivity) {
      return;
    }
    if (isInUserPolicyPlacedToggleWindow()) {
      return;
    }
    if (userChangedPolicyPlacedTypeRef.current) {
      return;
    }

    const apiSource =
      getActivityData?.data?.dataActivity?.insurerDetails ??
      currActivityDataFromGlobalState?.data?.insurerDetails;

    const basePremiumFromSource = getBasePremiumForInsurerRows(
      getActivityData?.data?.dataActivity ??
        currActivityDataFromGlobalState?.data
    );
    const terrorismPremiumFromSource = getTerrorismPremiumForInsurerRows(
      getActivityData?.data?.dataActivity ??
        currActivityDataFromGlobalState?.data
    );

    const normalizedRows = normalizeInsurerRowsFromSource(
      extractInsurerRows(apiSource),
      basePremiumFromSource,
      terrorismPremiumFromSource
    );
    if (!hasMeaningfulInsurerRows(normalizedRows)) {
      return;
    }

    const signature = JSON.stringify(normalizedRows);
    if (signature !== lastServerInsurerSnapshotRef.current) {
      lastServerInsurerSnapshotRef.current = signature;
      insurerDetailsServerPrefillApplied.current = false;
    }

    if (insurerDetailsServerPrefillApplied.current) {
      return;
    }

    if (
      !isFormMounted ||
      !formRef.current?.isMounted ||
      !formRef.current?.setValues
    ) {
      return;
    }

    const currentRowsSource =
      latestValuesRef.current?.insurerDetails ??
      formRef.current?.getValues?.()?.insurerDetails;
    const currentRows = extractInsurerRows(currentRowsSource);
    const normalizedCurrentRows = normalizeInsurerRowsFromSource(
      currentRows,
      basePremiumFromSource,
      terrorismPremiumFromSource
    );
    const currentSignature = hasMeaningfulInsurerRows(normalizedCurrentRows)
      ? JSON.stringify(normalizedCurrentRows)
      : null;

    // If form already equals server snapshot, just mark as synced.
    if (currentSignature === signature) {
      insurerDetailsServerPrefillApplied.current = true;
      return;
    }

    skipNextOnChange.current = true;
    formRef.current.setValues({ insurerDetails: normalizedRows });

    setTimeout(() => {
      const formValues = formRef.current?.getValues?.() || {};
      if (grossPremiumAutoPopulateConfigs.length > 0) {
        handleAutoPopulateGrossPremium(formValues);
      }
      if (isSriLankaUser && brokerageAutoPopulateConfigs.length > 0) {
        handleAutoPopulateBrokerageAmounts(formValues);
      }
    }, 100);

    const nextLatest = {
      ...(latestValuesRef.current || {}),
      insurerDetails: normalizedRows,
    };
    latestValuesRef.current = nextLatest;
    insurerDetailsServerPrefillApplied.current = true;
    setInsurerDetailsVersion((prev) => prev + 1);
  }, [
    activity?.activityKey,
    currActivityDataFromGlobalState?.data?.insurerDetails,
    getActivityData?.data?.dataActivity?.insurerDetails,
    isFormMounted,
    isSharedInsurerActivity,
    isInUserPolicyPlacedToggleWindow,
  ]);

  // Preferred insurer prefill handled during initial normalize/reset
  useEffect(() => {
    if (
      !shouldPrefillPreferredInsurers ||
      preferredInsurerPrefillApplied.current ||
      !isFormMounted ||
      !formRef.current?.isMounted ||
      !formRef.current?.getValues ||
      userChangedPolicyPlacedTypeRef.current ||
      isGetActivityLoading
    ) {
      return;
    }
    if (isInUserPolicyPlacedToggleWindow()) {
      return;
    }

    const activityInsurerDetails =
      getActivityData?.data?.dataActivity?.insurerDetails;
    const hasActivityInsurerDetails =
      (Array.isArray(activityInsurerDetails) &&
        activityInsurerDetails.length > 0) ||
      (activityInsurerDetails &&
        typeof activityInsurerDetails === "object" &&
        Array.isArray(activityInsurerDetails.retArray) &&
        activityInsurerDetails.retArray.length > 0);

    if (hasActivityInsurerDetails) {
      preferredInsurerPrefillApplied.current = true;
      return;
    }

    const baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    const target: Record<string, any> = {
      insurerDetails: baseValues?.insurerDetails,
      [leadSectionMeta.sectionKey]: baseValues?.[leadSectionMeta.sectionKey],
    };

    const leadInsurerId = getLeadInsurerIdFromValues(baseValues);

    const merged = mergePreferredInsurersIntoData(
      target,
      leadInsurerId ?? null
    );
    if (!merged) {
      return;
    }

    const nextInsurerDetails = target.insurerDetails;

    const updates: Record<string, any> = {
      insurerDetails: nextInsurerDetails,
      [leadSectionMeta.sectionKey]: target[leadSectionMeta.sectionKey],
    };

    const extractInsurerRows = (value: any) => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object" && Array.isArray(value.retArray)) {
        return value.retArray;
      }
      return [];
    };

    if (isSharedInsurerActivity) {
      const rows = extractInsurerRows(nextInsurerDetails);
      const firstInsurerId = rows[0]?.insurerId ?? null;
      const leadSectionKey = leadSectionMeta.sectionKey;
      const existingLeadSection = baseValues?.[leadSectionKey] ?? {};
      const updatedLeadSection = { ...existingLeadSection };
      let shouldUpdateLeadSection = false;

      const preferredRows = resolvePreferredInsurerRows();
      if (
        preferredRows.length > 1 &&
        leadSectionMeta.policyPlacedField &&
        !userChangedPolicyPlacedTypeRef.current
      ) {
        updatedLeadSection[leadSectionMeta.policyPlacedField] =
          dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER;
        shouldUpdateLeadSection = true;
      }

      if (
        firstInsurerId !== null &&
        !updatedLeadSection?.[leadSectionMeta.leadInsurerField]
      ) {
        updatedLeadSection[leadSectionMeta.leadInsurerField] = firstInsurerId;
        shouldUpdateLeadSection = true;
      }

      if (
        rows.length > 0 &&
        leadSectionMeta.policyPlacedField &&
        !userChangedPolicyPlacedTypeRef.current
      ) {
        // ALWAYS enforce from row count when user has not touched the field yet
        const forcedValue =
          rows.length > 1
            ? dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
            : dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;

        updatedLeadSection[leadSectionMeta.policyPlacedField] = forcedValue;
        shouldUpdateLeadSection = true;
      }

      if (shouldUpdateLeadSection) {
        updates[leadSectionKey] = updatedLeadSection;
      }
    }

    skipNextOnChange.current = true;
    formRef.current?.setValues?.(updates);

    const nextLatestValues = { ...latestValuesRef.current };
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        nextLatestValues[key] &&
        typeof nextLatestValues[key] === "object" &&
        !Array.isArray(nextLatestValues[key])
      ) {
        nextLatestValues[key] = {
          ...nextLatestValues[key],
          ...value,
        };
      } else {
        nextLatestValues[key] = value;
      }
    });
    latestValuesRef.current = nextLatestValues;
  }, [
    shouldPrefillPreferredInsurers,
    preferredInsurersData,
    isFormMounted,
    mergePreferredInsurersIntoData,
    isInUserPolicyPlacedToggleWindow,
    isSharedInsurerActivity,
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    leadSectionMeta.policyPlacedField,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    isGetActivityLoading,
    getActivityData?.data?.dataActivity?.insurerDetails,
  ]);

  useEffect(() => {
    if (
      !shouldPrefillPreferredInsurers ||
      preferredInsurerPrefillApplied.current ||
      !isFormMounted ||
      !formRef.current?.isMounted ||
      !formRef.current?.getValues ||
      userChangedPolicyPlacedTypeRef.current ||
      isGetActivityLoading
    ) {
      return;
    }
    if (isInUserPolicyPlacedToggleWindow()) {
      return;
    }

    const activityInsurerDetails =
      getActivityData?.data?.dataActivity?.insurerDetails;
    const hasActivityInsurerDetails =
      (Array.isArray(activityInsurerDetails) &&
        activityInsurerDetails.length > 0) ||
      (activityInsurerDetails &&
        typeof activityInsurerDetails === "object" &&
        Array.isArray(activityInsurerDetails.retArray) &&
        activityInsurerDetails.retArray.length > 0);

    if (hasActivityInsurerDetails) {
      return;
    }

    const apiRows =
      preferredInsurersData?.data?.insurerDetails?.data ??
      preferredInsurersData?.insurerDetails?.data ??
      preferredInsurersData;

    if (!Array.isArray(apiRows) || apiRows.length === 0) {
      return;
    }

    const normalizedRows = apiRows
      .map((row: any) => {
        const insurerId =
          row?.insurerId === null || row?.insurerId === undefined
            ? null
            : Number(row.insurerId);
        if (insurerId === null) {
          return null;
        }
        return {
          ...row,
          insurerId,
        };
      })
      .filter((row): row is Record<string, any> => row !== null);

    if (normalizedRows.length === 0) {
      return;
    }

    const baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    const leadSectionKey = leadSectionMeta.sectionKey;
    const leadInsurerFieldName = leadSectionMeta.leadInsurerField;
    const policyPlacedFieldName = leadSectionMeta.policyPlacedField;

    const existingLeadSection = baseValues?.[leadSectionKey] ?? {};
    const desiredPolicyPlaced =
      normalizedRows.length > 1
        ? dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
        : dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;

    const leadParticipationCode = Number(
      dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
    );

    const leadRowFromApi =
      normalizedRows.find((row) =>
        Number.isFinite(leadParticipationCode)
          ? Number(row?.isLeadInsurer ?? 0) === leadParticipationCode
          : false
      ) ?? normalizedRows[0];

    const nextLeadInsurerId =
      existingLeadSection?.[leadInsurerFieldName] ??
      leadRowFromApi?.insurerId ??
      null;
    const leadSectionUpdates: Record<string, any> = {};

    if (
      policyPlacedFieldName &&
      desiredPolicyPlaced &&
      existingLeadSection?.[policyPlacedFieldName] !== desiredPolicyPlaced &&
      !userChangedPolicyPlacedTypeRef.current
    ) {
      leadSectionUpdates[policyPlacedFieldName] = desiredPolicyPlaced;
    }

    if (
      leadInsurerFieldName &&
      nextLeadInsurerId &&
      existingLeadSection?.[leadInsurerFieldName] !== nextLeadInsurerId
    ) {
      leadSectionUpdates[leadInsurerFieldName] = nextLeadInsurerId;
    }

    const updates: Record<string, any> = {};

    if (Object.keys(leadSectionUpdates).length > 0) {
      updates[leadSectionKey] = {
        ...existingLeadSection,
        ...leadSectionUpdates,
      };
    }

    const resolvedLeadInsurerId =
      updates[leadSectionKey]?.[leadInsurerFieldName] ??
      existingLeadSection?.[leadInsurerFieldName] ??
      null;

    const existingInsurerRows = extractInsurerRows(baseValues?.insurerDetails);
    const hasExistingSelections = hasInsurerSelections(existingInsurerRows);

    if (resolvedLeadInsurerId && !hasExistingSelections) {
      const target: Record<string, any> = {
        insurerDetails: baseValues?.insurerDetails,
        [leadSectionMeta.sectionKey]: baseValues?.[leadSectionMeta.sectionKey],
      };
      const merged = mergePreferredInsurersIntoData(
        target,
        resolvedLeadInsurerId
      );
      if (merged) {
        updates.insurerDetails = target.insurerDetails;
        updates[leadSectionMeta.sectionKey] =
          target[leadSectionMeta.sectionKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    applyFormUpdatesOnce(baseValues, updates);
  }, [
    shouldPrefillPreferredInsurers,
    preferredInsurersData,
    isFormMounted,
    mergePreferredInsurersIntoData,
    applyFormUpdatesOnce,
    isInUserPolicyPlacedToggleWindow,
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    leadSectionMeta.policyPlacedField,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    isGetActivityLoading,
    getActivityData?.data?.dataActivity?.insurerDetails,
  ]);

  useEffect(() => {
    setIsFormMounted(false);
  }, [activity?.activityKey, resolvedConfig]);

  useEffect(() => {
    if (isFormMounted) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verifyMount = () => {
      if (cancelled) {
        return;
      }
      if (formRef.current?.isMounted) {
        setIsFormMounted(true);
        return;
      }
      timer = setTimeout(verifyMount, 50);
    };

    timer = setTimeout(verifyMount, 0);

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [activity?.activityKey, isFormMounted, resolvedConfig]);

  // this is for the Auto-populate and need to refactorin the future ----------
  const autoPopulateBeforeSetValues = React.useCallback(() => {
    skipNextOnChange.current = true;
  }, []);

  const isSriLankaUser = React.useMemo(
    () =>
      getCountrySpecificConfig(false, {
        "Sri Lanka": true,
      }),
    []
  );

  const getActiveFieldKey = () => {
    if (typeof document === "undefined") return null;
    const activeElement = document.activeElement as HTMLElement | null;
    const activeName = activeElement?.getAttribute("name");
    if (!activeName) return null;
    const parts = activeName.split(".");
    return parts[parts.length - 1] || null;
  };

  const grossPremiumAutoPopulateConfigs = React.useMemo(() => {
    switch (activityMetaData?.activityKey) {
      case "policy_hard_copy_activity": {
        const netPremiumBaseFields = [
          "deviationSection.basicPremium",
          "deviationSection.srccAmount",
          "deviationSection.terrorism",
        ];
        const baseFields = [
          ...netPremiumBaseFields,
          "deviationSection.gstAmount",
        ];
        const chargeFields = [
          ...baseFields,
          "deviationSection.fee",
          "deviationSection.other",
          "deviationSection.adminCharges",
          "deviationSection.cessAmount",
        ];
        const totalBrokerageFields = [
          "deviationSection.basicBrokerageAmount",
          "deviationSection.srccBrokerageAmount",
          "deviationSection.tcBrokerageAmount",
          "deviationSection.fee",
        ];

        return [
          {
            target: "deviationSection.netPremium",
            fields: netPremiumBaseFields,
            compute: ({ values }) => {
              const sectionValues = values?.deviationSection;
              const basicPremium = parseNumericInput(
                sectionValues?.basicPremium
              );
              const terrorism = parseNumericInput(sectionValues?.terrorism);
              const srccAmount = parseNumericInput(sectionValues?.srccAmount);
              if (
                basicPremium === null &&
                terrorism === null &&
                srccAmount === null
              ) {
                return "";
              }

              return Number(
                (
                  (basicPremium ?? 0) +
                  (terrorism ?? 0) +
                  (srccAmount ?? 0)
                ).toFixed(4)
              );
            },
          },
          {
            // Same pass as netPremium/grossPremium, like Placement Slip, so a
            // premium edit needs one write instead of a second onChange round.
            target: "deviationSection.gstAmount",
            fields: [
              "deviationSection.netPremium",
              "deviationSection.gstPercentage",
            ],
            compute: ({ values }: { values: Record<string, any> }) => {
              // Sri Lanka VAT has its own base (charges included).
              if (isSriLankaUser || getActiveFieldKey() === "gstAmount") {
                return undefined;
              }
              const sectionValues = values?.deviationSection;
              const gstPercentage = parseNumericInput(
                sectionValues?.gstPercentage
              );
              const netPremium = parseNumericInput(sectionValues?.netPremium);
              if (gstPercentage === null || netPremium === null) {
                return "";
              }
              return Number(((netPremium * gstPercentage) / 100).toFixed(4));
            },
          },
          {
            target: "deviationSection.grossPremium",
            fields: [
              "deviationSection.netPremium",
              "deviationSection.gstAmount",
              "deviationSection.adminCharges",
              "deviationSection.other",
              "deviationSection.cessAmount",
              "deviationSection.fee",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.deviationSection;
              const netPremium = parseNumericInput(sectionValues?.netPremium);
              const gstAmount = parseNumericInput(sectionValues?.gstAmount);
              const adminCharges = parseNumericInput(
                sectionValues?.adminCharges
              );
              const other = parseNumericInput(sectionValues?.other);
              const cessAmount = parseNumericInput(sectionValues?.cessAmount);
              const fee = parseNumericInput(sectionValues?.fee);
              if (
                netPremium === null &&
                gstAmount === null &&
                adminCharges === null &&
                other === null &&
                cessAmount === null &&
                fee === null
              ) {
                return "";
              }
              return isSriLankaUser
                ? Number(
                    (
                      (netPremium ?? 0) +
                      (gstAmount ?? 0) +
                      (adminCharges ?? 0) +
                      (other ?? 0) +
                      (cessAmount ?? 0) +
                      (fee ?? 0)
                    ).toFixed(4)
                  )
                : Number(((netPremium ?? 0) + (gstAmount ?? 0)).toFixed(4));
            },
          },
          {
            target: "deviationSection.totalInstallmentAmount",
            fields: ["deviationSection.netPremium", "deviationSection.other"],
            compute: ({ values }) => {
              const sectionValues = values?.deviationSection;
              const netPremium = parseNumericInput(sectionValues?.netPremium);
              const other = parseNumericInput(sectionValues?.other);
              if (netPremium === null && other === null) {
                return "";
              }
              return Number(((netPremium ?? 0) + (other ?? 0)).toFixed(4));
            },
          },
          {
            target: "installmentSummarySection.totalInstallmentAmount",
            fields: ["deviationSection.netPremium", "deviationSection.other"],
            compute: ({ values }) => {
              const sectionValues = values?.deviationSection;
              const netPremium = parseNumericInput(sectionValues?.netPremium);
              const other = parseNumericInput(sectionValues?.other);
              if (netPremium === null && other === null) {
                return "";
              }
              return Number(((netPremium ?? 0) + (other ?? 0)).toFixed(4));
            },
          },
          {
            target: "deviationSection.totalBrokerageAmount",
            fields: [
              "deviationSection.basicBrokerageAmount",
              "deviationSection.srccBrokerageAmount",
              "deviationSection.tcBrokerageAmount",
              "deviationSection.fee",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.deviationSection;
              const basicBrokerageAmount = parseNumericInput(
                sectionValues?.basicBrokerageAmount
              );
              const tcBrokerageAmount = parseNumericInput(
                sectionValues?.tcBrokerageAmount
              );

              const srccBrokerageAmount = parseNumericInput(
                sectionValues?.srccBrokerageAmount
              );
              const feeAmount = parseNumericInput(sectionValues?.fee);

              if (
                basicBrokerageAmount === null &&
                tcBrokerageAmount === null &&
                srccBrokerageAmount === null &&
                feeAmount === null
              ) {
                return "";
              }

              return Number(
                (
                  (basicBrokerageAmount ?? 0) +
                  (tcBrokerageAmount ?? 0) +
                  (srccBrokerageAmount ?? 0) +
                  (feeAmount ?? 0)
                ).toFixed(4)
              );
            },
          },
          // {
          //   target: "deviationSection.totalGrossPremiumIncTax",
          //   fields: baseFields,
          // },
          // {
          //   target: "deviationSection.grossPremium",
          //   fields: chargeFields,
          // },
          // {
          //   target: "deviationSection.brokerageAmount",
          //   fields: totalBrokerageFields,
          // },
        ];
      }
      default:
        return [];
    }
  }, [activityMetaData?.activityKey, isSriLankaUser]);

  const brokerageAutoPopulateConfigs = React.useMemo(() => {
    if (!isSriLankaUser) {
      return [];
    }
    return [];
  }, [activityMetaData?.activityKey, isSriLankaUser]);

  const handleAutoPopulateGrossPremium = useAutoPopulateCalculatedFields(
    formRef,
    grossPremiumAutoPopulateConfigs,
    { onBeforeSetValues: autoPopulateBeforeSetValues, forceEnable: true }
  );
  const handleAutoPopulateBrokerageAmounts = useAutoPopulateCalculatedFields(
    formRef,
    brokerageAutoPopulateConfigs,
    { forceEnable: true }
  );

  const premiumPrefillActivities = useMemo(
    () => [ACTIVITY_KEYS.POLICY_HARD_COPY],
    []
  );

  const { data: premiumDetailsResponse } = useApiQuery({
    queryKey: ["premiumDetailsId", opportunityId],
    url: endPoints.getPremiumDetails(Number(opportunityId)),
    enabled:
      !!opportunityId &&
      premiumPrefillActivities.includes(activity?.activityKey),
  });

  const premiumResponseData = useMemo(() => {
    if (!premiumDetailsResponse?.data) return null;
    return (
      premiumDetailsResponse?.data?.data ?? premiumDetailsResponse.data ?? null
    );
  }, [premiumDetailsResponse]);

  const premiumDefaults = useMemo(() => {
    if (!premiumResponseData) return null;
    const prem = transformPremiumData(premiumResponseData);

    if (activity?.activityKey === "policy_hard_copy_activity") {
      const basicPremiumOverride = prem?.basicPremium ?? prem?.premium ?? null;

      return {
        ...prem,
        basicPremium:
          basicPremiumOverride === null ? prem.premium : basicPremiumOverride,
      };
    }

    return prem;
  }, [premiumResponseData, activity?.activityKey]);

  useEffect(() => {
    const policyPlacedField = leadSectionMeta.policyPlacedField;
    if (!policyPlacedField) {
      return;
    }
    const preferredRows = resolvePreferredInsurerRows();
    if (!Array.isArray(preferredRows) || preferredRows.length <= 1) {
      return;
    }
    const multipleValue = dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER;
    if (!multipleValue) {
      return;
    }
    const leadSectionKey = leadSectionMeta.sectionKey;
    const currentLeadSection =
      latestValuesRef.current?.[leadSectionKey] ??
      formRef.current?.getValues?.()?.[leadSectionKey];
    const currentInsurerRows = extractInsurerRows(
      latestValuesRef.current?.insurerDetails ??
        formRef.current?.getValues?.()?.insurerDetails
    );
    const singleValue = dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;
    if (
      String(currentLeadSection?.[policyPlacedField] ?? "") ===
        String(singleValue) &&
      currentInsurerRows.length <= 1
    ) {
      return;
    }
    if (isInUserPolicyPlacedToggleWindow()) {
      return;
    }
    if (userChangedPolicyPlacedTypeRef.current) {
      return;
    }
    if (
      String(currentLeadSection?.[policyPlacedField] ?? "") ===
      String(multipleValue)
    ) {
      return;
    }
    const baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    applyFormUpdatesOnce(baseValues, {
      [leadSectionKey]: {
        ...(baseValues?.[leadSectionKey] ?? {}),
        [policyPlacedField]: multipleValue,
      },
    });
  }, [
    preferredInsurersData,
    isFormMounted,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    isInUserPolicyPlacedToggleWindow,
    isPolicyHardCopyActivity,
    leadSectionMeta.policyPlacedField,
    leadSectionMeta.sectionKey,
    insurerPrefillVersion,
    userChangedPolicyPlacedTypeRef,
  ]);

  useEffect(() => {
    if (
      !isFormMounted ||
      !formRef.current ||
      !premiumResponseData ||
      !premiumPrefillActivities.includes(activity?.activityKey)
    ) {
      return;
    }

    if (isGetActivityLoading) {
      return;
    }

    // If activity-data API has data, prefer that and skip brokerage prefill
    if (getActivityData?.data?.dataActivity) {
      return;
    }

    const valuesSnapshot = latestValuesRef.current || {};
    const currentValues =
      Object.keys(valuesSnapshot).length > 0
        ? valuesSnapshot
        : formRef.current?.getValues?.() || {};

    const premium = premiumDefaults;
    if (!premium) return;

    const updates: Record<string, any> = {};

    const sectionConfigs =
      PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS[activity?.activityKey ?? ""] || [];

    sectionConfigs.forEach(({ section, allowed }) => {
      const rawSection = currentValues?.[section];
      if (
        rawSection !== undefined &&
        (typeof rawSection !== "object" || rawSection === null)
      ) {
        return;
      }

      const currentSection = rawSection || {};
      const sectionUpdates: Record<string, any> = {};
      allowed.forEach((key) => {
        const value = (premium as any)[key];
        if (value === null || value === undefined) return;

        const current = currentSection[key];
        const isForceUpdateField = [
          "terrorism",
          "netPremium",
          "srccAmount",
          "basicPremium",
        ].includes(key);
        const shouldUpdate = isForceUpdateField
          ? true // Always update these fields
          : isUnsetValue(current);
        if (shouldUpdate) {
          sectionUpdates[key] = value;
        }
      });

      if (Object.keys(sectionUpdates).length > 0) {
        updates[section] = {
          ...currentSection,
          ...sectionUpdates,
        };
      }
    });

    if (Object.keys(updates).length > 0) {
      applyFormUpdatesOnce(currentValues, updates);
    }
  }, [
    activity?.activityKey,
    isFormMounted,
    formRef,
    premiumResponseData,
    premiumPrefillActivities,
    resolvedConfig,
    getActivityData?.data?.dataActivity,
    premiumDefaults,
  ]);

  const [statusLidState, setStatusLid] = useState<number | null>(null);

  const effectiveStatusLid = statusLidState ?? activityMetaData?.statusLid;

  const opportunityInitialStatus = opportunityActivityStatus?.find(
    (status: any) => status.id === effectiveStatusLid
  )?.lookUpKey;

  const actionMap = {
    saveActivity,
    submit,
    createTaskForPolicyHardCopy,
    submitForApproval,
    approve,
    reject,
  };
  const isLoading = isActivityMetaLoading || isGetActivityLoading;

  const canGiveApprovalForBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state)
  );
  const canGiveApprovalForISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state)
  );
  const canGiveApproval =
    (Role === ROLE_KEYS.BD && canGiveApprovalForBD) ||
    (Role === ROLE_KEYS.ISG && canGiveApprovalForISG);
  const canEditBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_BD_OPTY_ACTIVITY)(state)
  );
  const canEditISGActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_ISG_OPTY_ACTIVITY)(state)
  );

  const canEditActivity =
    (Role === ROLE_KEYS.BD && canEditBDActivity) ||
    (Role === ROLE_KEYS.ISG && canEditISGActivity);

  const disableServiceTaxAutoCalculation = useMemo(
    () =>
      getCountrySpecificConfig(false, {
        "Sri Lanka": true,
      }),
    []
  );

  const isActivityApproved =
    activity?.activityApproval === APPROVAL_VALUES.YES ||
    activity?.activityApproval === APPROVAL_VALUES.yes;
  const isActivitySubmitForApprovalStatus =
    opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED;
  const isActivityApproveForApprovalStatus =
    opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.APPROVED;
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

  let isFormDisabled = false;
  if (isActivityApproved) {
    if (canGiveApproval) {
      isFormDisabled =
        isLost ||
        opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.APPROVED ||
        opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.OPEN ||
        opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.CLOSED;
    } else {
      isFormDisabled = !(
        (!isLost &&
          opportunityInitialStatus ===
            OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS) ||
        opportunityInitialStatus === OPPORTUNITY_ACTIVITY_STATUS.REJECTED
      );
    }
  } else {
    isFormDisabled =
      isLost ||
      opportunityInitialStatus !== OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS;
  }

  // Use activity tasks hook
  const {
    handleCreateTask,
    TasksTable,
    TaskFormDrawer,
    isAllTasksCompleted,
    isTaskDetailsLoading,
    // Meetings
    shouldShowMeetings,
    canCompleteActivity,
    // Notes
    NotesTable,
    NoteFormDrawer,
    isNotesLoading,
  } = useActivityTasks({
    activity,
    dynamicValues,
    isFormDisabled:
      isFormDisabled ||
      isGetActivityLoading ||
      isActivitySubmitForApprovalStatus,
    canEditActivity,
  });

  const isPolicyHardCopySubmitDisabled = (vals: any, dyn: any): boolean => {
    if (opportunityInitialStatus == OPPORTUNITY_ACTIVITY_STATUS.CLOSED)
      return true;

    const anyDev = vals?.deviationsAddressedSection?.deviationCoveragesLid; // Any deviations
    const addressed = vals?.deviationsAddressedSection?.deviationsAddressedLid; // Deviation addressed
    const revisedReceived =
      vals?.deviationsAddressedSection?.policyHardCopyReceivedLid; // Revised policy hard copy Received

    const YES = String(dyn?.TOGGLE_YES);
    const NO = String(dyn?.TOGGLE_NO);

    const isUnset = (v: any) => v === null || v === undefined || v === "";
    const isYes = (v: any) => String(v) === YES;
    const isNo = (v: any) => String(v) === NO;

    // Case 6: Revised received = YES → enabled
    if (isYes(revisedReceived)) return false;

    // Case 9: nothing selected → enabled
    if (isUnset(anyDev) && isUnset(addressed) && isUnset(revisedReceived))
      return false;

    // Case 1: Any deviations = NO → enabled
    if (isNo(anyDev)) return false;

    // Any deviations = YES
    if (isYes(anyDev)) {
      // Case 3: addressed = NO → disabled
      if (isNo(addressed)) return true;

      if (isYes(addressed)) {
        // Case 5: revised received = NO → disabled  (FIX)
        if (isNo(revisedReceived)) return true;

        // Case 4: revised received unset → enabled
        return false;
      }

      // Case 2: addressed unset → enabled
      return false;
    }

    // Default: enabled
    return false;
  };

  const buildDefaultInsurerRow = (vals: any, isSinglePlacement: boolean) => {
    return {
      insurerId: null,
      insurerBranchId: null,
      insurerContactId: null,
      insurerLocationId: null,
      sharePercentage: isSinglePlacement ? 100 : null,
      shareAmount: null,
      brokeragePercentage: null,
      brokerageAmount: null,
      isLeadInsurer: isSinglePlacement
        ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
        : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO,
    };
  };

  const clearInsurerAmountFieldsOnToggle = (
    rows: any[],
    isSinglePlacement: boolean
  ) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => {
      const nextRow = { ...(row || {}) };
      nextRow.shareAmount = null;
      nextRow.brokerageAmount = null;
      nextRow.terrorismBrokeragePercentage = null;
      nextRow.terrorismBrokerageAmount = null;
      nextRow.totalBrokerageAmount = null;
      if (isSinglePlacement) {
        nextRow.sharePercentage = 100;
      }
      if (nextRow.isLeadInsurer == null) {
        nextRow.isLeadInsurer =
          index === 0
            ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
            : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO;
      }
      return nextRow;
    });
  };

  // commented code for the prefilling of totalBrokerageAmount from premium defaults
  const fillDeviationBrokerageDefaults = React.useCallback(
    (deviation: any) => {
      if (getActivityData?.data?.dataActivity || !premiumDefaults) {
        return deviation;
      }

      const updatedDeviation = { ...deviation };

      const maybeApplyDefault = (
        key:
          | "basicPremium"
          | "basicBrokeragePercentage"
          | "basicBrokerageAmount"
          | "totalBrokerageAmount"
      ) => {
        const currentValue = updatedDeviation?.[key];
        if (
          currentValue === null ||
          currentValue === undefined ||
          currentValue === ""
        ) {
          const defaultValue = premiumDefaults?.[key];
          if (defaultValue !== null && defaultValue !== undefined) {
            updatedDeviation[key] = Number(defaultValue);
          }
        }
      };

      maybeApplyDefault("basicPremium");
      maybeApplyDefault("basicBrokeragePercentage");
      maybeApplyDefault("basicBrokerageAmount");
      maybeApplyDefault("totalBrokerageAmount");

      return updatedDeviation;
    },
    [getActivityData?.data?.dataActivity, premiumDefaults]
  );

  const recalculateShareAmounts = (
    rows: any[],
    basePremium: number | null,
    prevRows?: any[],
    prevBasePremium?: number | null
  ): { updatedRows: any[]; hasChanges: boolean } => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { updatedRows: rows, hasChanges: false };
    }

    const normalizedBase =
      typeof basePremium === "number" && !Number.isNaN(basePremium)
        ? basePremium
        : null;
    const normalizedPrevBase =
      typeof prevBasePremium === "number" && !Number.isNaN(prevBasePremium)
        ? prevBasePremium
        : null;
    const previousRows = Array.isArray(prevRows) ? prevRows : [];

    let hasChanges = false;

    const updatedRows = rows.map((row, index) => {
      const sharePct = parseNumericInput(row?.sharePercentage);
      const currentShareAmount = parseNumericInput(row?.shareAmount);
      const previousRowValues = previousRows[index] || {};
      const prevSharePct = parseNumericInput(
        previousRowValues?.sharePercentage
      );
      const hasPreviousRow = Boolean(previousRows[index]);

      if (sharePct === null || normalizedBase === null) {
        if (currentShareAmount !== null) {
          hasChanges = true;
          return {
            ...row,
            shareAmount: null,
          };
        }
        return row;
      }

      let computedShareAmount = Number(
        ((normalizedBase * sharePct) / 100).toFixed(4)
      );

      const didBaseChange =
        normalizedPrevBase !== null &&
        Math.abs(normalizedBase - normalizedPrevBase) > 0.01;
      const didSharePercentageChange =
        prevSharePct !== null && Math.abs(sharePct - prevSharePct) > 0.01;

      // Preserve API-hydrated share amount when this row wasn't edited yet.
      if (
        currentShareAmount !== null &&
        (!hasPreviousRow || (!didBaseChange && !didSharePercentageChange))
      ) {
        return row;
      }

      if (
        currentShareAmount === null ||
        Math.abs(currentShareAmount - computedShareAmount) > 0.01
      ) {
        hasChanges = true;
        return {
          ...row,
          shareAmount: computedShareAmount,
        };
      }

      return row;
    });

    return { updatedRows, hasChanges };
  };

  const getLatestPolicyFieldValue = (
    updates: Record<string, any>,
    values: Record<string, any>,
    field: string
  ) => {
    if (
      updates.policyDetails &&
      Object.prototype.hasOwnProperty.call(updates.policyDetails, field)
    ) {
      return updates.policyDetails[field];
    }

    return values?.policyDetails?.[field];
  };

  const getLatestSelectFinalisedQuoteFieldValue = (
    updates: Record<string, any>,
    values: Record<string, any>,
    field: string
  ) => {
    if (
      updates.selectFinalisedQuote &&
      Object.prototype.hasOwnProperty.call(updates.selectFinalisedQuote, field)
    ) {
      return updates.selectFinalisedQuote[field];
    }

    return values?.selectFinalisedQuote?.[field];
  };

  return (
    <CommonActivitiesMainContainer
      data-testId={
        isFormDisabled || !canEditActivity || isActivitySubmitForApprovalStatus
          ? "common-activities-main-container-disabled"
          : "common-activities-main-container"
      }
      ref={containerRef}
    >
      {isLoading ? (
        <LoaderContainer>
          <CircularProgress />
        </LoaderContainer>
      ) : (
        <>
          <input
            ref={policyDocInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePolicyDocUpload(file);
              e.target.value = '';
            }}
          />
          <Button
            variantType="secondary"
            onClick={() => policyDocInputRef.current?.click()}
            disabled={isPolicyDocUploading || isFormDisabled || !canEditActivity || isActivitySubmitForApprovalStatus}
            style={{ marginBottom: 16, alignSelf: 'flex-start' }}
          >
            {isPolicyDocUploading ? <CircularProgress size={16} /> : 'Upload Policy Document'}
          </Button>
          <NestedDynamicForm
            config={resolvedConfig}
            ref={formRef}
            onActionMap={actionMap}
            disableAllFormFields={
              isFormDisabled ||
              !canEditActivity ||
              isActivitySubmitForApprovalStatus
            }
            dynamicValues={dynamicValues}
            onValuesChange={(values) => {
              if (skipNextOnChange.current) {
                skipNextOnChange.current = false;
                const prevValues = latestValuesRef.current || {};
                latestValuesRef.current = values;

                if (
                  isSharedInsurerActivity &&
                  leadSectionMeta?.policyPlacedField
                ) {
                  const leadSectionKey = leadSectionMeta.sectionKey;
                  const policyField = leadSectionMeta.policyPlacedField;
                  const prevPlaced = String(
                    prevValues?.[leadSectionKey]?.[policyField] ?? ""
                  );
                  const currPlaced = String(
                    values?.[leadSectionKey]?.[policyField] ?? ""
                  );
                  const isMultiple =
                    currPlaced !==
                    String(dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER);

                  if (prevPlaced !== currPlaced) {
                    // Skip-branch can be triggered by programmatic prefills; do not clear here.
                  }
                }

                if (isPolicyHardCopyMeta) {
                  setIsPolicyHardCopyDisabled(
                    isPolicyHardCopySubmitDisabled(values, dynamicValues)
                  );
                }
                syncPolicyHardCopyFlags(values);
                return;
              }

              const isDeepEqual = (obj1: any, obj2: any) => {
                return JSON.stringify(obj1) === JSON.stringify(obj2);
              };
              const prevValues = latestValuesRef.current || {};
              if (
                isSharedInsurerActivity &&
                leadSectionMeta?.policyPlacedField &&
                !skipNextOnChange.current &&
                isInUserPolicyPlacedToggleWindow()
              ) {
                const leadSectionKey = leadSectionMeta.sectionKey;
                const policyField = leadSectionMeta.policyPlacedField;
                const leadInsurerField = leadSectionMeta.leadInsurerField;

                const prevPlaced = String(
                  prevValues?.[leadSectionKey]?.[policyField] ?? ""
                );
                const currPlaced = String(
                  values?.[leadSectionKey]?.[policyField] ?? ""
                );
                const prevLeadInsurer = leadInsurerField
                  ? prevValues?.[leadSectionKey]?.[leadInsurerField]
                  : undefined;
                const currLeadInsurer = leadInsurerField
                  ? values?.[leadSectionKey]?.[leadInsurerField]
                  : undefined;

                if (
                  prevPlaced === currPlaced &&
                  String(prevLeadInsurer ?? "") ===
                    String(currLeadInsurer ?? "")
                ) {
                  latestValuesRef.current = values;
                  if (isPolicyHardCopyMeta) {
                    setIsPolicyHardCopyDisabled(
                      isPolicyHardCopySubmitDisabled(values, dynamicValues)
                    );
                  }
                  syncPolicyHardCopyFlags(values);
                  return;
                }
              }

              if (isDeepEqual(values, latestValuesRef.current)) {
                return;
              }

              const inUserPolicyPlacedToggleWindow =
                isInUserPolicyPlacedToggleWindow();
              if (
                activeUserPolicyPlacedTransitionRef.current &&
                Date.now() -
                  activeUserPolicyPlacedTransitionRef.current.startedAt >=
                  1200
              ) {
                activeUserPolicyPlacedTransitionRef.current = null;
              }
              if (isSharedInsurerActivity && leadSectionMeta?.policyPlacedField) {
                const leadSectionKey = leadSectionMeta.sectionKey;
                const policyField = leadSectionMeta.policyPlacedField;
                const prevPlaced = String(
                  prevValues?.[leadSectionKey]?.[policyField] ?? ""
                );
                const currPlaced = String(
                  values?.[leadSectionKey]?.[policyField] ?? ""
                );
                const leadInsurerField = leadSectionMeta.leadInsurerField;
                const prevLeadInsurerInSection = leadInsurerField
                  ? prevValues?.[leadSectionKey]?.[leadInsurerField]
                  : undefined;
                const currLeadInsurerInSection = leadInsurerField
                  ? values?.[leadSectionKey]?.[leadInsurerField]
                  : undefined;
                const leadInsurerChangedInWindow =
                  leadInsurerField &&
                  String(prevLeadInsurerInSection ?? "") !==
                    String(currLeadInsurerInSection ?? "");
                if (prevPlaced !== currPlaced && !skipNextOnChange.current) {
                  userChangedPolicyPlacedTypeRef.current = true;
                  userPolicyPlacedChangedAtRef.current = Date.now();
                  activeUserPolicyPlacedTransitionRef.current = {
                    from: prevPlaced,
                    to: currPlaced,
                    startedAt: Date.now(),
                  };
                } else if (
                  !skipNextOnChange.current &&
                  inUserPolicyPlacedToggleWindow &&
                  activeUserPolicyPlacedTransitionRef.current?.to === currPlaced &&
                  prevPlaced === currPlaced &&
                  !leadInsurerChangedInWindow
                ) {
                  latestValuesRef.current = values;
                  if (isPolicyHardCopyMeta) {
                    setIsPolicyHardCopyDisabled(
                      isPolicyHardCopySubmitDisabled(values, dynamicValues)
                    );
                  }
                  syncPolicyHardCopyFlags(values);
                  return;
                }
              }
              const deviationValues = values?.deviationSection ?? {};
              const summaryValues = values?.installmentSummarySection ?? {};
              const summaryHasValues =
                !isUnsetValue(summaryValues?.isPremiumInstallmentBased) ||
                !isUnsetValue(summaryValues?.totalInstallmentAmount);
              const deviationHasValues =
                !isUnsetValue(deviationValues?.isPremiumInstallmentBased) ||
                !isUnsetValue(deviationValues?.totalInstallmentAmount);
              const needsDeviationSync =
                summaryHasValues &&
                (summaryValues?.isPremiumInstallmentBased !==
                  deviationValues?.isPremiumInstallmentBased ||
                  summaryValues?.totalInstallmentAmount !==
                    deviationValues?.totalInstallmentAmount);
              const needsSummarySync = !summaryHasValues && deviationHasValues;

              if (needsDeviationSync || needsSummarySync) {
                const syncUpdates: Record<string, any> = {};
                if (needsDeviationSync) {
                  syncUpdates.deviationSection = {
                    ...deviationValues,
                    ...summaryValues,
                  };
                }
                if (needsSummarySync) {
                  syncUpdates.installmentSummarySection = {
                    ...summaryValues,
                    isPremiumInstallmentBased:
                      deviationValues?.isPremiumInstallmentBased ??
                      summaryValues?.isPremiumInstallmentBased,
                    totalInstallmentAmount:
                      deviationValues?.totalInstallmentAmount ??
                      summaryValues?.totalInstallmentAmount,
                  };
                }

                skipNextOnChange.current = true;
                applyFormUpdatesOnce(values, syncUpdates);
                const mergedValues = { ...values, ...syncUpdates };
                latestValuesRef.current = mergedValues;
                if (isPolicyHardCopyMeta) {
                  setIsPolicyHardCopyDisabled(
                    isPolicyHardCopySubmitDisabled(mergedValues, dynamicValues)
                  );
                }
                syncPolicyHardCopyFlags(mergedValues);
                return;
              }

              //for localisation refactor in the future
              if (grossPremiumAutoPopulateConfigs.length > 0 && values) {
                handleAutoPopulateGrossPremium(values);
              }

              if (
                isSriLankaUser &&
                brokerageAutoPopulateConfigs.length > 0 &&
                values &&
                !inUserPolicyPlacedToggleWindow
              ) {
                handleAutoPopulateBrokerageAmounts(values);
              }

              let shouldResetDeviationSections = false;
              let shouldResetAnyDeviationSections = false;
              let shouldResetRevisedDeviationSections = false;
              let preserveApiInsurerTruth = false;
              let updatedValues = values;

              const updates: Record<string, any> = {};

              const prevInstallmentToggle = String(
                prevValues?.deviationSection?.isPremiumInstallmentBased ??
                  prevValues?.installmentSummarySection
                    ?.isPremiumInstallmentBased ??
                  ""
              );
              const currInstallmentToggle = String(
                values?.deviationSection?.isPremiumInstallmentBased ??
                  values?.installmentSummarySection
                    ?.isPremiumInstallmentBased ??
                  ""
              );
              if (prevInstallmentToggle !== currInstallmentToggle) {
                userChangedPremiumInstallmentToggleRef.current = true;
              }

              const toggleYes = String(dynamicValues?.TOGGLE_YES ?? "");
              const toggleNo = String(dynamicValues?.TOGGLE_NO ?? "");
              const currentInstallmentRows = Array.isArray(
                values?.installmentDetails
              )
                ? values.installmentDetails
                : [];
              const normalizedInstallmentRows = normalizeInstallmentDetails(
                currentInstallmentRows
              );
              const hasServerEmptyInstallmentRows =
                normalizedInstallmentRows.length === 0 &&
                currentInstallmentRows.some(
                  (row: any) =>
                    row &&
                    typeof row === "object" &&
                    row.id !== null &&
                    row.id !== undefined
                );

              if (
                currInstallmentToggle === toggleNo &&
                currentInstallmentRows.length === 0
              ) {
                updates.installmentDetails = [buildEmptyInstallmentRow()];
              }

              if (
                currInstallmentToggle === toggleYes &&
                hasServerEmptyInstallmentRows &&
                !userChangedPremiumInstallmentToggleRef.current
              ) {
                updates.deviationSection = {
                  ...(updates.deviationSection ||
                    values?.deviationSection ||
                    {}),
                  isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
                };
                updates.installmentSummarySection = {
                  ...(updates.installmentSummarySection ||
                    values?.installmentSummarySection ||
                    {}),
                  isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
                };
                updates.installmentDetails = [buildEmptyInstallmentRow()];
              }

              if (
                prevInstallmentToggle === toggleYes &&
                currInstallmentToggle === toggleNo
              ) {
                updates.deviationSection = {
                  ...(updates.deviationSection ||
                    values?.deviationSection ||
                    {}),
                  isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
                };
                updates.installmentSummarySection = {
                  ...(updates.installmentSummarySection ||
                    values?.installmentSummarySection ||
                    {}),
                  isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
                };
                updates.installmentDetails = [buildEmptyInstallmentRow()];
                formRef.current?.clearErrors?.([
                  "installmentDetails",
                  "installmentSummarySection",
                  "deviationSection",
                ]);
              }

              let requiresFormReset = false;

              if (isSharedInsurerActivity) {
                const currentInsurerRowsForTruth = extractInsurerRows(
                  values?.insurerDetails
                );
                const selectedInsurerCountForTruth =
                  currentInsurerRowsForTruth.reduce((count, row) => {
                    const id = Number(row?.insurerId);
                    return Number.isNaN(id) ? count : count + 1;
                  }, 0);
                preserveApiInsurerTruth =
                  hasApiInsurerDetails &&
                  !userChangedPolicyPlacedTypeRef.current &&
                  selectedInsurerCountForTruth > 1;

                const leadSectionKey = leadSectionMeta.sectionKey;
                const leadPolicyField = leadSectionMeta.policyPlacedField;
                const leadInsurerFieldName = leadSectionMeta.leadInsurerField;
                const leadPaysFieldName = leadSectionMeta.leadPaysField;

                const getLeadSectionSnapshot = () =>
                  updates[leadSectionKey] ?? values?.[leadSectionKey] ?? {};
                const applyLeadSectionUpdates = (
                  nextUpdate: Record<string, any>
                ) => {
                  const merged = {
                    ...getLeadSectionSnapshot(),
                    ...nextUpdate,
                  };
                  updates[leadSectionKey] = merged;
                  values = {
                    ...values,
                    [leadSectionKey]: merged,
                  };
                };

                const prevLeadSectionValues =
                  prevValues?.[leadSectionKey] ?? {};
                const prevPlaced = String(
                  prevLeadSectionValues?.[leadPolicyField] ?? ""
                );
                const currPlaced = String(
                  getLeadSectionSnapshot()?.[leadPolicyField] ?? ""
                );

                const insurerRowCountNow = extractInsurerRows(
                  values?.insurerDetails
                ).length;
                const preferredRowCount = resolvePreferredInsurerRows().length;
                const hasMultiInsurersFromServerOrPrefill =
                  insurerRowCountNow > 1 ||
                  preferredRowCount > 1 ||
                  hasApiInsurerDetails;

                if (
                  prevPlaced !== currPlaced &&
                  !skipNextOnChange.current &&
                  leadPolicyField
                ) {
                  // once the user has touched the toggle we should never auto-flip it
                  userChangedPolicyPlacedTypeRef.current = true;
                }

                // 2) auto-correct only the spurious Multiple → Single flip caused
                //    by programmatic updates (prefill / API), NOT by user interaction
                if (
                  currPlaced ===
                    String(dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER) &&
                  !userChangedPolicyPlacedTypeRef.current &&
                  !initialPolicyPlacedFlipSuppressedRef.current &&
                  !skipNextOnChange.current &&
                  hasMultiInsurersFromServerOrPrefill
                ) {
                  initialPolicyPlacedFlipSuppressedRef.current = true;

                  applyLeadSectionUpdates({
                    [leadPolicyField as string]:
                      dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
                  });

                  skipNextOnChange.current = true;
                  latestValuesRef.current = {
                    ...values,
                    [leadSectionKey]: getLeadSectionSnapshot(),
                  };

                  return;
                }

                const isMultiple =
                  currPlaced !==
                  String(dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER);
                const currentInsurerRows = extractInsurerRows(
                  values?.insurerDetails
                );
                const selectedInsurerCount = currentInsurerRows.reduce(
                  (count, row) => {
                    const id = Number(row?.insurerId);
                    return Number.isNaN(id) ? count : count + 1;
                  },
                  0
                );
                const shouldPreserveApiInsurerRows =
                  !userChangedPolicyPlacedTypeRef.current &&
                  (hasApiInsurerDetails || selectedInsurerCount > 1);
                const prevLeadPays = prevLeadSectionValues?.[leadPaysFieldName];
                const currLeadPays =
                  getLeadSectionSnapshot()?.[leadPaysFieldName];
                const leadPaysChanged = prevLeadPays !== currLeadPays;

                const prevLeadInsurerId =
                  prevLeadSectionValues?.[leadInsurerFieldName];
                const currLeadInsurerId =
                  getLeadSectionSnapshot()?.[leadInsurerFieldName];

                if (
                  leadInsurerFieldName &&
                  isUnsetValue(currLeadInsurerId) &&
                  !isUnsetValue(prevLeadInsurerId)
                ) {
                  applyLeadSectionUpdates({
                    [leadInsurerFieldName]: prevLeadInsurerId,
                  });
                }

                const wasLeadInsurerCleared =
                  prevLeadInsurerId != null &&
                  prevLeadInsurerId !== "" &&
                  (currLeadInsurerId === null ||
                    currLeadInsurerId === undefined ||
                    currLeadInsurerId === "");

                const isFinalNegotiation =
                  activity?.activityKey === "final_negotiation_activity" ||
                  activityMetaData?.activityKey ===
                    "final_negotiation_activity";

                if (
                  !isFinalNegotiation &&
                  prevPlaced !== currPlaced &&
                  !shouldPreserveApiInsurerRows
                ) {
                  const currentRows = currentInsurerRows;
                  const hasPreferredInsurerDetails =
                    Array.isArray(
                      preferredInsurersData?.data?.insurerDetails?.data
                    ) &&
                    preferredInsurersData?.data?.insurerDetails?.data.length >
                      0;
                  const hasInsurerAmounts = currentRows.some((row) =>
                    [
                      "sharePercentage",
                      "shareAmount",
                      "brokeragePercentage",
                      "brokerageAmount",
                      "terrorismSharePercentage",
                      "terrorismShareAmount",
                      "terrorismBrokeragePercentage",
                      "terrorismBrokerageAmount",
                      "totalBrokerageAmount",
                    ].some((field) => !isUnsetValue(row?.[field]))
                  );

                  if (
                    !userChangedPolicyPlacedTypeRef.current &&
                    hasPreferredInsurerDetails &&
                    hasInsurerAmounts
                  ) {
                    // Keep API-prefilled amounts; avoid clearing on initial auto flip.
                    return;
                  }

                  const fallbackRow = {
                    ...buildDefaultInsurerRow(values, !isMultiple),
                    insurerId:
                      getLeadSectionSnapshot()?.[leadInsurerFieldName] ?? null,
                  };
                  const baseRows =
                    currentRows.length > 0 ? currentRows : [fallbackRow];
                  const clearedRows = clearInsurerAmountFieldsOnToggle(
                    baseRows,
                    !isMultiple
                  );

                  updates.insurerDetails = !isMultiple
                    ? [clearedRows[0]]
                    : clearedRows;
                  values = {
                    ...values,
                    insurerDetails: updates.insurerDetails,
                  };
                  requiresFormReset = true;
                  skipRecalculateShareRef.current = true;

                  if (!isMultiple) {
                    updateLockFirstInsurer(false);
                    preferredInsurerPrefillApplied.current = false;
                    pendingLeadPrefillRef.current = null;
                    lastLeadInsurerIdRef.current = null;
                    lastMergedLeadInsurerIdRef.current = null;
                    const toggleYesValue = dynamicValues?.TOGGLE_YES;
                    if (
                      toggleYesValue !== undefined &&
                      getLeadSectionSnapshot()?.[leadPaysFieldName] !==
                        toggleYesValue
                    ) {
                      applyLeadSectionUpdates({
                        [leadPaysFieldName]: toggleYesValue,
                      });
                    }
                  }
                }

                const getInsurerDetailsSource = () =>
                  updates.insurerDetails ?? values?.insurerDetails;

                const resolveInsurerDetailsArray = () => {
                  const source = getInsurerDetailsSource();
                  if (Array.isArray(source)) {
                    return source;
                  }
                  if (
                    source &&
                    typeof source === "object" &&
                    Array.isArray((source as any).retArray)
                  ) {
                    return (source as any).retArray;
                  }
                  return [];
                };

                const buildPreferredInsurerMap = () => {
                  const insurerDetailsRows =
                    preferredInsurersData?.data?.insurerDetails?.data ??
                    preferredInsurersData?.insurerDetails?.data;

                  const toNumberOrNull = (value: any) => {
                    if (value === null || value === undefined || value === "") {
                      return null;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? null : parsed;
                  };
                  const normalizeNumber = (value: any) => {
                    if (value === null || value === undefined || value === "") {
                      return null;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? null : parsed;
                  };

                  const apiRows: any[] = [];

                  if (Array.isArray(insurerDetailsRows)) {
                    apiRows.push(...insurerDetailsRows);
                  }

                  if (!Array.isArray(apiRows) || apiRows.length === 0) {
                    return null;
                  }

                  const map = new Map<number, Record<string, any>>();
                  apiRows.forEach((row: Record<string, any>) => {
                    const insurerId =
                      toNumberOrNull(row?.insurerId) ?? toNumberOrNull(row?.id);
                    if (insurerId === null) return;

                    map.set(insurerId, {
                      insurerLocationId: toNumberOrNull(row?.insurerLocationId),
                      insurerBranchId: toNumberOrNull(row?.insurerBranchId),
                      insurerContactId: toNumberOrNull(row?.insurerContactId),
                      sharePercentage: normalizeNumber(row?.sharePercentage),
                      shareAmount: normalizeNumber(row?.shareAmount),
                      brokeragePercentage: normalizeNumber(
                        row?.brokeragePercentage
                      ),
                      brokerageAmount: normalizeNumber(row?.brokerageAmount),
                      terrorismBrokeragePercentage: normalizeNumber(
                        row?.terrorismBrokeragePercentage
                      ),
                      terrorismBrokerageAmount: normalizeNumber(
                        row?.terrorismBrokerageAmount
                      ),
                      totalBrokerageAmount: normalizeNumber(
                        row?.totalBrokerageAmount
                      ),
                    });
                  });
                  return map;
                };

                const prefillNonLeadRows = () => {
                  const map = buildPreferredInsurerMap();
                  if (!map) {
                    return;
                  }
                  const currentRows = resolveInsurerDetailsArray();
                  if (!Array.isArray(currentRows) || currentRows.length === 0) {
                    return;
                  }
                  const hasInsurer = currentRows.some((row) => row?.insurerId);
                  if (!hasInsurer) {
                    return;
                  }
                  let mutated = false;
                  const alwaysPopulateFields = new Set([
                    "insurerLocationId",
                    "insurerBranchId",
                    "insurerContactId",
                  ]);
                  const fieldsToPopulate = Array.from(alwaysPopulateFields);

                  const updatedRows = currentRows.map((row) => {
                    if (!row?.insurerId) {
                      return row;
                    }
                    const matcher = map.get(Number(row.insurerId));
                    if (!matcher) {
                      return row;
                    }
                    const nextRow = { ...row };
                    fieldsToPopulate.forEach((field) => {
                      const currentValue = nextRow[field];
                      const shouldAlwaysPopulate =
                        alwaysPopulateFields.has(field);
                      if (
                        (shouldAlwaysPopulate ||
                          currentValue === null ||
                          currentValue === undefined ||
                          currentValue === "") &&
                        matcher[field] !== null &&
                        matcher[field] !== undefined &&
                        matcher[field] !== ""
                      ) {
                        if (nextRow[field] !== matcher[field]) {
                          nextRow[field] = matcher[field];
                          mutated = true;
                        }
                      }
                    });
                    return nextRow;
                  });

                  if (mutated) {
                    updates.insurerDetails = updatedRows;
                    values = {
                      ...values,
                      insurerDetails: updatedRows,
                    };
                  }
                };

                const applyLeadInsurerSync = (shouldLockRow: boolean) => {
                  const leadInsurerId =
                    getLeadSectionSnapshot()?.[leadInsurerFieldName];
                  if (leadInsurerId !== lastLeadInsurerIdRef.current) {
                    lastLeadInsurerIdRef.current = leadInsurerId ?? null;
                    setLeadInsurerSelectionVersion((prev) => prev + 1);
                  }

                  const resolvedLeadInsurerId =
                    leadInsurerId === null || leadInsurerId === undefined
                      ? null
                      : Number(leadInsurerId);

                  const preferredRows = resolvePreferredInsurerRows();
                  const shouldApplyMultiplePrefill = preferredRows.length > 1;
                  const needsPlacementPrefill =
                    shouldApplyMultiplePrefill &&
                    shouldForcePreferredInsurerPrefill(values);

                  const shouldAttemptPrefill =
                    resolvedLeadInsurerId !== null &&
                    !userChangedPolicyPlacedTypeRef.current &&
                    (lastMergedLeadInsurerIdRef.current !==
                      resolvedLeadInsurerId ||
                      !preferredInsurerPrefillApplied.current ||
                      needsPlacementPrefill);

                  if (shouldAttemptPrefill && leadInsurerId) {
                    const targetWrapper: Record<string, any> = {
                      insurerDetails: getInsurerDetailsSource(),
                      [leadSectionMeta.sectionKey]: getLeadSectionSnapshot(),
                    };

                    const mergedFromPreferred = mergePreferredInsurersIntoData(
                      targetWrapper,
                      Number(leadInsurerId),
                      {
                        force: true,
                        onlyLeadRow: !isMultiple,
                      }
                    );

                    if (mergedFromPreferred) {
                      lastMergedLeadInsurerIdRef.current =
                        resolvedLeadInsurerId;
                      updates.insurerDetails = targetWrapper.insurerDetails;

                      const leadSectionKey = leadSectionMeta.sectionKey;
                      const policyField = leadSectionMeta.policyPlacedField; // "policyPlacedTypeLid"
                      const mergedLeadSection =
                        (targetWrapper[leadSectionKey] as Record<
                          string,
                          any
                        >) || {};

                      if (policyField) {
                        const existingLeadSection = (values?.[leadSectionKey] ??
                          {}) as Record<string, any>;
                        const existingPolicyPlaced =
                          existingLeadSection[policyField];
                        const mergedPolicyPlaced =
                          mergedLeadSection[policyField];
                        const isExistingSingle =
                          String(existingPolicyPlaced) ===
                          String(
                            dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER
                          );
                        const isMergedMultiple =
                          String(mergedPolicyPlaced) ===
                          String(
                            dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
                          );

                        if (
                          existingPolicyPlaced !== undefined &&
                          existingPolicyPlaced !== null &&
                          existingPolicyPlaced !== "" &&
                          !(
                            !userChangedPolicyPlacedTypeRef.current &&
                            isExistingSingle &&
                            isMergedMultiple
                          )
                        ) {
                          mergedLeadSection[policyField] = existingPolicyPlaced;
                        }
                        if (
                          shouldApplyMultiplePrefill &&
                          !userChangedPolicyPlacedTypeRef.current
                        ) {
                          mergedLeadSection[policyField] =
                            dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER;
                        }
                      }

                      updates[leadSectionKey] = mergedLeadSection;

                      values = {
                        ...values,
                        insurerDetails: updates.insurerDetails,
                        [leadSectionKey]: mergedLeadSection,
                      };
                      preferredInsurerPrefillApplied.current = true;
                      updateLockFirstInsurer(shouldLockRow);
                      return;
                    }
                    lastMergedLeadInsurerIdRef.current = null;
                  }

                  if (leadInsurerId) {
                    const currentInsurerDetailsArray =
                      resolveInsurerDetailsArray();
                    if (currentInsurerDetailsArray.length > 0) {
                      const firstRowInsurerId =
                        currentInsurerDetailsArray[0]?.insurerId ?? null;
                      const needsPopulation =
                        firstRowInsurerId === null ||
                        firstRowInsurerId !== leadInsurerId;

                      if (needsPopulation) {
                        updates.insurerDetails = [
                          ...currentInsurerDetailsArray,
                        ];
                        updates.insurerDetails[0] = {
                          ...updates.insurerDetails[0],
                          insurerId: leadInsurerId,
                          insurerLocationId: null,
                          insurerBranchId: null,
                          insurerContactId: null,
                          isLeadInsurer:
                            dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
                        };

                        updates.insurerDetails = enforceLeadInsurerFlags(
                          updates.insurerDetails,
                          dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
                          dynamicValues?.INSURER_PARTICIPATION_TYPE_CO
                        );
                      }

                      updateLockFirstInsurer(shouldLockRow);
                    }
                    return;
                  }

                  if (lockFirstInsurer) {
                    updateLockFirstInsurer(false);
                  }
                  if (lastLeadInsurerIdRef.current !== null) {
                    lastLeadInsurerIdRef.current = null;
                    setLeadInsurerSelectionVersion((prev) => prev + 1);
                  }
                  preferredInsurerPrefillApplied.current = false;
                  pendingLeadPrefillRef.current = null;
                  lastMergedLeadInsurerIdRef.current = null;

                  if (!isFinalNegotiation) {
                    updates.insurerDetails = [
                      buildDefaultInsurerRow(values, !isMultiple),
                    ];
                    values = {
                      ...values,
                      insurerDetails: updates.insurerDetails,
                    };
                  }
                };

                if (!isFinalNegotiation && wasLeadInsurerCleared) {
                  const defaultRow = buildDefaultInsurerRow(
                    values,
                    !isMultiple
                  );

                  updates.insurerDetails = [defaultRow];
                  values = {
                    ...values,
                    insurerDetails: updates.insurerDetails,
                  };

                  requiresFormReset = true;
                  updateLockFirstInsurer(false);
                  preferredInsurerPrefillApplied.current = false;
                  pendingLeadPrefillRef.current = null;
                  lastLeadInsurerIdRef.current = null;
                  lastMergedLeadInsurerIdRef.current = null;
                }

                if (!isMultiple) {
                  // Only collapse to single AFTER user explicitly selects Single
                  if (userChangedPolicyPlacedTypeRef.current) {
                    updateLockFirstInsurer(false);
                    applyLeadInsurerSync(false); // collapse rows, enforce single behavior
                  }

                  const currentList = (updates.insurerDetails ??
                    values?.insurerDetails) as any[];

                  if (Array.isArray(currentList) && currentList.length > 0) {
                    const currentShare =
                      parseNumericInput(currentList[0]?.sharePercentage) ?? 0;

                    if (currentShare !== 100) {
                      const updated = [...currentList];
                      updated[0] = {
                        ...updated[0],
                        sharePercentage: 100,
                      };

                      updates.insurerDetails = updated;
                      values = {
                        ...values,
                        insurerDetails: updated,
                      };
                    }
                  }
                }
                // else: DO NOT run applyLeadInsurerSync(false) for prefills or API data
                else if (!leadPaysChanged) {
                  if (!shouldPreserveApiInsurerRows) {
                    applyLeadInsurerSync(true);
                  }

                  const currentList = (updates.insurerDetails ??
                    values?.insurerDetails) as any[];

                  if (Array.isArray(currentList) && currentList.length > 0) {
                    const normalized = enforceLeadInsurerFlags(
                      currentList,
                      dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
                      dynamicValues?.INSURER_PARTICIPATION_TYPE_CO
                    );
                    if (
                      JSON.stringify(normalized) !== JSON.stringify(currentList)
                    ) {
                      updates.insurerDetails = normalized;
                    }

                    let latestInsurerDetails =
                      updates.insurerDetails ?? currentList;

                    if (!isMultiple) {
                      if (
                        Array.isArray(latestInsurerDetails) &&
                        latestInsurerDetails.length > 0
                      ) {
                        const currentShare =
                          parseNumericInput(
                            latestInsurerDetails[0]?.sharePercentage
                          ) ?? 0;
                        if (currentShare !== 100) {
                          updates.insurerDetails = [...latestInsurerDetails];
                          updates.insurerDetails[0] = {
                            ...updates.insurerDetails[0],
                            sharePercentage: 100,
                          };
                          latestInsurerDetails = updates.insurerDetails;
                        }
                      }
                    }

                    const baseBasicPremium =
                      parseNumericInput(
                        getLatestPolicyFieldValue(
                          updates,
                          values,
                          "basicPremium"
                        )
                      ) ??
                      parseNumericInput(
                        getLatestSelectFinalisedQuoteFieldValue(
                          updates,
                          values,
                          "basicPremium"
                        )
                      );
                    const prevBasicPremium =
                      parseNumericInput(
                        prevValues?.policyDetails?.basicPremium
                      ) ??
                      parseNumericInput(
                        prevValues?.selectFinalisedQuote?.basicPremium
                      );

                    const { updatedRows, hasChanges } = recalculateShareAmounts(
                      latestInsurerDetails,
                      baseBasicPremium,
                      prevValues?.insurerDetails,
                      prevBasicPremium
                    );

                    if (skipRecalculateShareRef.current) {
                      skipRecalculateShareRef.current = false;
                    } else if (hasChanges) {
                      updates.insurerDetails = updatedRows;
                      values = {
                        ...values,
                        insurerDetails: updatedRows,
                      };
                    }
                  }
                }

                if (
                  leadSectionMeta.leadInsurerField &&
                  !shouldPreserveApiInsurerRows
                ) {
                  const leadInsurerId =
                    getLeadSectionSnapshot()?.[leadInsurerFieldName] ?? null;

                  const currentList = (updates.insurerDetails ??
                    values?.insurerDetails) as any[];

                  if (
                    leadInsurerId &&
                    Array.isArray(currentList) &&
                    currentList.length > 0
                  ) {
                    const firstRow = currentList[0] || {};
                    const firstId = firstRow?.insurerId ?? null;

                    // If row-1 doesn’t match the lead insurer, fix it.
                    if (
                      firstId == null ||
                      Number(firstId) !== Number(leadInsurerId)
                    ) {
                      const fixed = [...currentList];
                      fixed[0] = {
                        ...fixed[0],
                        insurerId: leadInsurerId,
                        insurerLocationId: null,
                        insurerBranchId: null,
                        insurerContactId: null,
                        isLeadInsurer:
                          dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
                      };

                      updates.insurerDetails = fixed;
                      values = {
                        ...values,
                        insurerDetails: fixed,
                      };
                    }
                  }
                }

                if (!shouldPreserveApiInsurerRows) {
                  prefillNonLeadRows();
                }
              }

              if (preserveApiInsurerTruth && updates.insurerDetails) {
                delete updates.insurerDetails;
                requiresFormReset = false;
              }

              const totalPremium =
                Number(
                  activityMetaData?.activityKey ===
                    "placement_slip_generation_activity"
                    ? values?.policyDetails?.totalPremium ??
                        values?.policyDetails?.basicPremium
                    : values?.policyDetails?.totalPremium
                ) || 0;
              const brokeragePercentageRaw =
                values?.policyDetails?.brokeragePercentage;
              const brokerageAmountRaw = values?.policyDetails?.brokerageAmount;
              const brokeragePercentage =
                parseNumericInput(brokeragePercentageRaw) ?? 0;
              const brokerageAmount =
                parseNumericInput(brokerageAmountRaw) ?? 0;

              const prevTotalPremium =
                Number(
                  activityMetaData?.activityKey ===
                    "placement_slip_generation_activity"
                    ? prevValues?.policyDetails?.totalPremium ??
                        prevValues?.policyDetails?.basicPremium
                    : prevValues?.policyDetails?.totalPremium
                ) || 0;
              const prevPercentageRaw =
                prevValues?.policyDetails?.brokeragePercentage;
              const prevAmountRaw = prevValues?.policyDetails?.brokerageAmount;
              const prevPercentage = parseNumericInput(prevPercentageRaw) ?? 0;
              const prevAmount = parseNumericInput(prevAmountRaw) ?? 0;
              const brokerageChangedField = resolveChangedField(
                brokeragePercentage,
                brokerageAmount,
                prevPercentage,
                prevAmount
              );

              const isPlacementSlip =
                currentActivityKey === "placement_slip_generation_activity";
              const placementNetPremium = isPlacementSlip
                ? (Number(values?.policyDetails?.basicPremium) || 0) +
                  (Number(values?.policyDetails?.srccAmount) || 0) +
                  (Number(
                    values?.policyDetails?.terrorism ??
                      values?.policyDetails?.terrorismAmount
                  ) || 0)
                : 0;
              const prevPlacementNetPremium = isPlacementSlip
                ? (Number(prevValues?.policyDetails?.basicPremium) || 0) +
                  (Number(prevValues?.policyDetails?.srccAmount) || 0) +
                  (Number(
                    prevValues?.policyDetails?.terrorism ??
                      prevValues?.policyDetails?.terrorismAmount
                  ) || 0)
                : 0;

              const shouldUseBasicPremiumForBrokerage =
                isPlacementSlip && !isSriLankaUser;

              const currentPlacementTotalPremium = isPlacementSlip
                ? Number(values?.policyDetails?.totalPremium) || 0
                : 0;

              const brokerageBase = shouldUseBasicPremiumForBrokerage
                ? Number(values?.policyDetails?.basicPremium) || 0
                : isPlacementSlip
                ? currentPlacementTotalPremium > 0
                  ? currentPlacementTotalPremium
                  : isSriLankaUser && placementNetPremium > 0
                  ? placementNetPremium
                  : totalPremium
                : totalPremium;

              const prevPlacementTotalPremium = isPlacementSlip
                ? Number(prevValues?.policyDetails?.totalPremium) || 0
                : 0;

              const prevBrokerageBase = shouldUseBasicPremiumForBrokerage
                ? Number(prevValues?.policyDetails?.basicPremium) || 0
                : isPlacementSlip
                ? prevPlacementTotalPremium > 0
                  ? prevPlacementTotalPremium
                  : isSriLankaUser && prevPlacementNetPremium > 0
                  ? prevPlacementNetPremium
                  : prevTotalPremium
                : prevTotalPremium;

              const brokerageUpdate = calculatePercentageAmountUpdate(
                brokerageBase,
                brokeragePercentage,
                brokerageAmount,
                prevBrokerageBase,
                prevPercentage,
                prevAmount,
                "basicBrokeragePercentage",
                "basicBrokerageAmount",
                isSriLankaUser
                  ? {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: brokerageChangedField,
                    }
                  : {
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: brokerageChangedField,
                    }
              );
              if (brokerageUpdate) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  ...brokerageUpdate,
                };
              }

              if (!isSriLankaUser && !disableServiceTaxAutoCalculation) {
                const sectionKey = "deviationSection";
                // Include updates already staged in this pass (netPremium etc.)
                // so the tax base is not one keystroke stale.
                const sectionValues = {
                  ...(values?.[sectionKey] || {}),
                  ...(updates[sectionKey] || {}),
                };
                const prevSectionValues = prevValues?.[sectionKey] || {};

                const serviceTaxPercentage =
                  Number(sectionValues?.gstPercentage) || 0;
                const serviceTaxAmount = Number(sectionValues?.gstAmount) || 0;
                const prevServiceTaxPercentage =
                  Number(prevSectionValues?.gstPercentage) || 0;
                const prevServiceTaxAmount =
                  Number(prevSectionValues?.gstAmount) || 0;

                const resolveIndianNetPremium = (source: any) => {
                  const basicPremium = parseNumericInput(source?.basicPremium);
                  const terrorism = parseNumericInput(
                    source?.terrorism ??
                      source?.terrorismAmount ??
                      source?.terrorismCommission
                  );
                  if (basicPremium === null && terrorism === null) {
                    return null;
                  }
                  return Number(
                    ((basicPremium ?? 0) + (terrorism ?? 0)).toFixed(4)
                  );
                };

                const pickTaxBase = (source: any) => {
                  const netPremiumCandidate =
                    parseNumericInput(source?.netPremium) ??
                    parseNumericInput(source?.totalNetPremium) ??
                    parseNumericInput(source?.totalPremium);
                  const derivedNetPremium = resolveIndianNetPremium(source);
                  if (derivedNetPremium === null) {
                    return (
                      netPremiumCandidate ??
                      parseNumericInput(source?.grossPremium) ??
                      parseNumericInput(source?.basicPremium) ??
                      0
                    );
                  }
                  if (netPremiumCandidate === null) {
                    return derivedNetPremium;
                  }
                  return Math.abs(netPremiumCandidate - derivedNetPremium) >
                    0.01
                    ? derivedNetPremium
                    : netPremiumCandidate;
                };

                // Same base the netPremium config produces (it includes
                // srccAmount, pickTaxBase's derived value does not) so the two
                // cannot overwrite each other in a loop.
                const serviceTaxBase =
                  parseNumericInput(sectionValues?.netPremium) ??
                  pickTaxBase(sectionValues);
                const prevServiceTaxBase =
                  parseNumericInput(prevSectionValues?.netPremium) ??
                  pickTaxBase(prevSectionValues);

                const serviceTaxChangedField = resolveChangedField(
                  serviceTaxPercentage,
                  serviceTaxAmount,
                  prevServiceTaxPercentage,
                  prevServiceTaxAmount
                );

                const serviceTaxUpdate = calculatePercentageAmountUpdate(
                  serviceTaxBase,
                  serviceTaxPercentage,
                  serviceTaxAmount,
                  prevServiceTaxBase,
                  prevServiceTaxPercentage,
                  prevServiceTaxAmount,
                  "gstPercentage",
                  "gstAmount",
                  {
                    skipCountryCheck: false,
                    preferPercentageInput: true,
                    allowReverseWhenAmountChanged: true,
                    changedField: serviceTaxChangedField,
                  } // same as before for non-SL
                );

                if (serviceTaxUpdate) {
                  // Whole section (later steps and setValues treat a section
                  // update as complete) and already merged with this pass's
                  // staged updates, so nothing is written back stale.
                  updates[sectionKey] = {
                    ...sectionValues,
                    ...serviceTaxUpdate,
                  };
                }
              }

              const areNumbersClose = (a: number, b: number, epsilon = 0.01) =>
                Math.abs(a - b) < epsilon;

              const toNumericValue = (value: unknown) =>
                parseNumericInput(value) ?? 0;

              const ensureSectionTotalPremium = (
                sectionKey: string,
                premiumField: string,
                options?: {
                  srccField?: string;
                  terrorismField?: string;
                  serviceTaxField?: string;
                  totalField?: string;
                }
              ) => {
                if (isSriLankaUser) {
                  return;
                }

                const {
                  srccField = "srccAmount",
                  terrorismField = "terrorism",
                  serviceTaxField = "gstAmount",
                  totalField = "grossPremium",
                } = options || {};

                const currentSectionValues = values?.[sectionKey];
                const pendingSectionUpdates = updates[sectionKey];
                const previousSectionValues = prevValues?.[sectionKey];

                if (
                  !currentSectionValues &&
                  !pendingSectionUpdates &&
                  !previousSectionValues
                ) {
                  return;
                }

                const mergedSectionValues = {
                  ...(currentSectionValues || {}),
                  ...(pendingSectionUpdates || {}),
                };

                const premiumValue = toNumericValue(
                  mergedSectionValues?.[premiumField]
                );
                const srccValue = toNumericValue(
                  mergedSectionValues?.[srccField]
                );
                const terrorismValue =
                  parseNumericInput(mergedSectionValues?.[terrorismField]) ??
                  parseNumericInput(mergedSectionValues?.terrorismAmount) ??
                  0;
                const serviceTaxValue = toNumericValue(
                  mergedSectionValues?.[serviceTaxField]
                );

                const netPremium = premiumValue + srccValue + terrorismValue;
                const computedTotal = netPremium + serviceTaxValue;

                const previousTotal =
                  parseNumericInput(previousSectionValues?.[totalField]) ?? 0;
                const currentTotal =
                  parseNumericInput(mergedSectionValues?.[totalField]) ?? 0;

                if (
                  !areNumbersClose(computedTotal, previousTotal) ||
                  !areNumbersClose(computedTotal, currentTotal)
                ) {
                  updates[sectionKey] = {
                    ...(updates[sectionKey] || currentSectionValues || {}),
                    [totalField]: computedTotal,
                  };
                }
              };

              const ensureSectionServiceTax = (
                sectionKey: string,
                baseField: string
              ) => {
                if (disableServiceTaxAutoCalculation) {
                  return;
                }

                const currentSectionValues = values?.[sectionKey];
                const pendingSectionUpdates = updates[sectionKey];
                const previousSectionValues = prevValues?.[sectionKey];

                if (
                  !currentSectionValues &&
                  !pendingSectionUpdates &&
                  !previousSectionValues
                ) {
                  return;
                }

                const mergedSectionValues = {
                  ...(currentSectionValues || {}),
                  ...(pendingSectionUpdates || {}),
                };

                const serviceTaxChangedField = resolveChangedField(
                  toNumericValue(mergedSectionValues?.gstPercentage),
                  toNumericValue(mergedSectionValues?.gstAmount),
                  toNumericValue(previousSectionValues?.gstPercentage),
                  toNumericValue(previousSectionValues?.gstAmount)
                );

                const serviceTaxUpdate = calculatePercentageAmountUpdate(
                  toNumericValue(mergedSectionValues?.[baseField]),
                  toNumericValue(mergedSectionValues?.gstPercentage),
                  toNumericValue(mergedSectionValues?.gstAmount),
                  toNumericValue(previousSectionValues?.[baseField]),
                  toNumericValue(previousSectionValues?.gstPercentage),
                  toNumericValue(previousSectionValues?.gstAmount),
                  "gstPercentage",
                  "gstAmount",
                  {
                    preferPercentageInput: true,
                    allowReverseWhenAmountChanged: true,
                    changedField: serviceTaxChangedField,
                  }
                );

                if (serviceTaxUpdate) {
                  updates[sectionKey] = {
                    ...(updates[sectionKey] || currentSectionValues || {}),
                    ...serviceTaxUpdate,
                  };
                }
              };

              if (isPolicyHardCopyMeta) {
                const deviationSectionKey = "deviationSection";
                const getDeviationSnapshot = () => ({
                  ...(values?.[deviationSectionKey] || {}),
                  ...(updates[deviationSectionKey] || {}),
                });
                const prevDeviationValues =
                  prevValues?.[deviationSectionKey] || {};

                const applyDeviationUpdates = (
                  nextUpdate: Record<string, any>
                ) => {
                  updates[deviationSectionKey] = {
                    ...(updates[deviationSectionKey] || getDeviationSnapshot()),
                    ...nextUpdate,
                  };
                };

                {
                  const snapshot = getDeviationSnapshot();
                  const basicPremium =
                    parseNumericInput(snapshot.basicPremium) ?? 0;
                  const prevBasicPremium =
                    parseNumericInput(prevDeviationValues.basicPremium) ?? 0;
                  const basicPct =
                    parseNumericInput(snapshot.basicBrokeragePercentage) ?? 0;
                  const basicAmt =
                    parseNumericInput(snapshot.basicBrokerageAmount) ?? 0;
                  const prevBasicPct =
                    parseNumericInput(
                      prevDeviationValues.basicBrokeragePercentage
                    ) ?? 0;
                  const prevBasicAmt =
                    parseNumericInput(
                      prevDeviationValues.basicBrokerageAmount
                    ) ?? 0;
                  const basicChangedField = resolveChangedField(
                    basicPct,
                    basicAmt,
                    prevBasicPct,
                    prevBasicAmt
                  );

                  const basicUpdate = calculatePercentageAmountUpdate(
                    basicPremium,
                    basicPct,
                    basicAmt,
                    prevBasicPremium,
                    prevBasicPct,
                    prevBasicAmt,
                    "basicBrokeragePercentage",
                    "basicBrokerageAmount",
                    {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: basicChangedField,
                    }
                  );

                  if (basicUpdate) {
                    applyDeviationUpdates(basicUpdate);
                  }
                }

                {
                  const snapshot = getDeviationSnapshot();
                  const terrorismBase =
                    parseNumericInput(snapshot.terrorism) ??
                    parseNumericInput(snapshot.terrorismAmount) ??
                    0;
                  const prevTerrorismBase =
                    parseNumericInput(prevDeviationValues.terrorism) ??
                    parseNumericInput(prevDeviationValues.terrorismAmount) ??
                    0;
                  const terrorismPct =
                    parseNumericInput(snapshot.terrorismBrokeragePercentage) ??
                    0;
                  const terrorismAmt =
                    parseNumericInput(snapshot.tcBrokerageAmount) ?? 0;
                  const prevTerrorismPct =
                    parseNumericInput(
                      prevDeviationValues.terrorismBrokeragePercentage
                    ) ?? 0;
                  const prevTerrorismAmt =
                    parseNumericInput(prevDeviationValues.tcBrokerageAmount) ??
                    0;
                  const terrorismChangedField = resolveChangedField(
                    terrorismPct,
                    terrorismAmt,
                    prevTerrorismPct,
                    prevTerrorismAmt
                  );

                  const terrorismUpdate = calculatePercentageAmountUpdate(
                    terrorismBase,
                    terrorismPct,
                    terrorismAmt,
                    prevTerrorismBase,
                    prevTerrorismPct,
                    prevTerrorismAmt,
                    "terrorismBrokeragePercentage",
                    "tcBrokerageAmount",
                    {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: terrorismChangedField,
                    }
                  );

                  if (terrorismUpdate) {
                    applyDeviationUpdates(terrorismUpdate);
                  }
                }

                {
                  const snapshot = getDeviationSnapshot();
                  const srccBase = parseNumericInput(snapshot.srccAmount) ?? 0;
                  const prevSrccBase =
                    parseNumericInput(prevDeviationValues.srccAmount) ?? 0;
                  const srccPct =
                    parseNumericInput(snapshot.srccPercentage) ?? 0;
                  const srccAmt =
                    parseNumericInput(snapshot.srccBrokerageAmount) ?? 0;
                  const prevSrccPct =
                    parseNumericInput(prevDeviationValues.srccPercentage) ?? 0;
                  const prevSrccAmt =
                    parseNumericInput(
                      prevDeviationValues.srccBrokerageAmount
                    ) ?? 0;
                  const srccChangedField = resolveChangedField(
                    srccPct,
                    srccAmt,
                    prevSrccPct,
                    prevSrccAmt
                  );

                  const srccUpdate = calculatePercentageAmountUpdate(
                    srccBase,
                    srccPct,
                    srccAmt,
                    prevSrccBase,
                    prevSrccPct,
                    prevSrccAmt,
                    "srccPercentage",
                    "srccBrokerageAmount",
                    {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: srccChangedField,
                    }
                  );

                  if (srccUpdate) {
                    applyDeviationUpdates(srccUpdate);
                  }
                }

                if (isSriLankaUser) {
                  const snapshot = getDeviationSnapshot();
                  const parseOrZero = (input: any) =>
                    parseNumericInput(input) ?? 0;
                  const computeNetPremium = (src: any) => {
                    const basic = parseOrZero(src.basicPremium);
                    const srcc = parseOrZero(src.srccAmount);
                    const terrorism = parseOrZero(
                      src.terrorism ?? src.terrorismAmount
                    );

                    const calculated = basic + srcc + terrorism;
                    if (calculated > 0) {
                      return calculated;
                    }
                    return (
                      parseOrZero(src.netPremium) ||
                      parseOrZero(src.totalNetPremium) ||
                      parseOrZero(src.totalPremium) ||
                      basic
                    );
                  };

                  const vatBase =
                    computeNetPremium(snapshot) +
                    parseOrZero(snapshot.adminCharges) +
                    parseOrZero(snapshot.other) +
                    parseOrZero(snapshot.cessAmount) +
                    parseOrZero(snapshot.fee);

                  const prevVatBase =
                    computeNetPremium(prevDeviationValues) +
                    parseOrZero(prevDeviationValues.adminCharges) +
                    parseOrZero(prevDeviationValues.other) +
                    parseOrZero(prevDeviationValues.cessAmount) +
                    parseOrZero(prevDeviationValues.fee);

                  const vatPct = parseNumericInput(snapshot.gstPercentage);
                  const vatAmt = parseNumericInput(snapshot.gstAmount);
                  const prevVatPct = parseNumericInput(
                    prevDeviationValues.gstPercentage
                  );
                  const prevVatAmt = parseNumericInput(
                    prevDeviationValues.gstAmount
                  );
                  const prevHasVatValues =
                    prevVatPct !== null || prevVatAmt !== null;
                  const prevHasVatBoth =
                    prevVatPct !== null && prevVatAmt !== null;
                  const currentHasVatValues =
                    vatPct !== null && vatAmt !== null;

                  if (!(!prevHasVatValues && currentHasVatValues)) {
                    const vatChangedField = resolveChangedField(
                      parseOrZero(vatPct),
                      parseOrZero(vatAmt),
                      parseOrZero(prevVatPct),
                      parseOrZero(prevVatAmt)
                    );

                    if (vatChangedField) {
                      const vatUpdate = calculatePercentageAmountUpdate(
                        vatBase,
                        parseOrZero(vatPct),
                        parseOrZero(vatAmt),
                        prevVatBase,
                        parseOrZero(prevVatPct),
                        parseOrZero(prevVatAmt),
                        "gstPercentage",
                        "gstAmount",
                        {
                          skipCountryCheck: true,
                          preferPercentageInput: true,
                          allowReverseWhenAmountChanged:
                            vatChangedField === "amount" && prevHasVatBoth,
                          changedField: vatChangedField,
                        }
                      );

                      if (vatUpdate) {
                        applyDeviationUpdates(vatUpdate);
                      }
                    }
                  }
                }

                ensureSectionTotalPremium("deviationSection", "basicPremium");
                ensureSectionServiceTax("deviationSection", "netPremium");

                const YES = dynamicValues?.TOGGLE_YES;

                if (
                  prevValues?.deviationsAddressedSection
                    ?.deviationCoveragesLid === YES &&
                  values?.deviationsAddressedSection?.deviationCoveragesLid !==
                    YES
                ) {
                  updates.deviationsAddressedSection = {
                    deviationCoveragesLid: null,
                    deviationsAddressedLid: null,
                    resolutionLid: null,
                    policyHardCopyReceivedLid: null,
                  };

                  const mergedDeviation: any = fillDeviationBrokerageDefaults({
                    ...(values.deviationSection || {}),
                    ...updates.deviationSection,
                    deviationsLid: null,
                    // commneting after few changes from karan
                    // basicPremium:
                    //   Number(premiumResponseData?.basicPremium) ?? null,
                    // brokeragePercentage:
                    //   Number(premiumResponseData?.brokeragePercentage) ?? null,
                    // brokerageAmount:
                    //   Number(premiumResponseData?.brokerageAmount) ?? null,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  });

                  // commented as it is repetative and not needed
                  // if (!getActivityData?.data?.dataActivity) {
                  //   mergedDeviation.basicPremium =
                  //     premiumDefaults?.basicPremium != null
                  //       ? Number(premiumDefaults.basicPremium)
                  //       : null;
                  //   mergedDeviation.basicBrokeragePercentage =
                  //     premiumDefaults?.basicBrokeragePercentage != null
                  //       ? Number(premiumDefaults.basicBrokeragePercentage)
                  //       : null;
                  //   mergedDeviation.basicBrokerageAmount =
                  //     premiumDefaults?.basicBrokerageAmount != null
                  //       ? Number(premiumDefaults.basicBrokerageAmount)
                  //       : null;
                  // }

                  updates.deviationSection = mergedDeviation;

                  updates.policyHardCopyCoversConfig = {
                    ...(activityMetaData?.coversPrefillData || {}),
                  };
                }

                // Clear fields when deviation addressed toggle changes
                if (
                  prevValues?.deviationsAddressedSection
                    ?.deviationsAddressedLid !==
                  values?.deviationsAddressedSection?.deviationsAddressedLid
                ) {
                  const clearedDeviationAddressedSection = {
                    ...(values.deviationsAddressedSection || {}),
                    ...updates.deviationsAddressedSection,
                    resolutionLid: null,
                    policyHardCopyReceivedLid: null,
                  };
                  delete clearedDeviationAddressedSection.deviationSection;
                  updates.deviationsAddressedSection =
                    clearedDeviationAddressedSection;

                  const baseDeviation = values.deviationSection || {};
                  const mergedDeviation = fillDeviationBrokerageDefaults({
                    ...baseDeviation,
                    ...updates.deviationSection,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  });

                  // commented as it is repetative and not needed
                  // if (!getActivityData?.data?.dataActivity) {
                  //   mergedDeviation.basicPremium =
                  //     premiumDefaults?.basicPremium != null
                  //       ? Number(premiumDefaults.basicPremium)
                  //       : null;
                  //   mergedDeviation.basicBrokeragePercentage =
                  //     premiumDefaults?.basicBrokeragePercentage != null
                  //       ? Number(premiumDefaults.basicBrokeragePercentage)
                  //       : null;
                  //   mergedDeviation.basicBrokerageAmount =
                  //     premiumDefaults?.basicBrokerageAmount != null
                  //       ? Number(premiumDefaults.basicBrokerageAmount)
                  //       : null;
                  // }

                  updates.deviationSection = mergedDeviation;

                  updates.policyHardCopyCoversConfig = {
                    ...(activityMetaData?.coversPrefillData || {}),
                  };
                }

                // Clear deviation-related fields when toggles change
                if (
                  prevValues?.deviationSection?.deviationsLid !==
                  values?.deviationSection?.deviationsLid
                ) {
                  const baseDeviation = values.deviationSection || {};
                  const mergedDeviation = fillDeviationBrokerageDefaults({
                    ...baseDeviation,
                    ...updates.deviationSection,
                    // commneting after few changes from karan
                    // basicPremium:
                    //   Number(premiumResponseData?.basicPremium) ?? null,
                    // brokeragePercentage:
                    //   Number(premiumResponseData?.brokeragePercentage) ?? null,
                    // brokerageAmount:
                    //   Number(premiumResponseData?.brokerageAmount) ?? null,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  });

                  // ❗Only use brokerage defaults when activity-data is not available
                  // if (!getActivityData?.data?.dataActivity) {
                  //   mergedDeviation.basicPremium =
                  //     premiumDefaults?.basicPremium != null
                  //       ? Number(premiumDefaults.basicPremium)
                  //       : null;
                  //   mergedDeviation.basicBrokeragePercentage =
                  //     premiumDefaults?.basicBrokeragePercentage != null
                  //       ? Number(premiumDefaults.basicBrokeragePercentage)
                  //       : null;
                  //   mergedDeviation.basicBrokerageAmount =
                  //     premiumDefaults?.basicBrokerageAmount != null
                  //       ? Number(premiumDefaults.brokerageAmount)
                  //       : null;
                  // }

                  updates.deviationSection = mergedDeviation;
                }
              }

              if (Object.keys(updates).length > 0) {
                skipNextOnChange.current = true;
                let resetData: any = [];
                if (
                  shouldResetDeviationSections ||
                  shouldResetAnyDeviationSections ||
                  shouldResetRevisedDeviationSections
                ) {
                  applyFormUpdatesOnce(values, updates);

                  if (shouldResetDeviationSections) {
                    resetData = [
                      "deviationSection",
                      "deviationsAddressedSection",
                      "premiumReceiptDetailsSection",
                    ];
                  }
                  if (shouldResetAnyDeviationSections) {
                    resetData = [
                      "deviationsAddressedSection",
                      "premiumReceiptDetailsSection",
                    ];
                  }
                  if (shouldResetRevisedDeviationSections) {
                    resetData = ["premiumReceiptDetailsSection"];
                  }

                  setTimeout(() => {
                    formRef.current?.clearErrors?.([
                      ...resetData,
                      "basicCovers",
                    ]);
                    formRef.current?.unregister?.([
                      ...resetData,
                      // this was commented as the covers are facing the form reset issue
                      // "basicCovers",
                    ]);
                  }, 0);
                } else if (requiresFormReset) {
                  applyFormUpdatesOnce(values, updates);
                } else {
                  try {
                    if (!formRef.current?.isMounted) {
                      return;
                    }

                    formRef.current?.setValues?.(updates);

                    setTimeout(() => {
                      const currentFormValues = formRef.current?.getValues?.();

                      if (
                        updates.insurerDetails &&
                        currentFormValues?.insurerDetails?.[0]?.insurerId !==
                          updates.insurerDetails[0]?.insurerId
                      ) {
                        applyFormUpdatesOnce(values, updates);
                      }
                    }, 50); // Reduced timeout
                  } catch (error) {
                    console.error("Error during setValues:", error);
                    applyFormUpdatesOnce(values, updates);
                  }
                }

                updatedValues = { ...values, ...updates };
              }
              latestValuesRef.current = updatedValues;
              if (isPolicyHardCopyMeta) {
                setIsPolicyHardCopyDisabled(
                  isPolicyHardCopySubmitDisabled(updatedValues, dynamicValues)
                );
              }

              syncPolicyHardCopyFlags(updatedValues);
            }}
          />
          {/* Tasks Section */}
          {TasksTable()}
          {TaskFormDrawer()}
          {/* Notes Section */}
          {NotesTable()}
          {NoteFormDrawer()}
          {activity?.activityKey === "quote_comparison_report_activity" ? (
            <></>
          ) : (
            <ActivitiesButtonsContainer>
              {!canGiveApproval && isActivitySubmitForApprovalStatus && (
                <div>
                  {WAITING_FOR_ACTIVITY_APPROVAL_BY}{" "}
                  <strong>
                    {approverName ||
                      getActivityData?.data?.approverDetails?.name}
                  </strong>
                </div>
              )}
              {isActivityApproveForApprovalStatus && (
                <div>
                  {THIS_ACTIVITY_WAS_APPROVED_BY}{" "}
                  <strong>
                    {getActivityData?.data?.approverDetails?.name}
                  </strong>{" "}
                  on{" "}
                  {formatDate(
                    getActivityData?.data?.approverDetails?.status?.approvedOn
                  )}{" "}
                  at{" "}
                  {getActivityData?.data?.approverDetails?.status?.approvedTime}
                </div>
              )}
              {!(
                (!canGiveApproval && isActivitySubmitForApprovalStatus) ||
                isActivityApproveForApprovalStatus
              ) ? (
                <>
                  {conditionalButtonsConfig?.map((button) => {
                    const actionHandler = actionMap[button.onClick || ""];
                    let isButtonDisabled = isFormDisabled || !canEditActivity;
                    isButtonDisabled =
                      isButtonDisabled || isSubmitting || isTaskDetailsLoading;

                    if (button.onClick === "submit") {
                      if (
                        activity?.activityKey === "policy_hard_copy_activity"
                      ) {
                        isButtonDisabled =
                          isButtonDisabled || isPolicyHardCopyDisabled;
                      }
                      if (
                        activity?.activityKey === "policy_hard_copy_activity"
                      ) {
                        const currentValues = latestValuesRef.current;
                        isButtonDisabled = isPolicyHardCopySubmitDisabled(
                          currentValues,
                          dynamicValues
                        );
                      }
                    }

                    if (
                      button.onClick === "submit" ||
                      button.onClick === "submitForApproval"
                    ) {
                      // Both tasks AND meetings must be completed for button to be enabled
                      // Disable if tasks exist and not all are completed
                      if (!isAllTasksCompleted) {
                        isButtonDisabled = true;
                      }
                      // Disable if meetings are required and not all are completed or meeting time hasn't ended
                      if (shouldShowMeetings && !canCompleteActivity) {
                        isButtonDisabled = true;
                      }
                    }

                    return (
                      <Button
                        key={button.key}
                        variantType={button.componentProps?.variantType}
                        style={button.componentProps?.style}
                        onClick={actionHandler}
                        disabled={isButtonDisabled}
                      >
                        {button.label}
                      </Button>
                    );
                  })}
                </>
              ) : null}
            </ActivitiesButtonsContainer>
          )}
        </>
      )}
    </CommonActivitiesMainContainer>
  );
};

export default PolicyHardCopyActivity;