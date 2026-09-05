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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { environment } from "@ui/ui-lib/environment";
import {
  endPoints,
  Button,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  SUCCESS_MESSAGE,
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
import { useActivityTasks } from "../hooks/useActivityTasks";
import {
  buildInsurerDetailsValue,
  clearInsurerDetailsNumericFields,
} from "./utils/insurerDetails";
import {
  ACTIVITY_KEYS,
  LEAD_SECTION_CONFIG as LEAD_SECTION_CONFIG_MAP,
  PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS,
  DEVIATION_FIELDS_TO_REMOVE,
  BrokerageFieldSet,
  OPPORTUNITY_ACTIVITY_STATUS,
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
type ValidationStep = "initial" | "validated";

type ValidationSteps = {
  company: ValidationStep;
  opportunity: ValidationStep;
};

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

const SHARED_INSURER_ACTIVITY_KEYS = new Set([ACTIVITY_KEYS.HELD_COVER_NOTE]);

// Use shared constants from constants.ts file
const LEAD_SECTION_CONFIG = LEAD_SECTION_CONFIG_MAP;
const PREMIUM_SECTION_PREFILL_MAP = PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS;

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

  const hasTaxBaseOverride = Object.prototype.hasOwnProperty.call(
    fieldSet,
    "taxBase"
  );
  const taxBaseField = hasTaxBaseOverride
    ? fieldSet.taxBase
    : fieldSet.basicBase;

  return configs;
};

const HeldCoverNoteActivity: React.FC<CommonActivityProps> = ({
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
  // Permissions for export/download
  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

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
  const initialPolicyPlacedFlipSuppressedRef = useRef(false);
  const userChangedPremiumInstallmentToggleRef = useRef(false);
  const lastMergedLeadInsurerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { id: opportunityId } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

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

  const [heldCoverNoteDevitation, setHeldCoverNoteDeviation] = useState<
    string | null
  >(null);
  const [deviationAddressedId, setDeviationsAddressedLid] = useState<
    string | null
  >(null);

  const [revisedHeldCoverNoteId, setRevisedHeldCoverNoteId] = useState<
    string | null
  >(null);
  const [premiumInstallmentToggle, setPremiumInstallmentToggle] = useState<
    string | null
  >(null);
  const hasInitializedHeldCoverNoteDeviationRef = useRef(false);

  const TOGGLE_NO = dynamicValues?.TOGGLE_NO;

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
  const [policyPlacedTypeVersion, setPolicyPlacedTypeVersion] = useState(0);

  const [isFormMounted, setIsFormMounted] = useState(false);
  const mergeSection = (base: any, patch: any) => ({
    ...(base || {}),
    ...(patch || {}),
  });

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

  const applyFormUpdatesOnce = (currValues: any, updates: any) => {
    if (
      !updates ||
      !formRef.current?.isMounted ||
      !formRef.current?.setValues
    ) {
      return;
    }

    let effectiveUpdates = updates;
    if (Object.prototype.hasOwnProperty.call(updates, "insurerDetails")) {
      const countSelected = (rows: any[]) =>
        rows.reduce((count, row) => {
          if (!row || typeof row !== "object") {
            return count;
          }
          const value = row?.insurerId;
          if (value === null || value === undefined || value === "") {
            return count;
          }
          const parsed = Number(value);
          return Number.isNaN(parsed) ? count : count + 1;
        }, 0);

      const currentRows = extractInsurerRows(
        formRef.current?.getValues?.()?.insurerDetails ??
          latestValuesRef.current?.insurerDetails ??
          currValues?.insurerDetails
      );
      const nextRows = extractInsurerRows(updates?.insurerDetails);
      const hasCurrentMultipleSelected = countSelected(currentRows) > 1;
      const hasNextMultipleSelected = countSelected(nextRows) > 1;

      if (
        !userChangedPolicyPlacedTypeRef.current &&
        hasCurrentMultipleSelected &&
        !hasNextMultipleSelected
      ) {
        effectiveUpdates = Object.fromEntries(
          Object.entries(updates).filter(([key]) => key !== "insurerDetails")
        );
      }
    }

    skipNextOnChangeRef.current = true;
    if (Object.keys(effectiveUpdates).length === 0) {
      return;
    }
    const nextValues: any = { ...currValues };
    Object.entries(effectiveUpdates).forEach(([key, value]) => {
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
    formRef.current.setValues(effectiveUpdates);
    latestValuesRef.current = nextValues;
    if (Object.prototype.hasOwnProperty.call(effectiveUpdates, "insurerDetails")) {
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

  useEffect(() => {
    if (
      activity?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE &&
      String(heldCoverNoteDevitation) === String(TOGGLE_NO)
    ) {
      if (!hasInitializedHeldCoverNoteDeviationRef.current) {
        hasInitializedHeldCoverNoteDeviationRef.current = true;
        return;
      }
      skipNextOnChange.current = true;
      formRef.current?.setValues?.({
        deviationSection: { deviations: "" },
        deviationsAddressedSection: {
          deviationsAddressedLid: null,
          resolutionLid: null,
          revisedHeldCoverNoteLid: null,
        },
      });
      setDeviationsAddressedLid(null);
      setRevisedHeldCoverNoteId(null);
      formRef.current?.clearErrors?.([
        "deviationSection",
        "deviationsAddressedSection",
        "basicCovers",
      ]);
      formRef.current?.unregister?.([
        "deviationSection",
        "deviationsAddressedSection",
        "basicCovers",
      ]);
    }
  }, [activity?.activityKey, heldCoverNoteDevitation, TOGGLE_NO]);

  useEffect(() => {
    if (
      activity?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE &&
      heldCoverNoteDevitation !== null
    ) {
      hasInitializedHeldCoverNoteDeviationRef.current = true;
    }
  }, [activity?.activityKey, heldCoverNoteDevitation, TOGGLE_NO]);

  // const currActivityDataFromGlobalState =
  //   optyActivitiesState[activity?.activityKey];

  const shouldSaveOnUnmountRef = useRef(true);
  const [approverName, setApproverName] = useState<string | null>(null);

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
    ACTIVITY_KEYS.HELD_COVER_NOTE,
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

  const shouldPrefillInstallments = [
    ACTIVITY_KEYS.HELD_COVER_NOTE,
  ].includes(activity?.activityKey ?? "");

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

  const heldCoverNoteActivityKey = ACTIVITY_KEYS.HELD_COVER_NOTE;
  const isHeldCoverNoteActivity =
    activity?.activityKey === heldCoverNoteActivityKey ||
    activityMetaData?.activityKey === heldCoverNoteActivityKey;

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
      // Mark that we have server data to prevent preferred insurer prefill
      const hasInsurerData = hasMeaningfulInsurerRows(
        extractInsurerRows(getActivityData?.data?.dataActivity?.insurerDetails)
      );

      if (hasInsurerData) {
        preferredInsurerPrefillApplied.current = true;
        insurerDetailsServerPrefillApplied.current = true;
      }
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
    if (baseValues?.premiumReceiptDetailsSection) {
      updates.premiumReceiptDetailsSection = {
        ...baseValues.premiumReceiptDetailsSection,
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_YES,
      };
    }
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
    const hasActivityInsurerRows = hasMeaningfulInsurerRows(
      extractInsurerRows(getActivityData?.data?.dataActivity?.insurerDetails)
    );
    if (hasActivityInsurerRows) {
      return;
    }
    if (!isFormMounted || !formRef.current?.isMounted) {
      return;
    }
    const apiRows =
      preferredInsurersData?.data?.insurerDetails?.data ??
      preferredInsurersData?.insurerDetails?.data ??
      [];
    if (!Array.isArray(apiRows) || apiRows.length === 0) {
      return;
    }

    const currentValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};
    const existingRows = extractInsurerRows(currentValues?.insurerDetails);
    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return;
    }

    const hasMissingAmounts = existingRows.some((row) => {
      if (!row || typeof row !== "object") return true;
      return (
        row.shareAmount == null ||
        row.brokerageAmount == null ||
        row.totalBrokerageAmount == null
      );
    });
    if (!hasMissingAmounts) {
      return;
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

    const preferredMap = new Map(
      apiRows.map((row: any) => [Number(row?.insurerId), row])
    );
    const updatedRows = existingRows.map((row) => {
      const preferred = preferredMap.get(Number(row?.insurerId));
      if (!preferred) {
        return row;
      }
      return {
        ...row,
        insurerId: toNumberOrNull(row?.insurerId ?? preferred?.insurerId),
        insurerLocationId: toNumberOrNull(
          row?.insurerLocationId ?? preferred?.insurerLocationId
        ),
        insurerBranchId: toNumberOrNull(
          row?.insurerBranchId ?? preferred?.insurerBranchId
        ),
        insurerContactId: toNumberOrNull(
          row?.insurerContactId ?? preferred?.insurerContactId
        ),
        sharePercentage: normalizeNumber(row?.sharePercentage),
        shareAmount:
          normalizeNumber(row?.shareAmount) ??
          normalizeNumber(preferred?.shareAmount),
        brokeragePercentage: normalizeNumber(row?.brokeragePercentage),
        brokerageAmount:
          normalizeNumber(row?.brokerageAmount) ??
          normalizeNumber(preferred?.brokerageAmount),
        terrorismBrokeragePercentage: normalizeNumber(
          row?.terrorismBrokeragePercentage
        ),
        terrorismBrokerageAmount:
          normalizeNumber(row?.terrorismBrokerageAmount) ??
          normalizeNumber(
            preferred?.terrorismBrokerageAmount ?? preferred?.tcBrokerageAmount
          ),
        totalBrokerageAmount:
          normalizeNumber(row?.totalBrokerageAmount) ??
          normalizeNumber(preferred?.totalBrokerageAmount),
      };
    });

    const existingLeadSection = currentValues?.premiumReceiptLeadSection ?? {};
    const existingDetailsSection =
      currentValues?.premiumReceiptDetailsSection ?? {};
    const derivedPolicyPlacedTypeLid =
      updatedRows.length > 1
        ? dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
        : dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;
    const policyPlacedTypeLid =
      existingLeadSection?.policyPlacedTypeLid ??
      existingDetailsSection?.policyPlacedTypeLid ??
      derivedPolicyPlacedTypeLid;
    const derivedLeadInsurerId =
      updatedRows.find(
        (row) =>
          row?.isLeadInsurer === dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
      )?.insurerId ?? updatedRows[0]?.insurerId;
    const leadInsurerId =
      existingLeadSection?.leadInsurerId ??
      existingDetailsSection?.leadInsurerId ??
      derivedLeadInsurerId;

    const updates: Record<string, any> = {
      insurerDetails: updatedRows,
      premiumReceiptLeadSection: {
        ...existingLeadSection,
        policyPlacedTypeLid,
        leadInsurerId,
      },
      premiumReceiptDetailsSection: {
        ...existingDetailsSection,
        policyPlacedTypeLid,
        leadInsurerId,
      },
    };

    const beforeSignature = JSON.stringify({
      insurerDetails: existingRows,
      premiumReceiptLeadSection: {
        policyPlacedTypeLid:
          currentValues?.premiumReceiptLeadSection?.policyPlacedTypeLid ?? null,
        leadInsurerId:
          currentValues?.premiumReceiptLeadSection?.leadInsurerId ?? null,
      },
      premiumReceiptDetailsSection: {
        policyPlacedTypeLid:
          currentValues?.premiumReceiptDetailsSection?.policyPlacedTypeLid ??
          null,
        leadInsurerId:
          currentValues?.premiumReceiptDetailsSection?.leadInsurerId ?? null,
      },
    });
    const afterSignature = JSON.stringify({
      insurerDetails: updatedRows,
      premiumReceiptLeadSection: { policyPlacedTypeLid, leadInsurerId },
      premiumReceiptDetailsSection: { policyPlacedTypeLid, leadInsurerId },
    });
    if (
      beforeSignature === afterSignature ||
      afterSignature === lastPreferredHydrationSignatureRef.current
    ) {
      return;
    }

    applyFormUpdatesOnce(currentValues, updates);
    lastPreferredHydrationSignatureRef.current = afterSignature;
  }, [
    isFormMounted,
    preferredInsurersData,
    getActivityData?.data?.dataActivity?.insurerDetails,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
  ]);

  useEffect(() => {
    if (!isFormMounted || !formRef.current?.isMounted) {
      return;
    }
    if (userChangedPremiumInstallmentToggleRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      const currentValues =
        Object.keys(latestValuesRef.current || {}).length > 0
          ? latestValuesRef.current
          : formRef.current?.getValues?.() ?? {};
      const hasActivityInstallmentsField = Object.prototype.hasOwnProperty.call(
        getActivityData?.data?.dataActivity ?? {},
        "installmentDetails"
      );
      const existingInstallments = normalizeInstallmentDetails(
        currentValues?.installmentDetails ??
          getActivityData?.data?.dataActivity?.installmentDetails
      );
      const prefillRows = resolvePrefillInstallments();
      const hasInstallments = hasActivityInstallmentsField
        ? existingInstallments.length > 0
        : existingInstallments.length > 0 || prefillRows.length > 0;
      const toggleValue = hasInstallments
        ? dynamicValues?.TOGGLE_YES
        : dynamicValues?.TOGGLE_NO;
      const currentToggle =
        currentValues?.premiumReceiptDetailsSection
          ?.isPremiumInstallmentBased ??
        currentValues?.premiumReceiptLeadSection?.isPremiumInstallmentBased;
      if (String(currentToggle) === String(toggleValue)) {
        return;
      }
      const updates: Record<string, any> = {
        premiumReceiptDetailsSection: {
          ...(currentValues?.premiumReceiptDetailsSection ?? {}),
          isPremiumInstallmentBased: toggleValue,
        },
        premiumReceiptLeadSection: {
          ...(currentValues?.premiumReceiptLeadSection ?? {}),
          isPremiumInstallmentBased: toggleValue,
        },
      };
      if (String(toggleValue) === String(dynamicValues?.TOGGLE_NO)) {
        updates.installmentDetails = [buildEmptyInstallmentRow()];
      }
      applyFormUpdatesOnce(currentValues, updates);
    }, 0);

    return () => clearTimeout(timer);
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
          setOptyActivitiesState((prev) => {
            const updated = { ...prev };
            delete updated[activity?.activityKey];
            return updated;
          });
          shouldSaveOnUnmountRef.current = false;
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
    const installmentToggle = String(
      updated?.premiumReceiptDetailsSection?.isPremiumInstallmentBased ??
        updated?.premiumReceiptLeadSection?.isPremiumInstallmentBased ??
        ""
    );
    const normalizedInstallmentDetails = normalizeInstallmentDetails(
      updated?.installmentDetails
    );
    if (
      installmentToggle !== toggleYes ||
      normalizedInstallmentDetails.length === 0
    ) {
      updated.installmentDetails = [];
      updated.premiumReceiptDetailsSection = {
        ...(updated?.premiumReceiptDetailsSection ?? {}),
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
      };
      updated.premiumReceiptLeadSection = {
        ...(updated?.premiumReceiptLeadSection ?? {}),
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
      };
    } else {
      updated.installmentDetails = normalizedInstallmentDetails;
    }
    return updated;
  };

  const enforceInstallmentDetailsPayload = (data: any) => {
    const next = { ...(data || {}) };
    const toggleYes = String(dynamicValues?.TOGGLE_YES ?? "");
    const installmentToggle = String(
      next?.premiumReceiptDetailsSection?.isPremiumInstallmentBased ??
        next?.premiumReceiptLeadSection?.isPremiumInstallmentBased ??
        ""
    );
    const normalizedInstallmentDetails = normalizeInstallmentDetails(
      next?.installmentDetails
    );
    if (
      installmentToggle !== toggleYes ||
      normalizedInstallmentDetails.length === 0
    ) {
      next.installmentDetails = [];
      next.premiumReceiptDetailsSection = {
        ...(next?.premiumReceiptDetailsSection ?? {}),
        isPremiumInstallmentBased: dynamicValues?.TOGGLE_NO,
      };
    } else {
      next.installmentDetails = normalizedInstallmentDetails;
    }
    return next;
  };

  const stripDeviationFields = (data: any) => {
    if (data?.premiumReceiptLeadSection) {
      data.premiumReceiptDetailsSection = {
        ...(data.premiumReceiptDetailsSection ?? {}),
        ...data.premiumReceiptLeadSection,
      };
      delete data.premiumReceiptLeadSection;
    }
    if (data?.deviationsAddressedSection) {
      DEVIATION_FIELDS_TO_REMOVE.forEach((field) => {
        delete data.deviationsAddressedSection[field];
      });
      delete data.deviationsAddressedSection.deviationSection;
    }
    if (data?.deviationSection) {
      delete data.deviationSection.deviationCoveragesLid;
    }
    if (data?.premiumReceiptDetailsSection) {
      delete data.premiumReceiptDetailsSection.brokerageAmount;
      delete data.premiumReceiptDetailsSection.installmentDetails;
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

  const createTaskForDeviation = async () => {
    const getValues = formRef?.current?.getValues?.();
    // const isValid = formRef.current?.validateSection
    //   ? await formRef.current.validateSection(["deviationSection"])
    //   : false;

    if (
      !getValues?.deviationSection?.deviations ||
      getValues?.deviationSection?.deviations.length === 0
    ) {
      dispatch(setToastMessage("Please enter deviations"));
    } else {
      mutate.mutate({
        endpoint: endPoints.createDeviationTask,
        method: HTTP_METHODS.POST,
        data: {
          taskName: DEVIATION_TASK_NAMES.HELD_COVER_NOTE_TASK,
          description: getValues?.deviationSection?.deviations,
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
        const sanitizedRest = sanitizeParticipantFields(rest);
        const cleanedRest = cleanEmptyArrayRows(sanitizedRest);
        if (cleanedRest?.premiumReceiptLeadSection) {
          cleanedRest.premiumReceiptDetailsSection = {
            ...(cleanedRest.premiumReceiptDetailsSection ?? {}),
            ...cleanedRest.premiumReceiptLeadSection,
          };
          delete cleanedRest.premiumReceiptLeadSection;
        }
        if (cleanedRest?.premiumReceiptDetailsSection) {
          delete cleanedRest.premiumReceiptDetailsSection.brokerageAmount;
        }
        stripSriLankaBrokerage({
          data: cleanedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        const finalPayload = enforceInstallmentDetailsPayload(cleanedRest);
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
        stripDeviationFields(sanitizedRest);
        if (sanitizedRest?.policyDataWrongSection) {
          delete sanitizedRest.policyDataWrongSection.premium;
        }
        if (sanitizedRest?.premiumReceiptDetailsSection) {
          delete sanitizedRest.premiumReceiptDetailsSection.brokerageAmount;
        }
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        const finalPayload = enforceInstallmentDetailsPayload(sanitizedRest);

        // stripFinalNegotiationDisallowedFields(sanitizedRest);
        // let parsed = parseNumbersDeep(rest);

        // Ensure chequeNumber is a string
        // parsed = parseStringsDeep(parsed, STRING_FIELDS);
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: finalPayload?.quoteDocuments,
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
              ...finalPayload,
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
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        if (sanitizedRest?.premiumReceiptDetailsSection) {
          delete sanitizedRest.premiumReceiptDetailsSection.brokerageAmount;
        }
        const finalPayload = enforceInstallmentDetailsPayload(sanitizedRest);
        // stripFinalNegotiationDisallowedFields(sanitizedRest);

        // let parsed = parseNumbersDeep(rest);

        // Ensure chequeNumber is a string
        // parsed = parseStringsDeep(parsed, STRING_FIELDS);

        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: finalPayload?.quoteDocuments,
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
              ...finalPayload,
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
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        const finalPayload = enforceInstallmentDetailsPayload(sanitizedRest);

        // stripFinalNegotiationDisallowedFields(sanitizedRest);

        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: finalPayload?.quoteDocuments,
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
              ...finalPayload,
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
    handleApproveReject(approvedStatusData, false, "APPROVE_ACTIVITY");
  const reject = () =>
    handleApproveReject(rejectedStatusData, true, "REJECT_ACTIVITY");
  const submitForApproval = () =>
    submitWithStatus(submitStatusDataForApproval, true);

  const hasAppliedFinalizedQuotePrefill = useRef(false);
  const initialQuotePrefillApplied = useRef(false);
  const hasUserChangedFinalizedQuoteRef = useRef(false);
  const preferredInsurerPrefillApplied = useRef(false);
  const installmentPrefillApplied = useRef(false);
  const lastPreferredHydrationSignatureRef = useRef<string | null>(null);
  const insurerDetailsServerPrefillApplied = useRef(false);
  const lastServerInsurerSnapshotRef = useRef<string | null>(null);
  const skipRecalculateShareRef = useRef(false);
  const resolvePreferredInsurerRows = () => {
    if (!preferredInsurersData) return [];

    const insurerDetailsRows =
      preferredInsurersData?.data?.insurerDetails?.data ??
      preferredInsurersData?.insurerDetails?.data;

    if (Array.isArray(insurerDetailsRows)) {
      return insurerDetailsRows;
    }

    const preferredRows =
      preferredInsurersData?.data?.preferredInsurers?.data ??
      preferredInsurersData?.preferredInsurers?.data ??
      preferredInsurersData?.data?.data ??
      preferredInsurersData?.data ??
      [];

    return Array.isArray(preferredRows) ? preferredRows : [];
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
    userChangedPremiumInstallmentToggleRef.current = false;
    lastMergedLeadInsurerIdRef.current = null;
    insurerDetailsServerPrefillApplied.current = false;
    lastServerInsurerSnapshotRef.current = null;
    lastPreferredHydrationSignatureRef.current = null;

    // Reset initial normalize flag to ensure proper data loading order
    hasAppliedInitialNormalizeRef.current = false;
  }, [activity?.opportunityActivityId]);

  const mergePreferredInsurersIntoData = useCallback(
    (
      target: Record<string, any>,
      leadInsurerId?: number | null,
      options?: { force?: boolean; onlyLeadRow?: boolean }
    ): boolean => {
      const force = options?.force ?? false;
      const onlyLeadRow = options?.onlyLeadRow ?? false;
      const shouldPrefillAllRows = isHeldCoverNoteActivity && !onlyLeadRow;
      const sectionKey = "insurerDetails";
      const targetRows = extractInsurerRows(target?.[sectionKey]);
      const preserveExistingSelectedRows =
        !userChangedPolicyPlacedTypeRef.current &&
        hasMultipleSelectedInsurers(targetRows);

      if (preserveExistingSelectedRows) {
        return false;
      }

      // Check if there's existing meaningful activity data from server
      const hasExistingActivityData = hasMeaningfulInsurerRows(
        extractInsurerRows(getActivityData?.data?.dataActivity?.insurerDetails)
      );

      // Additional check: if there's ANY activity data from server, don't prefill
      const hasAnyServerData = !!getActivityData?.data?.dataActivity;

      // If there's existing activity data or any server data, don't apply preferred insurer prefill unless forced
      if ((hasExistingActivityData || hasAnyServerData) && !force) {
        preferredInsurerPrefillApplied.current = true;
        return false;
      }

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
          target[sectionKey] = [mappedRow];
        } else if (
          existingValue &&
          typeof existingValue === "object" &&
          Array.isArray(existingValue?.retArray)
        ) {
          target[sectionKey] = {
            ...existingValue,
            retArray: [mappedRow],
          };
        } else {
          target[sectionKey] = [mappedRow];
        }

        if (leadSectionMeta.sectionKey === "premiumReceiptLeadSection") {
          target.premiumReceiptDetailsSection = {
            ...(target.premiumReceiptDetailsSection ?? {}),
            ...(target[leadSectionMeta.sectionKey] ?? {}),
          };
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

      if (leadSectionMeta.sectionKey === "premiumReceiptLeadSection") {
        target.premiumReceiptDetailsSection = {
          ...(target.premiumReceiptDetailsSection ?? {}),
          ...(target[leadSectionMeta.sectionKey] ?? {}),
        };
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
      getActivityData?.data?.dataActivity?.insurerDetails,
      isHeldCoverNoteActivity,
    ]
  );

  const getLeadInsurerIdFromValues = (values?: Record<string, any>) =>
    values?.feeDetails?.leadInsurerId ??
    values?.policyDetails?.leadInsurerId ??
    values?.premiumReceiptLeadSection?.leadInsurerId ??
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

  const hasMultipleSelectedInsurers = (rows: any[]): boolean =>
    rows.reduce((count, row) => {
      if (!row || typeof row !== "object") {
        return count;
      }
      const value = row?.insurerId;
      if (value === null || value === undefined || value === "") {
        return count;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? count : count + 1;
    }, 0) > 1;

  const hasInsurerSelectionsInValues = (values?: Record<string, any>) =>
    hasInsurerSelections(extractInsurerRows(values?.insurerDetails));

  const hasInsurerDetailsInValues = (values?: Record<string, any>) =>
    hasMeaningfulInsurerRows(extractInsurerRows(values?.insurerDetails));

  const shouldForcePreferredInsurerPrefill = (values?: Record<string, any>) => {
    if (userChangedPolicyPlacedTypeRef.current) {
      return false;
    }
    const shouldApplyMultiplePrefill = isHeldCoverNoteActivity;
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
      parseNumericInput(values?.premiumReceiptDetailsSection?.terrorism) ??
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
    const leadFlag = dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD;
    const leadRow =
      rows.find((row) => row?.isLeadInsurer === leadFlag) ?? rows[0];

    if (
      leadSectionMeta.leadInsurerField &&
      leadRow?.insurerId &&
      !leadSection?.[leadSectionMeta.leadInsurerField]
    ) {
      leadSection[leadSectionMeta.leadInsurerField] = leadRow.insurerId;
      changed = true;
    }

    if (
      leadSectionMeta.policyPlacedField &&
      dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER &&
      dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER
    ) {
      const currentValue = leadSection[leadSectionMeta.policyPlacedField];

      if (currentValue == null || currentValue === "") {
        const desiredValue =
          rows.length > 1
            ? dynamicValues.POLICY_PLACED_TYPE_MULTIPLE_INSURER
            : dynamicValues.POLICY_PLACED_TYPE_SINGLE_INSURER;

        if (desiredValue) {
          leadSection[leadSectionMeta.policyPlacedField] = desiredValue;
          changed = true;
        }
      }
    }

    if (leadSectionMeta.sectionKey === "premiumReceiptLeadSection") {
      const detailsMirror = {
        ...(values?.premiumReceiptDetailsSection ?? {}),
        ...leadSection,
      };
      if (values.premiumReceiptDetailsSection !== detailsMirror) {
        values = { ...values, premiumReceiptDetailsSection: detailsMirror };
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
  // Removed cached insurer details to prevent conflicts with server data

  useEffect(() => {
    if (hasApiInsurerDetails && !userChangedPolicyPlacedTypeRef.current) {
      return;
    }
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
    hasApiInsurerDetails,
  ]);

  useEffect(() => {
    if (!isFormMounted || !formRef.current?.isMounted) return;
    if (hasAppliedInitialNormalizeRef.current) return;

    // Always prefer server data over cached data for insurer details
    const apiData = getActivityData?.data?.dataActivity;
    if (!apiData) return;

    const source = apiData;

    let normalized = normalizeApiDataForResetting(source);
    const basePremiumForRows = getBasePremiumForInsurerRows(source);
    const terrorismPremiumForRows = getTerrorismPremiumForInsurerRows(source);
    if (Array.isArray(normalized?.insurerDetails)) {
      normalized.insurerDetails = normalizeInsurerRowsFromSource(
        normalized.insurerDetails,
        basePremiumForRows,
        terrorismPremiumForRows
      );
    }
    const normalizedHasSelections = hasInsurerSelectionsInValues(normalized);
    const forcePlacementPrefill =
      !preferredInsurerPrefillApplied.current &&
      shouldForcePreferredInsurerPrefill(normalized);

    // Don't apply preferred insurer prefill if there's existing meaningful activity data
    const hasExistingActivityInsurerData = hasMeaningfulInsurerRows(
      extractInsurerRows(getActivityData?.data?.dataActivity?.insurerDetails)
    );

    if (
      (!normalizedHasSelections || forcePlacementPrefill) &&
      !hasExistingActivityInsurerData
    ) {
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

    applyFormUpdatesOnce(baseValues, normalized);

    // mark as done (prevents repeat runs = prevents loop)
    hasAppliedInitialNormalizeRef.current = true;

    updateLockFirstInsurer(false);
  }, [
    // stable triggers only when it matters
    isFormMounted,
    activity?.activityKey,
    activity?.opportunityActivityId,
    // Only depend on server data, not global state
    !!getActivityData?.data?.dataActivity,
    mergePreferredInsurersIntoData,
    hasApiInsurerDetails,
  ]);

  // useEffect(() => {
  //   // Remove global state handling for insurer details to prevent cached preferred insurer data
  //   // from overriding server activity data
  //   return;

  //   if (currActivityDataFromGlobalState?.data && !hasApiInsurerDetails) {
  //     let normalized = normalizeApiDataForResetting(
  //       currActivityDataFromGlobalState.data
  //     );
  //     const basePremiumForRows = getBasePremiumForInsurerRows(
  //       currActivityDataFromGlobalState.data
  //     );
  //     if (Array.isArray(normalized?.insurerDetails)) {
  //       normalized.insurerDetails = normalizeInsurerRowsFromSource(
  //         normalized.insurerDetails,
  //         basePremiumForRows
  //       );
  //     }
  //     const normalizedHasSelections = hasInsurerSelectionsInValues(normalized);
  //     const forcePlacementPrefill =
  //       !preferredInsurerPrefillApplied.current &&
  //       shouldForcePreferredInsurerPrefill(normalized);

  //     // Don't apply preferred insurer prefill if there's existing meaningful activity data
  //     const hasExistingActivityInsurerData = hasMeaningfulInsurerRows(
  //       extractInsurerRows(getActivityData?.data?.dataActivity?.insurerDetails)
  //     );

  //     if (
  //       (!normalizedHasSelections || forcePlacementPrefill) &&
  //       !hasExistingActivityInsurerData
  //     ) {
  //       mergePreferredInsurersIntoData(
  //         normalized,
  //         getLeadInsurerIdFromValues(normalized)
  //       );
  //     }
  //     if (isSharedInsurerActivity && !userChangedPolicyPlacedTypeRef.current) {
  //       normalized = syncLeadSectionWithInsurerRows(normalized);
  //     }

  //     const currentValues =
  //       Object.keys(latestValuesRef.current || {}).length > 0
  //         ? latestValuesRef.current
  //         : formRef.current?.getValues?.() ?? {};
  //     applyFormUpdatesOnce(currentValues, normalized);
  //   }
  // }, [
  //   // This useEffect is disabled but keeping minimal dependencies
  //   activity?.activityKey,
  //   hasApiInsurerDetails,
  // ]);

  const currentActivityKey = activityMetaData?.activityKey ?? "";
  const isSharedInsurerActivity =
    SHARED_INSURER_ACTIVITY_KEYS.has(currentActivityKey);
  const leadSectionMeta =
    LEAD_SECTION_CONFIG[
      currentActivityKey as keyof typeof LEAD_SECTION_CONFIG
    ] ?? LEAD_SECTION_CONFIG[ACTIVITY_KEYS.HELD_COVER_NOTE];
  const latestLeadSectionValues =
    latestValuesRef.current?.[leadSectionMeta.sectionKey];

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
          return field;
        });
      }

      return finalGroup;
    });

    return enhancedConfig;
  }, [
    activityMetaData?.activityKey,
    activityMetaData?.coversConfig,
    activityMetaData?.coversPrefillData,
    dynamicValues,
    getActivityData?.data?.dataActivity?.documents,
    latestLeadSectionValues?.[leadSectionMeta.leadInsurerField],
    heldCoverNoteDevitation,
    deviationAddressedId,
    revisedHeldCoverNoteId,
    premiumInstallmentToggle,
    lockFirstInsurer,
    isSharedInsurerActivity,
    insurerPrefillVersion,
    leadInsurerSelectionVersion,
    insurerDetailsVersion,
    policyPlacedTypeVersion,
    isExportAllowed,
    activity.isDocumentMandatory,
  ]);

  useEffect(() => {
    if (!isSharedInsurerActivity) {
      return;
    }
    if (userChangedPolicyPlacedTypeRef.current) {
      return;
    }

    // Only use server data, ignore cached global state for insurer details
    const apiSource = getActivityData?.data?.dataActivity?.insurerDetails;

    const basePremiumFromSource = getBasePremiumForInsurerRows(
      getActivityData?.data?.dataActivity
    );
    const terrorismPremiumFromSource = getTerrorismPremiumForInsurerRows(
      getActivityData?.data?.dataActivity
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

    const nextLatest = {
      ...(latestValuesRef.current || {}),
      insurerDetails: normalizedRows,
    };
    latestValuesRef.current = nextLatest;
    insurerDetailsServerPrefillApplied.current = true;
    setInsurerDetailsVersion((prev) => prev + 1);
  }, [
    activity?.activityKey,
    getActivityData?.data?.dataActivity?.insurerDetails,
    isFormMounted,
    isSharedInsurerActivity,
  ]);

  // Preferred insurer prefill handled during initial normalize/reset
  useEffect(() => {
    if (hasApiInsurerDetails && !userChangedPolicyPlacedTypeRef.current) {
      return;
    }
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

    const activityInsurerDetails =
      getActivityData?.data?.dataActivity?.insurerDetails;
    const hasActivityInsurerDetails =
      (Array.isArray(activityInsurerDetails) &&
        activityInsurerDetails.length > 0) ||
      (activityInsurerDetails &&
        typeof activityInsurerDetails === "object" &&
        Array.isArray(activityInsurerDetails.retArray) &&
        activityInsurerDetails.retArray.length > 0);

    // Additional check for meaningful insurer data
    const hasExistingMeaningfulActivityData = hasMeaningfulInsurerRows(
      extractInsurerRows(activityInsurerDetails)
    );

    if (hasActivityInsurerDetails || hasExistingMeaningfulActivityData) {
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

    if (isSharedInsurerActivity) {
      const rows = extractInsurerRows(nextInsurerDetails);
      const firstInsurerId = rows[0]?.insurerId ?? null;
      const leadSectionKey = leadSectionMeta.sectionKey;
      const existingLeadSection = baseValues?.[leadSectionKey] ?? {};
      const updatedLeadSection = { ...existingLeadSection };
      let shouldUpdateLeadSection = false;

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

    setTimeout(() => {
      const formValues = formRef.current?.getValues?.() || {};
      if (grossPremiumAutoPopulateConfigs.length > 0) {
        handleAutoPopulateGrossPremium(formValues);
      }
      if (isSriLankaUser && brokerageAutoPopulateConfigs.length > 0) {
        handleAutoPopulateBrokerageAmounts(formValues);
      }
    }, 100);

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
    isSharedInsurerActivity,
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    leadSectionMeta.policyPlacedField,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    isGetActivityLoading,
    getActivityData?.data?.dataActivity?.insurerDetails,
    hasApiInsurerDetails,
  ]);

  useEffect(() => {
    if (hasApiInsurerDetails && !userChangedPolicyPlacedTypeRef.current) {
      return;
    }
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

    const activityInsurerDetails =
      getActivityData?.data?.dataActivity?.insurerDetails;
    const hasActivityInsurerDetails =
      (Array.isArray(activityInsurerDetails) &&
        activityInsurerDetails.length > 0) ||
      (activityInsurerDetails &&
        typeof activityInsurerDetails === "object" &&
        Array.isArray(activityInsurerDetails.retArray) &&
        activityInsurerDetails.retArray.length > 0);

    // Additional check for meaningful insurer data
    const hasExistingMeaningfulActivityData = hasMeaningfulInsurerRows(
      extractInsurerRows(activityInsurerDetails)
    );

    if (hasActivityInsurerDetails || hasExistingMeaningfulActivityData) {
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
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    leadSectionMeta.policyPlacedField,
    dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER,
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    isGetActivityLoading,
    getActivityData?.data?.dataActivity?.insurerDetails,
    hasApiInsurerDetails,
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
      case ACTIVITY_KEYS.HELD_COVER_NOTE: {
        // const netPremiumBaseFields = [
        //   "premiumReceiptDetailsSection.basicPremium",
        //   "premiumReceiptDetailsSection.srccAmount",
        //   "premiumReceiptDetailsSection.terrorismCommission",
        // ];
        // const baseFields = [
        //   ...netPremiumBaseFields,
        //   "premiumReceiptDetailsSection.serviceTaxAmount",
        // ];

        // const chargeFields = [
        //   ...baseFields,
        //   "premiumReceiptDetailsSection.fee",
        //   "premiumReceiptDetailsSection.other",
        //   "premiumReceiptDetailsSection.adminCharges",
        //   "premiumReceiptDetailsSection.cessAmount",
        // ];

        // const totalBrokerageFields = [
        //   "premiumReceiptDetailsSection.basicBrokerageAmount",
        //   "premiumReceiptDetailsSection.srccBrokerageAmount",
        //   "premiumReceiptDetailsSection.tcBrokerageAmount",
        // ];

        return [
          {
            target: "premiumReceiptDetailsSection.netPremium",
            fields: [
              "premiumReceiptDetailsSection.basicPremium",
              "premiumReceiptDetailsSection.srccAmount",
              "premiumReceiptDetailsSection.terrorism",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.premiumReceiptDetailsSection;
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
            target: "premiumReceiptDetailsSection.gstAmount",
            fields: [
              "premiumReceiptDetailsSection.netPremium",
              "premiumReceiptDetailsSection.gstPercentage",
            ],
            compute: ({ values }: { values: Record<string, any> }) => {
              // Sri Lanka VAT has its own base (charges included) and is
              // handled by applySriLankaVatUpdate.
              if (isSriLankaUser || getActiveFieldKey() === "gstAmount") {
                return undefined;
              }
              const sectionValues = values?.premiumReceiptDetailsSection;
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
            target: "premiumReceiptDetailsSection.grossPremium",
            fields: [
              "premiumReceiptDetailsSection.netPremium",
              "premiumReceiptDetailsSection.gstAmount",
              "premiumReceiptDetailsSection.adminCharges",
              "premiumReceiptDetailsSection.other",
              "premiumReceiptDetailsSection.cessAmount",
              "premiumReceiptDetailsSection.fee",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.premiumReceiptDetailsSection;
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
            target: "premiumReceiptDetailsSection.totalInstallmentAmount",
            fields: [
              "premiumReceiptDetailsSection.netPremium",
              "premiumReceiptDetailsSection.other",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.premiumReceiptDetailsSection;
              const netPremium = parseNumericInput(sectionValues?.netPremium);
              const other = parseNumericInput(sectionValues?.other);
              if (netPremium === null && other === null) {
                return "";
              }
              return Number(((netPremium ?? 0) + (other ?? 0)).toFixed(4));
            },
          },
          {
            target: "premiumReceiptDetailsSection.totalBrokerageAmount",
            fields: [
              "premiumReceiptDetailsSection.basicBrokerageAmount",
              "premiumReceiptDetailsSection.srccBrokerageAmount",
              "premiumReceiptDetailsSection.tcBrokerageAmount",
              "premiumReceiptDetailsSection.fee",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.premiumReceiptDetailsSection;
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

  const renderLabelsOfActivity = (title: string | undefined) => {
    if (!title) return null;
    switch (title) {
      default:
        return null;
    }
  };

  const premiumPrefillActivities = useMemo(
    () => [ACTIVITY_KEYS.HELD_COVER_NOTE],
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

    // Respect explicit single selection once rows are already collapsed to one.
    if (
      String(currentLeadSection?.[policyPlacedField] ?? "") ===
        String(singleValue) &&
      currentInsurerRows.length <= 1
    ) {
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
    dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER,
    isHeldCoverNoteActivity,
    leadSectionMeta.policyPlacedField,
    leadSectionMeta.sectionKey,
    insurerPrefillVersion,
    userChangedPolicyPlacedTypeRef,
  ]);

  useEffect(() => {
    if (
      !isFormMounted ||
      !formRef.current ||
      // !formRef.current?.isMounted ||
      !premiumResponseData ||
      !premiumPrefillActivities.includes(activity?.activityKey)
    ) {
      return;
    }

    if (isGetActivityLoading) {
      return;
    }

    if (getActivityData?.data?.dataActivity) {
      return;
    }

    const valuesSnapshot = latestValuesRef.current || {};
    const currentValues =
      Object.keys(valuesSnapshot).length > 0
        ? valuesSnapshot
        : formRef.current?.getValues?.() || {};
    const premium = transformPremiumData(premiumResponseData);
    const updates: Record<string, any> = {};

    const sectionConfigs =
      PREMIUM_SECTION_PREFILL_MAP[activity?.activityKey ?? ""] || [];

    sectionConfigs.forEach(({ section, allowed }) => {
      const rawSection = currentValues?.[section];
      if (
        rawSection !== undefined &&
        (typeof rawSection !== "object" || Array.isArray(rawSection))
      ) {
        return;
      }

      const currentSection = (rawSection as Record<string, any>) || {};

      const sectionUpdates: Record<string, any> = {};
      allowed.forEach((key) => {
        const value = premium[key];

        if (value === null || value === undefined) return;

        const current = currentSection[key];

        const isVatField = key === "gstPercentage" || key === "gstAmount";
        const isForceUpdateField = [
          "terrorism",
          "netPremium",
          "srccAmount",
          "basicPremium",
          "gstPercentage",
        ].includes(key);

        const shouldUpdate = isForceUpdateField
          ? true // Always update these fields
          : isUnsetValue(current);
        // const shouldUpdate =
        //   isSriLankaUser && isVatField ? true : isUnsetValue(current);

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
  ]);

  const [statusLidState, setStatusLid] = useState<number | null>(null);

  const effectiveStatusLid = statusLidState ?? activityMetaData?.statusLid;

  const opportunityInitialStatus = opportunityActivityStatus?.find(
    (status: any) => status.id === effectiveStatusLid
  )?.lookUpKey;

  const actionMap = {
    saveActivity,
    submit,
    createTaskForDeviation,
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
    (Role === "BD" && canGiveApprovalForBD) ||
    (Role === "ISG" && canGiveApprovalForISG);
  const canEditBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_BD_OPTY_ACTIVITY)(state)
  );
  const canEditISGActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_ISG_OPTY_ACTIVITY)(state)
  );

  const canEditActivity =
    (Role === "BD" && canEditBDActivity) ||
    (Role === "ISG" && canEditISGActivity);

  const disableServiceTaxAutoCalculation = useMemo(
    () =>
      getCountrySpecificConfig(false, {
        "Sri Lanka": true,
      }),
    []
  );

  const isActivityApproved =
    activity?.activityApproval === "Yes" ||
    activity?.activityApproval === "yes";
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
  const isEq = (a: any, b: any) => String(a ?? "") === String(b ?? "");

  const disableSFAForHeld =
    activity?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE &&
    (isEq(deviationAddressedId, dynamicValues?.TOGGLE_NO) ||
      isEq(revisedHeldCoverNoteId, dynamicValues?.TOGGLE_NO));

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

  const clearInsurerDetails = (rows: any[], isSinglePlacement: boolean) =>
    clearInsurerDetailsNumericFields(
      rows,
      isSinglePlacement,
      dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
      dynamicValues?.INSURER_PARTICIPATION_TYPE_CO
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
      const prevSharePct =
        parseNumericInput(previousRowValues?.sharePercentage) ?? 0;
      const prevShareAmount =
        parseNumericInput(previousRowValues?.shareAmount) ?? 0;

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

  // Use activity tasks hook
  const {
    TasksTable,
    TaskFormDrawer,
    isAllTasksCompleted,
    isTaskDetailsLoading,
    // Meetings
    shouldShowMeetings,
    canCompleteActivity,
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
          {renderLabelsOfActivity(activity?.activityKey)}
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
                const installmentToggle =
                  values?.premiumReceiptDetailsSection
                    ?.isPremiumInstallmentBased ?? null;
                setPremiumInstallmentToggle((prev) =>
                  prev === installmentToggle ? prev : installmentToggle
                );
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
                  const currentRows = extractInsurerRows(values?.insurerDetails);
                  const hasCurrentMultipleSelectedInsurers =
                    hasMultipleSelectedInsurers(currentRows);
                  const shouldPreserveApiInsurerRows =
                    !userChangedPolicyPlacedTypeRef.current &&
                    (hasApiInsurerDetails || hasCurrentMultipleSelectedInsurers);

                  if (
                    prevPlaced !== currPlaced &&
                    userChangedPolicyPlacedTypeRef.current &&
                    !shouldPreserveApiInsurerRows &&
                    !hasApiInsurerDetails
                  ) {
                    setPolicyPlacedTypeVersion((prev) => prev + 1);
                    const baseRows =
                      currentRows.length > 0
                        ? currentRows
                        : [buildDefaultInsurerRow(values, !isMultiple)];

                    const clearedRows = clearInsurerDetails(
                      baseRows,
                      !isMultiple
                    );
                    const nextRows = !isMultiple
                      ? [clearedRows[0]]
                      : clearedRows;
                    const nextDetails = buildInsurerDetailsValue(
                      values?.insurerDetails,
                      nextRows
                    );

                    skipNextOnChange.current = true;
                    const mirroredPremiumReceiptDetails =
                      leadSectionKey === "premiumReceiptLeadSection"
                        ? {
                            ...(values?.premiumReceiptDetailsSection ?? {}),
                            policyPlacedTypeLid:
                              values?.[leadSectionKey]?.[policyField] ?? null,
                          }
                        : undefined;
                    formRef.current?.setValues?.({
                      insurerDetails: nextDetails,
                      ...(mirroredPremiumReceiptDetails
                        ? {
                            premiumReceiptDetailsSection:
                              mirroredPremiumReceiptDetails,
                          }
                        : {}),
                    });
                    latestValuesRef.current = {
                      ...values,
                      insurerDetails: nextDetails,
                      ...(mirroredPremiumReceiptDetails
                        ? {
                            premiumReceiptDetailsSection:
                              mirroredPremiumReceiptDetails,
                          }
                        : {}),
                    };
                  }
                }
                return;
              }

              const isDeepEqual = (obj1: any, obj2: any) => {
                return JSON.stringify(obj1) === JSON.stringify(obj2);
              };

              if (isDeepEqual(values, latestValuesRef.current)) {
                return;
              }

              //for localisation refactor in the future
              if (grossPremiumAutoPopulateConfigs.length > 0 && values) {
                handleAutoPopulateGrossPremium(values);
              }

              if (
                isSriLankaUser &&
                brokerageAutoPopulateConfigs.length > 0 &&
                values
              ) {
                handleAutoPopulateBrokerageAmounts(values);
              }

              let shouldResetDeviationSections = false;
              let shouldResetAnyDeviationSections = false;
              let shouldResetRevisedDeviationSections = false;
              let preserveApiInsurerTruth = false;
              const prevValues = latestValuesRef.current || {};
              let updatedValues = values;

              const updates: Record<string, any> = {};

              if (
                activityMetaData?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE
              ) {
                const prevToggle = String(
                  prevValues?.premiumReceiptDetailsSection
                    ?.isPremiumInstallmentBased ?? ""
                );
                const currToggle = String(
                  values?.premiumReceiptDetailsSection
                    ?.isPremiumInstallmentBased ?? ""
                );
                if (prevToggle !== currToggle) {
                  userChangedPremiumInstallmentToggleRef.current = true;
                }
                const toggleYes = String(dynamicValues?.TOGGLE_YES ?? "");
                const toggleNo = String(dynamicValues?.TOGGLE_NO ?? "");
                if (prevToggle === toggleYes && currToggle === toggleNo) {
                  updates.installmentDetails = [buildEmptyInstallmentRow()];
                  formRef.current?.clearErrors?.(["installmentDetails"]);
                }
              }

              let requiresFormReset = false;

              if (isSharedInsurerActivity) {
                const currentInsurerRowsForTruth = extractInsurerRows(
                  values?.insurerDetails
                );
                preserveApiInsurerTruth =
                  hasApiInsurerDetails &&
                  !userChangedPolicyPlacedTypeRef.current &&
                  hasMultipleSelectedInsurers(currentInsurerRowsForTruth);

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
                  setPolicyPlacedTypeVersion((prev) => prev + 1);
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
                const hasCurrentMultipleSelectedInsurers =
                  hasMultipleSelectedInsurers(currentInsurerRows);
                const shouldPreserveApiInsurerRows =
                  !userChangedPolicyPlacedTypeRef.current &&
                  (hasApiInsurerDetails || hasCurrentMultipleSelectedInsurers);
                const prevLeadPays = prevLeadSectionValues?.[leadPaysFieldName];
                const currLeadPays =
                  getLeadSectionSnapshot()?.[leadPaysFieldName];
                const leadPaysChanged = prevLeadPays !== currLeadPays;

                const prevLeadInsurerId =
                  prevLeadSectionValues?.[leadInsurerFieldName];
                let currLeadInsurerId =
                  getLeadSectionSnapshot()?.[leadInsurerFieldName];

                if (
                  leadInsurerFieldName &&
                  isUnsetValue(currLeadInsurerId) &&
                  !isUnsetValue(prevLeadInsurerId)
                ) {
                  applyLeadSectionUpdates({
                    [leadInsurerFieldName]: prevLeadInsurerId,
                  });
                  currLeadInsurerId = prevLeadInsurerId;
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
                  const currentRows = extractInsurerRows(
                    values?.insurerDetails
                  );
                  const fallbackRow = buildDefaultInsurerRow(
                    values,
                    !isMultiple
                  );
                  const baseRows =
                    currentRows.length > 0 ? currentRows : [fallbackRow];
                  const clearedRows = clearInsurerDetails(
                    baseRows,
                    !isMultiple
                  );
                  const nextRows = !isMultiple ? [clearedRows[0]] : clearedRows;
                  updates.insurerDetails = buildInsurerDetailsValue(
                    values?.insurerDetails,
                    nextRows
                  );
                  if (leadSectionKey === "premiumReceiptLeadSection") {
                    updates.premiumReceiptDetailsSection = {
                      ...(values?.premiumReceiptDetailsSection ?? {}),
                      policyPlacedTypeLid:
                        getLeadSectionSnapshot()?.[leadPolicyField] ?? null,
                    };
                  }
                  values = {
                    ...values,
                    insurerDetails: updates.insurerDetails,
                    ...(updates.premiumReceiptDetailsSection
                      ? {
                          premiumReceiptDetailsSection:
                            updates.premiumReceiptDetailsSection,
                        }
                      : {}),
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
                  const preferredRows =
                    preferredInsurersData?.data?.preferredInsurers?.data ??
                    preferredInsurersData?.preferredInsurers?.data;

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

                  if (Array.isArray(preferredRows)) {
                    const existingIds = new Set(
                      apiRows.map((row) =>
                        toNumberOrNull(row?.insurerId ?? (row as any)?.id)
                      )
                    );
                    preferredRows.forEach((row: any) => {
                      const id = toNumberOrNull(row?.insurerId ?? row?.id);
                      if (id !== null && !existingIds.has(id)) {
                        apiRows.push(row);
                      }
                    });
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
                  const fieldsToPopulate =
                    userChangedPolicyPlacedTypeRef.current
                      ? Array.from(alwaysPopulateFields)
                      : [
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
                        ];

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

                  const shouldApplyMultiplePrefill = isHeldCoverNoteActivity;
                  const needsPlacementPrefill =
                    shouldApplyMultiplePrefill &&
                    shouldForcePreferredInsurerPrefill(values);

                  const shouldAttemptPrefill =
                    resolvedLeadInsurerId !== null &&
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

                        if (
                          existingPolicyPlaced !== undefined &&
                          existingPolicyPlaced !== null &&
                          existingPolicyPlaced !== ""
                        ) {
                          mergedLeadSection[policyField] = existingPolicyPlaced;
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

                  if (
                    Array.isArray(currentList) &&
                    currentList.length === 1
                  ) {
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

              if (isSriLankaUser) {
                const applySriLankaVatUpdate = (
                  sectionKey: "premiumReceiptDetailsSection"
                ) => {
                  const sectionValues = {
                    ...(values?.[sectionKey] || {}),
                    ...(updates[sectionKey] || {}),
                  };
                  const prevSectionValues = prevValues?.[sectionKey] || {};

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

                  const currentNetPremium = computeNetPremium(sectionValues);
                  const prevNetPremium = computeNetPremium(prevSectionValues);

                  const currentAdmin = parseOrZero(sectionValues.adminCharges);
                  const currentOther = parseOrZero(sectionValues.other);
                  const currentCess = parseOrZero(sectionValues.cessAmount);
                  const currentFee = parseOrZero(sectionValues.fee);

                  const prevAdmin = parseOrZero(prevSectionValues.adminCharges);
                  const prevOther = parseOrZero(prevSectionValues.other);
                  const prevCess = parseOrZero(prevSectionValues.cessAmount);
                  const prevFee = parseOrZero(prevSectionValues.fee);

                  const vatBase =
                    currentNetPremium +
                    currentAdmin +
                    currentOther +
                    currentCess +
                    currentFee;

                  const prevVatBase =
                    prevNetPremium + prevAdmin + prevOther + prevCess + prevFee;

                  const prevVatPercentage = parseNumericInput(
                    prevSectionValues.gstPercentage
                  );
                  const prevVatAmount = parseNumericInput(
                    prevSectionValues.gstAmount
                  );
                  const currentVatPercentage = parseNumericInput(
                    sectionValues.gstPercentage
                  );
                  const currentVatAmount = parseNumericInput(
                    sectionValues.gstAmount
                  );

                  const prevHasVatValues =
                    prevVatPercentage !== null || prevVatAmount !== null;
                  const prevHasVatBoth =
                    prevVatPercentage !== null && prevVatAmount !== null;
                  const currentHasVatValues =
                    currentVatPercentage !== null && currentVatAmount !== null;

                  if (!prevHasVatValues && currentHasVatValues) {
                    return;
                  }

                  const vatChangedField = resolveChangedField(
                    parseOrZero(sectionValues.gstPercentage),
                    parseOrZero(sectionValues.gstAmount),
                    parseOrZero(prevSectionValues.gstPercentage),
                    parseOrZero(prevSectionValues.gstAmount)
                  );

                  if (!vatChangedField) {
                    return;
                  }

                  const vatUpdate = calculatePercentageAmountUpdate(
                    vatBase,
                    parseOrZero(sectionValues.gstPercentage),
                    parseOrZero(sectionValues.gstAmount),
                    prevVatBase,
                    parseOrZero(prevSectionValues.gstPercentage),
                    parseOrZero(prevSectionValues.gstAmount),
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
                    updates[sectionKey] = {
                      ...(updates[sectionKey] || values?.[sectionKey] || {}),
                      ...vatUpdate,
                    };
                  }
                };

                applySriLankaVatUpdate("premiumReceiptDetailsSection");
              }

              if (!isSriLankaUser && !disableServiceTaxAutoCalculation) {
                const sectionKey = "premiumReceiptDetailsSection";
                // Include updates already staged in this pass (netPremium etc.)
                // so the tax base is not one keystroke stale.
                const sectionValues = {
                  ...(values?.[sectionKey] || {}),
                  ...(updates[sectionKey] || {}),
                };
                const prevSectionValues = prevValues?.[sectionKey] || {};

                const gstPercentage = Number(sectionValues?.gstPercentage) || 0;
                const gstAmount = Number(sectionValues?.gstAmount) || 0;
                const prevGstPercentage =
                  Number(prevSectionValues?.gstPercentage) || 0;
                const prevGstAmount = Number(prevSectionValues?.gstAmount) || 0;

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
                  return Number(((basicPremium ?? 0) + (terrorism ?? 0)).toFixed(4));
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
                  return Math.abs(netPremiumCandidate - derivedNetPremium) > 0.01
                    ? derivedNetPremium
                    : netPremiumCandidate;
                };

                // Must be the same base the gstAmount auto-populate config
                // uses, otherwise the two fight: netPremium here includes
                // srccAmount, pickTaxBase's derived value does not.
                const gstBase =
                  parseNumericInput(sectionValues?.netPremium) ??
                  pickTaxBase(sectionValues);
                const prevServiceTaxBase =
                  parseNumericInput(prevSectionValues?.netPremium) ??
                  pickTaxBase(prevSectionValues);

                const serviceTaxUpdate = calculatePercentageAmountUpdate(
                  gstBase,
                  gstPercentage,
                  gstAmount,
                  prevServiceTaxBase,
                  prevGstPercentage,
                  prevGstAmount,
                  "gstPercentage",
                  "gstAmount",
                  {
                    skipCountryCheck: isSriLankaUser,
                    preferPercentageInput: true,
                    allowReverseWhenAmountChanged: true,
                    changedField: resolveChangedField(
                      gstPercentage,
                      gstAmount,
                      prevGstPercentage,
                      prevGstAmount
                    ),
                  }
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

              const ensureSectionBrokerage = (
                sectionKey: string,
                baseField: string
              ) => {
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

                const brokerageChangedField = resolveChangedField(
                  toNumericValue(mergedSectionValues?.basicBrokeragePercentage),
                  toNumericValue(mergedSectionValues?.basicBrokerageAmount),
                  toNumericValue(
                    previousSectionValues?.basicBrokeragePercentage
                  ),
                  toNumericValue(previousSectionValues?.basicBrokerageAmount)
                );

                const brokerageUpdate = calculatePercentageAmountUpdate(
                  toNumericValue(mergedSectionValues?.[baseField]),
                  toNumericValue(mergedSectionValues?.basicBrokeragePercentage),
                  toNumericValue(mergedSectionValues?.basicBrokerageAmount),
                  toNumericValue(previousSectionValues?.[baseField]),
                  toNumericValue(
                    previousSectionValues?.basicBrokeragePercentage
                  ),
                  toNumericValue(previousSectionValues?.basicBrokerageAmount),
                  "basicBrokeragePercentage",
                  "basicBrokerageAmount",
                  {
                    preferPercentageInput: true,
                    allowReverseWhenAmountChanged: true,
                    changedField: brokerageChangedField,
                  }
                );

                if (brokerageUpdate) {
                  updates[sectionKey] = {
                    ...(updates[sectionKey] || currentSectionValues || {}),
                    ...brokerageUpdate,
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

              // --- held cover note: reset fields on toggle changes (without affecting other activities)
              if (
                activityMetaData?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE
              ) {
                const receiptSectionKey = "premiumReceiptDetailsSection";
                const getReceiptSnapshot = () => ({
                  ...(values?.[receiptSectionKey] || {}),
                  ...(updates[receiptSectionKey] || {}),
                });
                const prevReceiptValues =
                  prevValues?.[receiptSectionKey] || {};

                const applyReceiptUpdates = (nextUpdate: Record<string, any>) => {
                  updates[receiptSectionKey] = {
                    ...(updates[receiptSectionKey] || getReceiptSnapshot()),
                    ...nextUpdate,
                  };
                };

                {
                  const snapshot = getReceiptSnapshot();
                  const basicPremium =
                    parseNumericInput(snapshot.basicPremium) ?? 0;
                  const prevBasicPremium =
                    parseNumericInput(prevReceiptValues.basicPremium) ?? 0;
                  const basicPct =
                    parseNumericInput(snapshot.basicBrokeragePercentage) ?? 0;
                  const basicAmt =
                    parseNumericInput(snapshot.basicBrokerageAmount) ?? 0;
                  const prevBasicPct =
                    parseNumericInput(prevReceiptValues.basicBrokeragePercentage) ??
                    0;
                  const prevBasicAmt =
                    parseNumericInput(prevReceiptValues.basicBrokerageAmount) ??
                    0;
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
                    applyReceiptUpdates(basicUpdate);
                  }
                }

                {
                  const snapshot = getReceiptSnapshot();
                  const terrorismBase =
                    parseNumericInput(snapshot.terrorism) ?? 0;
                  const prevTerrorismBase =
                    parseNumericInput(prevReceiptValues.terrorism) ?? 0;
                  const terrorismPct =
                    parseNumericInput(snapshot.terrorismBrokeragePercentage) ??
                    0;
                  const terrorismAmt =
                    parseNumericInput(snapshot.tcBrokerageAmount) ?? 0;
                  const prevTerrorismPct =
                    parseNumericInput(
                      prevReceiptValues.terrorismBrokeragePercentage
                    ) ?? 0;
                  const prevTerrorismAmt =
                    parseNumericInput(prevReceiptValues.tcBrokerageAmount) ?? 0;
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
                    applyReceiptUpdates(terrorismUpdate);
                  }
                }

                {
                  const snapshot = getReceiptSnapshot();
                  const srccBase = parseNumericInput(snapshot.srccAmount) ?? 0;
                  const prevSrccBase =
                    parseNumericInput(prevReceiptValues.srccAmount) ?? 0;
                  const srccPct =
                    parseNumericInput(snapshot.srccPercentage) ?? 0;
                  const srccAmt =
                    parseNumericInput(snapshot.srccBrokerageAmount) ?? 0;
                  const prevSrccPct =
                    parseNumericInput(prevReceiptValues.srccPercentage) ?? 0;
                  const prevSrccAmt =
                    parseNumericInput(prevReceiptValues.srccBrokerageAmount) ??
                    0;
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
                    applyReceiptUpdates(srccUpdate);
                  }
                }

                ensureSectionTotalPremium(
                  "premiumReceiptDetailsSection",
                  "basicPremium"
                );
                ensureSectionServiceTax(
                  "premiumReceiptDetailsSection",
                  "netPremium"
                );
                const YES = dynamicValues?.TOGGLE_YES;

                // 1) Any deviations: change to No => clear dependent sections
                const prevAnyDev =
                  prevValues?.placementSlipDeviationsSection
                    ?.placementSlipDeviationsLid;
                const currAnyDev =
                  values?.placementSlipDeviationsSection
                    ?.placementSlipDeviationsLid;

                if (prevAnyDev === YES && currAnyDev !== YES) {
                  updates.deviationSection = { deviations: "" };
                  updates.deviationsAddressedSection = {
                    deviationsAddressedLid: null,
                    resolutionLid: null,
                    revisedHeldCoverNoteLid: null,
                  };
                  shouldResetDeviationSections = true;
                }

                // 2) Deviation addressed: change to No => clear fields below
                const prevAddr =
                  prevValues?.deviationsAddressedSection
                    ?.deviationsAddressedLid;
                const currAddr =
                  values?.deviationsAddressedSection?.deviationsAddressedLid;

                if (prevAddr === YES && currAddr !== YES) {
                  updates.deviationsAddressedSection = {
                    ...(updates.deviationsAddressedSection || {}),
                    resolutionLid: null,
                    revisedHeldCoverNoteLid: null,
                  };
                  shouldResetAnyDeviationSections = true;
                }

                // 3) Revised held cover note received: change to No => clear receipt fields
                const prevRevised =
                  prevValues?.deviationsAddressedSection
                    ?.revisedHeldCoverNoteLid;
                const currRevised =
                  values?.deviationsAddressedSection?.revisedHeldCoverNoteLid;

                if (prevRevised === YES && currRevised !== YES) {
                  shouldResetRevisedDeviationSections = true;
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

                  const sectionsToUnregister = resetData.filter(
                    (sectionKey: string) =>
                      sectionKey !== "premiumReceiptDetailsSection"
                  );

                  setTimeout(() => {
                    formRef.current?.clearErrors?.([
                      ...resetData,
                      "basicCovers",
                    ]);
                    if (sectionsToUnregister.length > 0) {
                      formRef.current?.unregister?.([
                        ...sectionsToUnregister,
                        // this was commented as the covers are facing the form reset issue
                        // "basicCovers",
                      ]);
                    }
                  }, 0);
                } else if (requiresFormReset) {
                  applyFormUpdatesOnce(values, updates);
                } else {
                  try {
                    if (!formRef.current?.isMounted) {
                      return;
                    }

                    const currentInsurerRows = extractInsurerRows(
                      formRef.current?.getValues?.()?.insurerDetails ??
                        values?.insurerDetails
                    );
                    const shouldPreserveCurrentMultiInsurerRows =
                      !!updates.insurerDetails &&
                      !userChangedPolicyPlacedTypeRef.current &&
                      hasMultipleSelectedInsurers(currentInsurerRows);
                    const updatePayload = shouldPreserveCurrentMultiInsurerRows
                      ? Object.fromEntries(
                          Object.entries(updates).filter(
                            ([key]) => key !== "insurerDetails"
                          )
                        )
                      : updates;
                    if (Object.keys(updatePayload).length === 0) {
                      return;
                    }

                    skipNextOnChange.current = true;
                    formRef.current?.setValues?.(updatePayload);

                    setTimeout(() => {
                      const currentFormValues = formRef.current?.getValues?.();

                      if (
                        updatePayload.insurerDetails &&
                        currentFormValues?.insurerDetails?.[0]?.insurerId !==
                          updatePayload.insurerDetails[0]?.insurerId
                      ) {
                        // Don't override if current form has more insurers than updates (server data should take precedence)
                        const currentInsurerCount =
                          currentFormValues?.insurerDetails?.length || 0;
                        const updatesInsurerCount =
                          updatePayload.insurerDetails?.length || 0;

                        if (
                          currentInsurerCount > updatesInsurerCount &&
                          currentInsurerCount > 1
                        ) {
                          return;
                        }

                        applyFormUpdatesOnce(values, updatePayload);
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
              if (
                activityMetaData?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE
              ) {
                const deviationId =
                  updatedValues?.placementSlipDeviationsSection
                    ?.placementSlipDeviationsLid;
                setHeldCoverNoteDeviation((prev) =>
                  prev === deviationId ? prev : deviationId
                );
                const deviationsAddressedLid =
                  updatedValues?.deviationsAddressedSection
                    ?.deviationsAddressedLid;
                setDeviationsAddressedLid((prev) =>
                  prev === deviationsAddressedLid ? prev : deviationsAddressedLid
                );
                const revisedLid =
                  updatedValues?.deviationsAddressedSection
                    ?.revisedHeldCoverNoteLid ?? null;
                setRevisedHeldCoverNoteId((prev) =>
                  prev === revisedLid ? prev : revisedLid
                );
                const installmentToggle =
                  updatedValues?.premiumReceiptDetailsSection
                    ?.isPremiumInstallmentBased ?? null;
                setPremiumInstallmentToggle((prev) =>
                  prev === installmentToggle ? prev : installmentToggle
                );
              }
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

                    if (
                      button.onClick === "submitForApproval" &&
                      disableSFAForHeld
                    ) {
                      isButtonDisabled = true;
                    }

                    if (button.onClick === "submit") {
                      if (
                        activity?.activityKey === ACTIVITY_KEYS.HELD_COVER_NOTE
                      ) {
                        const currentValues = latestValuesRef.current;
                        const YES = dynamicValues?.TOGGLE_YES;
                        const NO = dynamicValues?.TOGGLE_NO;

                        const hasAnyDeviations =
                          currentValues?.placementSlipDeviationsSection
                            ?.placementSlipDeviationsLid === YES;

                        if (hasAnyDeviations) {
                          const isDeviationAddressed =
                            currentValues?.deviationsAddressedSection
                              ?.deviationsAddressedLid === YES;
                          const isRevisedCoverNoteReceived =
                            currentValues?.deviationsAddressedSection
                              ?.revisedHeldCoverNoteLid === YES;

                          if (
                            !isDeviationAddressed ||
                            !isRevisedCoverNoteReceived
                          ) {
                            isButtonDisabled = true;
                          }
                        }
                      }
                    }

                    if (
                      button.onClick === "submitForApproval" ||
                      button.onClick === "submit"
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

export default HeldCoverNoteActivity;
