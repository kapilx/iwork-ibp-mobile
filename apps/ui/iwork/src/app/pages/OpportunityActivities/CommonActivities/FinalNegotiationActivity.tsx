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
  CustomModal,
  environment,
} from "@ui/ui-lib";
import {
  ADD_QUOTATION_CONFIRMATION,
  ADD_QUOTATION_CONFIRMATION_MESSAGE,
  ALERT_MESSAGES,
  ENDORSEMENT_TOASTS,
  PREPARING,
  THIS_ACTIVITY_WAS_APPROVED_BY,
  VIEW_PDF,
  WAITING_FOR_ACTIVITY_APPROVAL_BY,
} from "../../../constants/index.js";
import {
  transformCDDetailsData,
  transformFinalizedQuoteData,
  transformPremiumData,
} from "../../../constants/transformUtils.js";
import { HTTP_METHODS } from "@ui/ui-lib";
import { calculatePercentageAmountUpdate } from "../../../Utils/calculatePercentageAmountUpdate.js";
import {
  approvalButtonsConfig,
  buttonsConfig,
  onlyApproveButtonConfig,
} from "../Constants/config.js";
import {
  ActivitiesButtonsContainer,
  LoaderContainer,
  CommonActivitiesMainContainer,
  ExportPDFButton,
  QuotationModalContent,
} from "./styles.js";
import { getActivityConfig } from "../Activities/ActivitiesConfigs/index.js";
import {
  AutoPopulateConfig,
  parseNumericInput,
  useAutoPopulateCalculatedFields,
} from "../Constants/autoPopulateFields.js";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils.js";
import { useActivityTasks } from "../hooks/useActivityTasks";
import { buildDocumentsPayload } from "./utils/documents";
import { buildSectionAwareCoverConfig } from "./utils/buildSectionAwareCoverConfig";
import { stripSriLankaBrokerage } from "./utils/stripSriLankaBrokerage";
import {
  ACTIVITY_KEYS,
  ROLE_KEYS,
  APPROVAL_VALUES,
  LEAD_SECTION_CONFIG as LEAD_SECTION_CONFIG_MAP,
  PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS,
  DEVIATION_FIELDS_TO_REMOVE,
  SHARED_INSURER_ACTIVITIES,
  BrokerageFieldSet,
  OPPORTUNITY_ACTIVITY_STATUS,
} from "./constants";
import { TransformedActivity } from "../Constants/activityConstants";
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
  openAccordionByActivityKey?: (activityKey: string) => void;
  setTransformedActivities?: React.Dispatch<
    React.SetStateAction<TransformedActivity[]>
  >;
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

const SHARED_INSURER_ACTIVITY_KEYS = SHARED_INSURER_ACTIVITIES;

const LEAD_SECTION_CONFIG = LEAD_SECTION_CONFIG_MAP;

const PREMIUM_SECTION_PREFILL_MAP = PREMIUM_SECTION_PREFILL_ALLOWED_FIELDS;

// BrokerageFieldSet is now imported from constants

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
      return undefined;
    }

    if (baseNumeric === 0) {
      return undefined;
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

const getBrokerageCalcOptions = (
  changedField: "percentage" | "amount" | undefined,
  isSriLankaUser: boolean
) => ({
  skipCountryCheck: true,
  preferPercentageInput: !isSriLankaUser,
  allowReverseWhenAmountChanged: !isSriLankaUser,
  changedField,
});

const buildBrokerageAutoPopulateConfigs = (
  section: string,
  fieldSet: BrokerageFieldSet
): AutoPopulateConfig[] => {
  const configs: AutoPopulateConfig[] = [];

  const hasTaxBaseOverride = Object.prototype.hasOwnProperty.call(
    fieldSet,
    "taxBase"
  );
  const taxBaseField = hasTaxBaseOverride
    ? fieldSet.taxBase
    : fieldSet.basicBase;

  return configs;
};

const FinalNegotiationAndPlacementSlipGenerationActivity: React.FC<
  CommonActivityProps
> = ({
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
  openAccordionByActivityKey,
  setTransformedActivities,
}) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const submissionInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAppliedInitialNormalizeRef = useRef(false);

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

  const userOrganisationKey = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.organisationKey
    : null;

  const [placementSlipInstallmentDate, setPlacementSlipInstallmentDate] =
    useState<string | null>(null);
  const [placementSlipCdAccountRequired, setPlacementSlipCdAccountRequired] =
    useState<string | null>(null);
  const [placementSlipCdAccountSelected, setPlacementSlipCdAccountSelected] =
    useState<string | null>(null);

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
  const lastFinalNegotiationPrefillKeyRef = useRef<string | null>(null);
  const lastFinalNegotiationLocationRef = useRef<{
    locationId: number | null;
    branchId: number | null;
  } | null>(null);

  const [isFormMounted, setIsFormMounted] = useState(false);

  const [showAddQuoteConfirmModal, setShowAddQuoteConfirmModal] =
    useState(false);

  const isUnsetValue = (value: unknown) =>
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && !Number.isNaN(value) && value === 0);

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
        if (brokerageAutoPopulateConfigs.length > 0) {
          handleAutoPopulateBrokerageAmounts(formValues);
        }
      }, 100);
    }
  };

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

  useEffect(() => {
    hasAppliedInitialNormalizeRef.current = false;
  }, [
    activity?.activityKey,
    activity?.opportunityActivityId,
    getActivityData?.data?.dataActivity,
  ]);

  const currActivityDataFromGlobalState =
    optyActivitiesState[activity?.activityKey];

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

  const shouldPrefillPreferredInsurers = [
    ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION,
    ACTIVITY_KEYS.FINAL_NEGOTIATION,
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

  const placementSlipActivityKey = ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION;
  const isPlacementSlipActivity =
    activity?.activityKey === placementSlipActivityKey ||
    activityMetaData?.activityKey === placementSlipActivityKey;
  const isFinalNegotiationActivity =
    activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION ||
    activityMetaData?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION;

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

  //for post call
  const mutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        endSubmission();
        setIsPutCall(true);
        dispatch(setToastMessage(response?.message));
        if (activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION) {
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
        }
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
    return updated;
  };

  // DEVIATION_FIELDS_TO_REMOVE is imported from constants

  const stripDeviationFields = (data: any) => {
    if (data?.deviationsAddressedSection) {
      DEVIATION_FIELDS_TO_REMOVE.forEach((field) => {
        delete data.deviationsAddressedSection[field];
      });
      delete data.deviationsAddressedSection.deviationSection;
    }
    if (data?.deviationSection) {
      delete data.deviationSection.deviationCoveragesLid;
    }
  };

  const stripWrongSectionBrokerage = (data: any) => {
    if (data?.policyDataWrongSection) {
      delete data.policyDataWrongSection.brokeragePercentage;
      delete data.policyDataWrongSection.brokerageAmount;
    }
  };

  const finalNegotiationDisallowedFields = React.useMemo<
    Record<string, string[]>
  >(
    () =>
      getCountrySpecificConfig(
        {
          selectFinalisedQuote: [
            // "terrorism",
            "totalPremium",
            "totalNetPremium",
          ],
          netPremiumDetails: [
            "netPremium",
            "basicBrokeragePercentage",
            "brokeragePercentage",
          ],
        },
        {
          India: {
            selectFinalisedQuote: [
              // "terrorism",
              "totalPremium",
              "totalNetPremium",
            ],
            netPremiumDetails: [
              "netPremium",
              "basicBrokeragePercentage",
              "brokeragePercentage",
            ],
          },
        }
      ),
    []
  );

  const stripFinalNegotiationDisallowedFields = React.useCallback(
    (data: any) => {
      if (activity?.activityKey !== ACTIVITY_KEYS.FINAL_NEGOTIATION) {
        return;
      }

      Object.entries(finalNegotiationDisallowedFields).forEach(
        ([sectionKey, disallowedFields]) => {
          const section = data?.[sectionKey];
          if (!section) {
            return;
          }

          disallowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(section, field)) {
              delete section[field];
            }
          });
        }
      );
    },
    [activity?.activityKey, finalNegotiationDisallowedFields]
  );

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

  const saveActivity = async () => {
    if (!beginSubmission()) return;
    try {
      if (formRef.current) {
        formRef.current?.clearErrors?.([], true);
        const allValues = formRef.current?.getValues?.() || {};

        const {
          validationButton,
          isPolicyDataWrongConfig,
          documents,
          ...rest
        } = allValues;
        const initialRest = sanitizeParticipantFields(rest);
        let sanitizedRest = cleanEmptyArrayRows(initialRest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripFinalNegotiationDisallowedFields(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey ?? activityMetaData?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        if (!isFinalNegotiationActivity) {
          delete sanitizedRest.quoteDocuments;
        }
        if (
          sanitizedRest?.selectFinalisedQuote ||
          sanitizedRest?.policyDetails
        ) {
          if (sanitizedRest?.selectFinalisedQuote) {
            delete sanitizedRest.selectFinalisedQuote.basicPremiumPercentage;
            delete sanitizedRest.selectFinalisedQuote.brokerageAmount;
            delete sanitizedRest.selectFinalisedQuote.serviceTaxAmount;
            delete sanitizedRest.selectFinalisedQuote.serviceTaxPercentage;
          }
          if (sanitizedRest?.policyDetails) {
            delete sanitizedRest.policyDetails.brokerageAmount;
            delete sanitizedRest.policyDetails.terrorismCommission;
          }
        }
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
          includeQuoteDocuments: isFinalNegotiationActivity,
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
            ...sanitizedRest,
            ...(activity.activityKey !== ACTIVITY_KEYS.OPPORTUNITY_LOST &&
              documentsPayload),
            statusLid: saveStatusData?.data[0]?.id,
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
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        if (sanitizedRest?.policyDataWrongSection) {
          delete sanitizedRest.policyDataWrongSection.premium;
        }
        stripWrongSectionBrokerage(sanitizedRest);
        stripFinalNegotiationDisallowedFields(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey ?? activityMetaData?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        if (sanitizedRest?.selectFinalisedQuote) {
          delete sanitizedRest.selectFinalisedQuote.basicPremiumPercentage;
          delete sanitizedRest.selectFinalisedQuote.brokerageAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxPercentage;
        }
        if (sanitizedRest?.policyDetails) {
          delete sanitizedRest.policyDetails.brokerageAmount;
          delete sanitizedRest.policyDetails.terrorismCommission;
        }

        if (!isFinalNegotiationActivity) {
          delete sanitizedRest.quoteDocuments;
        }
        if (sanitizedRest?.selectFinalisedQuote) {
          delete sanitizedRest.selectFinalisedQuote.basicPremiumPercentage;
          delete sanitizedRest.selectFinalisedQuote.brokerageAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxPercentage;
        }
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
          includeQuoteDocuments: isFinalNegotiationActivity,
        });

        mutation.mutate({
          endpoint: isPutCall
            ? endPoints.updateOpportunityActivity(
                activity.opportunityActivityId
              )
            : endPoints.activityMeta,
          method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
          data: {
            opportunityActivityId: activity.opportunityActivityId,
            ...sanitizedRest,
            ...(activity.activityKey !== ACTIVITY_KEYS.OPPORTUNITY_LOST &&
              documentsPayload),
            statusLid: submitStatusData.data[0].id,
            activityStatusKey: "COMPLETE_ACTIVITY",
          },
        });
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
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripFinalNegotiationDisallowedFields(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey ?? activityMetaData?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        if (!isFinalNegotiationActivity) {
          delete sanitizedRest.quoteDocuments;
        }
        if (sanitizedRest?.selectFinalisedQuote) {
          delete sanitizedRest.selectFinalisedQuote.basicPremiumPercentage;
          delete sanitizedRest.selectFinalisedQuote.brokerageAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxPercentage;
        }
        if (sanitizedRest?.policyDetails) {
          delete sanitizedRest.policyDetails.brokerageAmount;
          delete sanitizedRest.policyDetails.terrorismCommission;
        }

        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
          includeQuoteDocuments: isFinalNegotiationActivity,
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
              ...(activity.activityKey !== ACTIVITY_KEYS.OPPORTUNITY_LOST &&
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
          ...rest
        } = values.result;
        let sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        stripFinalNegotiationDisallowedFields(sanitizedRest);
        stripSriLankaBrokerage({
          data: sanitizedRest,
          isSriLankaUser,
          activityKey: activity?.activityKey ?? activityMetaData?.activityKey,
        });
        sanitizedRest = sanitizeRestForInsurerDetails(sanitizedRest);
        if (!isFinalNegotiationActivity) {
          delete sanitizedRest.quoteDocuments;
        }
        if (sanitizedRest?.selectFinalisedQuote) {
          delete sanitizedRest.selectFinalisedQuote.basicPremiumPercentage;
          delete sanitizedRest.selectFinalisedQuote.brokerageAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxAmount;
          delete sanitizedRest.selectFinalisedQuote.serviceTaxPercentage;
        }
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: sanitizedRest?.quoteDocuments,
          existingDocuments: getActivityData?.data?.dataActivity?.documents,
          existingQuoteDocuments:
            getActivityData?.data?.dataActivity?.quoteDocuments,
          includeQuoteDocuments: isFinalNegotiationActivity,
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
              ...(activity.activityKey !== ACTIVITY_KEYS.OPPORTUNITY_LOST &&
                documentsPayload),
              statusLid: statusData.data[0].id,
              activityStatusKey: actionType,
            },
          },
          {
            onSuccess: (response) => {
              if (
                activity.activityKey ===
                  ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION &&
                actionType === "APPROVE_ACTIVITY"
              ) {
                setIsOpportunityWon(true);
                setOptyActivitiesState((prev) => {
                  const updated = { ...prev };
                  delete updated[activity?.activityKey];
                  return updated;
                });
                shouldSaveOnUnmountRef.current = false;
                setBreadCumbStep((prev) => (prev === null ? 0 : prev + 1));
                setSubmittedBreadCumb((breadCumbSep ?? 0) + 1);
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
  const approve = () =>
    handleApproveReject(approvedStatusData, false, "APPROVE_ACTIVITY");
  const reject = () =>
    handleApproveReject(rejectedStatusData, true, "REJECT_ACTIVITY");
  const submitForApproval = () =>
    submitWithStatus(submitStatusDataForApproval, true);

  const [quoteId, setQuoteId] = useState<number | null>(null);
  const hasAppliedFinalizedQuotePrefill = useRef(false);
  const initialQuotePrefillApplied = useRef(false);
  const hasUserChangedFinalizedQuoteRef = useRef(false);
  const preferredInsurerPrefillApplied = useRef(false);
  const insurerDetailsServerPrefillApplied = useRef(false);
  const lastServerInsurerSnapshotRef = useRef<string | null>(null);
  const resolvePreferredInsurerRows = () => {
    if (!preferredInsurersData) return [];

    const insurerDetailsRows =
      preferredInsurersData?.data?.insurerDetails?.data ??
      preferredInsurersData?.insurerDetails?.data;

    if (Array.isArray(insurerDetailsRows) && insurerDetailsRows.length > 0) {
      return insurerDetailsRows;
    }

    if (isFinalNegotiationActivity) {
      return [];
    }

    const rowsFromApi =
      preferredInsurersData?.data?.data ?? preferredInsurersData?.data ?? [];

    return Array.isArray(rowsFromApi) ? rowsFromApi : [];
  };

  useEffect(() => {
    hasAppliedFinalizedQuotePrefill.current = false;
    initialQuotePrefillApplied.current = false;
    hasUserChangedFinalizedQuoteRef.current = false;
    preferredInsurerPrefillApplied.current = false;
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
      const shouldPrefillAllRows = isPlacementSlipActivity && !onlyLeadRow;
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
        if (
          activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION ||
          activityMetaData?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION
        ) {
          return false;
        }

        const leadParticipationCode = toNumberOrNull(
          dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
        );
        const leadRowFromApi =
          leadParticipationCode !== null
            ? apiRows.find(
                (row: any) =>
                  toNumberOrNull(row?.isLeadInsurer) === leadParticipationCode
              )
            : undefined;

        const fallbackLeadId =
          toNumberOrNull(leadRowFromApi?.insurerId) ??
          toNumberOrNull(apiRows?.[0]?.insurerId);

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
          isLeadInsurer: dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD,
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

      const insurerRows = (() => {
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

      if (insurerRows.length > 1 && leadSectionMeta?.policyPlacedField) {
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

      if (insurerRows.length === 0) {
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
        insurerRows.forEach((preferredRow, index) => {
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

        if (rows.length > insurerRows.length) {
          mergedRows.push(...rows.slice(insurerRows.length));
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
      isPlacementSlipActivity,
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
    const shouldApplyMultiplePrefill = isPlacementSlipActivity;
    if (!shouldApplyMultiplePrefill) {
      return false;
    }
    const insurerRows = resolvePreferredInsurerRows();
    if (!Array.isArray(insurerRows) || insurerRows.length === 0) {
      return false;
    }
    const currentRows = extractInsurerRows(values?.insurerDetails);
    const selectedCount = currentRows.reduce((count, row) => {
      const id = Number(row?.insurerId);
      return Number.isNaN(id) ? count : count + 1;
    }, 0);
    return selectedCount < insurerRows.length;
  };

  const getBasePremiumForInsurerRows = (values?: Record<string, any>) => {
    if (!values) {
      return null;
    }
    return (
      parseNumericInput(values?.selectFinalisedQuote?.basicPremium) ??
      parseNumericInput(values?.policyDetails?.basicPremium) ??
      // parseNumericInput(values?.policyDetails?.totalPremium) ??
      null
    );
  };

  const getTerrorismPremiumForInsurerRows = (values?: Record<string, any>) => {
    if (!values) {
      return null;
    }
    return (
      parseNumericInput(values?.selectFinalisedQuote?.terrorism) ??
      parseNumericInput(values?.policyDetails?.terrorism) ??
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
        const terrorismBrokerageAmount = parseNumericInput(
          row?.terrorismBrokerageAmount
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
  // const cachedInsurerRows = extractInsurerRows(
  //   currActivityDataFromGlobalState?.data?.insurerDetails
  // );

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

    // prefer cached values; else API payload
    const cached = currActivityDataFromGlobalState?.data;
    const apiData = getActivityData?.data?.dataActivity;
    const source =
      hasApiInsurerDetails && apiData ? apiData : cached ?? apiData;
    if (!source) return;

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

    applyFormUpdatesOnce(baseValues, normalized);

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
      const basePremiumForRows = getBasePremiumForInsurerRows(
        currActivityDataFromGlobalState.data
      );
      const terrorismPremiumForRows = getTerrorismPremiumForInsurerRows(
        currActivityDataFromGlobalState.data
      );
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
      applyFormUpdatesOnce(currentValues, normalized);
    }
  }, [
    activity?.activityKey,
    currActivityDataFromGlobalState?.data,
    getActivityData?.data?.dataActivity,
    mergePreferredInsurersIntoData,
    hasApiInsurerDetails,
  ]);

  useEffect(() => {
    if (activity?.activityKey !== ACTIVITY_KEYS.FINAL_NEGOTIATION) {
      return;
    }

    // if (currActivityDataFromGlobalState?.data) {
    //   hasAppliedFinalizedQuotePrefill.current = true;
    //   return;
    // }

    // if (hasAppliedFinalizedQuotePrefill.current) {
    //   return;
    // }

    if (!formRef.current?.isMounted || !getActivityData?.data?.dataActivity) {
      return;
    }

    const transformed = transformFinalizedQuoteData(
      getActivityData.data.dataActivity
    );

    const currentValues = formRef.current?.getValues?.() ?? {};

    const nextValues = {
      ...currentValues,
      quoteTaxDetails:
        transformed.quoteTaxDetails?.length > 0
          ? transformed.quoteTaxDetails
          : [{}],
      netPremiumDetails: transformed.netPremiumDetails ?? {},
      covers: {
        ...(currentValues?.covers ?? {}),
        ...transformed.covers,
      },
      selectFinalisedQuote: {
        ...(currentValues?.selectFinalisedQuote ?? {}),
        ...transformed.selectFinalisedQuote,
      },
    };

    skipNextOnChange.current = true;
    formRef.current?.resetForms(nextValues);
    latestValuesRef.current = nextValues;

    hasAppliedFinalizedQuotePrefill.current = true;
  }, [
    activity?.activityKey,
    // currActivityDataFromGlobalState?.data,
    getActivityData?.data?.dataActivity,
  ]);

  useEffect(() => {
    if (activity?.activityKey !== ACTIVITY_KEYS.FINAL_NEGOTIATION) {
      return;
    }
    if (initialQuotePrefillApplied.current) {
      return;
    }
    if (!isFormMounted || !formRef.current?.getValues) {
      return;
    }
    const currentValues = formRef.current.getValues?.() ?? {};
    const existingQuoteId =
      currentValues?.selectFinalisedQuote?.finalizedQuoteId ??
      getActivityData?.data?.dataActivity?.selectFinalisedQuote
        ?.finalizedQuoteId ??
      null;
    if (
      existingQuoteId === null ||
      existingQuoteId === undefined ||
      existingQuoteId === ""
    ) {
      return;
    }
    const numericQuoteId = Number(existingQuoteId);
    if (Number.isNaN(numericQuoteId)) {
      return;
    }
    setQuoteId((prev) => (prev === numericQuoteId ? prev : numericQuoteId));
    initialQuotePrefillApplied.current = true;
  }, [
    activity?.activityKey,
    isFormMounted,
    getActivityData?.data?.dataActivity?.selectFinalisedQuote?.finalizedQuoteId,
    formRef,
  ]);

  const { data: quoteDataResponse } = useApiQuery({
    queryKey: ["quoteId", quoteId],
    url: endPoints.finalizedQuoteById(Number(quoteId)),
    enabled: !!quoteId, // runs only when quoteId is truthy
  });

  const selectFinalisedQuoteSnapshot = useMemo(() => {
    const responseData = quoteDataResponse?.data;
    const fromResponse =
      responseData?.selectFinalisedQuote ??
      responseData?.data?.selectFinalisedQuote ??
      null;

    if (fromResponse) {
      return fromResponse;
    }

    const fallbackValues =
      latestValuesRef.current ?? formRef.current?.getValues?.() ?? {};
    return fallbackValues?.selectFinalisedQuote ?? {};
  }, [quoteDataResponse]);

  const finalizedQuoteInsurerId = toNumberOrNull(
    selectFinalisedQuoteSnapshot?.insurerId
  );
  const finalizedQuoteLocationId = toNumberOrNull(
    selectFinalisedQuoteSnapshot?.insurerLocationId
  );

  const { data: insurerByIdResponse } = useApiQuery({
    queryKey: ["insurerById", finalizedQuoteInsurerId],
    url: finalizedQuoteInsurerId
      ? endPoints.insurerById(Number(finalizedQuoteInsurerId))
      : "",
    enabled: isFinalNegotiationActivity && !!finalizedQuoteInsurerId,
  });

  const currentActivityKey = activityMetaData?.activityKey ?? "";
  const isSharedInsurerActivity =
    SHARED_INSURER_ACTIVITY_KEYS.has(currentActivityKey);
  const leadSectionMeta =
    LEAD_SECTION_CONFIG[
      currentActivityKey as keyof typeof LEAD_SECTION_CONFIG
    ] ?? LEAD_SECTION_CONFIG.placement_slip_generation_activity;
  const latestLeadSectionValues =
    latestValuesRef.current?.[leadSectionMeta.sectionKey];
  const hasRbacExportPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EXPORT_OPTY_ACTIVITY)(state)
  );
  const isExportAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

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

      if (
        group.key === "quoteDocuments" &&
        activityMetaData?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION &&
        Array.isArray(group.config)
      ) {
        finalGroup = {
          ...group,
          config: group.config.map((subField: any) => {
            if (
              subField.type === "documentupload" &&
              subField.key === "documents"
            ) {
              return {
                ...subField,
                opportunityId,
                opportunityActivityId: activity.opportunityActivityId,
                componentProps: {
                  ...(subField.componentProps || {}),
                  documents:
                    getActivityData?.data?.dataActivity?.quoteDocuments || [],
                  isDownloadAllowed: isExportAllowed,
                  isDocumentRequired: activity.isDocumentMandatory ?? subField.componentProps?.isDocumentRequired,
                  isDocumentTypeRequired: activity.isDocumentMandatory ?? subField.componentProps?.isDocumentTypeRequired,
                },
              };
            }
            return subField;
          }),
        };
      }

      return finalGroup;
    });

    return enhancedConfig;
  }, [
    activityMetaData,
    dynamicValues,
    getActivityData,
    latestLeadSectionValues?.[leadSectionMeta.leadInsurerField],
    placementSlipInstallmentDate,
    placementSlipCdAccountRequired,
    placementSlipCdAccountSelected,
    lockFirstInsurer,
    isSharedInsurerActivity,
    insurerPrefillVersion,
    leadInsurerSelectionVersion,
    insurerDetailsVersion,
    isExportAllowed,
    activity.isDocumentMandatory,
  ]);

  useEffect(() => {
    if (!isSharedInsurerActivity) {
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
      if (brokerageAutoPopulateConfigs.length > 0) {
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
  ]);

  useEffect(() => {
    if (
      !isPlacementSlipActivity ||
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
    isPlacementSlipActivity,
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
      case ACTIVITY_KEYS.FINAL_NEGOTIATION: {
        const netPremiumBaseFields = isSriLankaUser
          ? [
              "selectFinalisedQuote.basicPremium",
              "selectFinalisedQuote.srccAmount",
              "selectFinalisedQuote.terrorism",
            ]
          : [
              "selectFinalisedQuote.basicPremium",
              "selectFinalisedQuote.terrorism",
            ];
        const gstAmountFields = isSriLankaUser
          ? [
              "selectFinalisedQuote.netPremium",
              "selectFinalisedQuote.adminCharges",
              "selectFinalisedQuote.other",
              "selectFinalisedQuote.cessAmount",
              "selectFinalisedQuote.fee",
              "selectFinalisedQuote.gstPercentage",
            ]
          : ["selectFinalisedQuote.netPremium", "selectFinalisedQuote.gstPercentage"];
        const totalBrokerageFields = [
          "selectFinalisedQuote.basicBrokerageAmount",
          "selectFinalisedQuote.tcBrokerageAmount",
          "selectFinalisedQuote.srccBrokerageAmount",
          "selectFinalisedQuote.fee",
        ];

        const configs: AutoPopulateConfig[] = [
          {
            target: "selectFinalisedQuote.netPremium",
            fields: netPremiumBaseFields,
            compute: ({ values }) => {
              const sectionValues = values?.selectFinalisedQuote;
              const terrorism = parseNumericInput(sectionValues?.terrorism);
              const basicPremiumAmount = parseNumericInput(
                sectionValues?.basicPremium
              );
              const srccPremiumAmount = parseNumericInput(
                sectionValues?.srccAmount
              );

              if (
                terrorism === null &&
                basicPremiumAmount === null &&
                srccPremiumAmount === null
              ) {
                return "";
              }
              const calculatedNetPremium = Number(
                (
                  (terrorism ?? 0) +
                  (basicPremiumAmount ?? 0) +
                  (srccPremiumAmount ?? 0)
                ).toFixed(4)
              );

              // Check if current value matches calculated value to avoid unnecessary updates
              const currentNetPremium = parseNumericInput(
                sectionValues?.netPremium
              );
              if (
                currentNetPremium !== null &&
                Math.abs(currentNetPremium - calculatedNetPremium) < 0.01
              ) {
                return undefined; // No update needed
              }

              return calculatedNetPremium;
            },
          },
          {
            target: "selectFinalisedQuote.gstAmount",
            fields: gstAmountFields,
            compute: ({ values }) => {
              if (getActiveFieldKey() === "gstAmount") {
                return undefined;
              }
              const sectionValues = values?.selectFinalisedQuote;
              const gstPercentage = parseNumericInput(
                sectionValues?.gstPercentage
              );

              if (gstPercentage === null) {
                return "";
              }

              const netPremium = parseNumericInput(sectionValues?.netPremium);
              if (!isSriLankaUser) {
                if (netPremium === null) {
                  return "";
                }
                return Number(((netPremium * gstPercentage) / 100).toFixed(4));
              }

              const adminCharges = parseNumericInput(
                sectionValues?.adminCharges
              );
              const other = parseNumericInput(sectionValues?.other);
              const cessAmount = parseNumericInput(sectionValues?.cessAmount);
              const fee = parseNumericInput(sectionValues?.fee);
              const hasAnyBase = [
                netPremium,
                adminCharges,
                other,
                cessAmount,
                fee,
              ].some((value) => value !== null);

              if (!hasAnyBase) {
                return "";
              }

              const baseCharges =
                (netPremium ?? 0) +
                (adminCharges ?? 0) +
                (other ?? 0) +
                (cessAmount ?? 0) +
                (fee ?? 0);

              return Number(((baseCharges * gstPercentage) / 100).toFixed(4));
            },
          },
          // NOTE: No reverse `selectFinalisedQuote.gstPercentage` auto-populate
          // target here. Pairing it with the gstAmount target above creates a
          // circular amount<->percentage feedback loop that oscillates and
          // settles on a doubled value on prefill. The amount->percentage
          // direction is owned by applyTaxCalculation (onChange). This mirrors
          // the stable placement-slip (policyDetails) config.
          // {
          //   target: "selectFinalisedQuote.totalGrossPremiumIncTax",
          //   fields: baseFields,
          // },
          {
            target: "selectFinalisedQuote.grossPremium",
            fields: isSriLankaUser
              ? [
                  "selectFinalisedQuote.netPremium",
                  "selectFinalisedQuote.gstAmount",
                  "selectFinalisedQuote.adminCharges",
                  "selectFinalisedQuote.other",
                  "selectFinalisedQuote.cessAmount",
                  "selectFinalisedQuote.fee",
                ]
              : [
                  "selectFinalisedQuote.netPremium",
                  "selectFinalisedQuote.gstAmount",
                ],
          },
          // Commented out - now using createBrokerageAutoPopulateConfig for reverse calculation
          // {
          //   target: "selectFinalisedQuote.tcBrokerageAmount",
          //   fields: [
          //     "selectFinalisedQuote.terrorism",
          //     "selectFinalisedQuote.terrorismBrokeragePercentage",
          //   ],
          //   compute: ({ values }) => {
          //     const sectionValues = values?.selectFinalisedQuote;
          //     const terrorism = parseNumericInput(sectionValues?.terrorism);
          //     const brokeragePercentage = parseNumericInput(
          //       sectionValues?.terrorismBrokeragePercentage
          //     );

          //     if (terrorism === null || brokeragePercentage === null) {
          //       return "";
          //     }

          //     return Number(
          //       ((terrorism * brokeragePercentage) / 100).toFixed(4)
          //     );
          //   },
          // },
          // {
          //   target: "selectFinalisedQuote.srccBrokerageAmount",
          //   fields: [
          //     "selectFinalisedQuote.srccAmount",
          //     "selectFinalisedQuote.srccPercentage",
          //   ],
          //   compute: ({ values }) => {
          //     const srccAmount = parseNumericInput(
          //       values?.selectFinalisedQuote?.srccAmount
          //     );
          //     const srccPercentage = parseNumericInput(
          //       values?.selectFinalisedQuote?.srccPercentage
          //     );

          //     // If srccPercentage or srccAmount is null, clear the amount field
          //     if (srccPercentage === null || srccAmount === null) {
          //       return "";
          //     }

          //     const computedAmount = Number(
          //       ((srccAmount * srccPercentage) / 100).toFixed(4)
          //     );

          //     const currentAmount = parseNumericInput(
          //       values?.selectFinalisedQuote?.srccBrokerageAmount
          //     );

          //     if (
          //       currentAmount !== null &&
          //       Math.abs(currentAmount - computedAmount) < 0.01
          //     ) {
          //       return undefined;
          //     }

          //     return computedAmount;
          //   },
          // },
          {
            target: "selectFinalisedQuote.totalBrokerageAmount",
            fields: totalBrokerageFields,
            compute: ({ values }) => {
              const basicBrokerageAmount = parseNumericInput(
                values?.selectFinalisedQuote?.basicBrokerageAmount
              );
              const tcBrokerageAmount = parseNumericInput(
                values?.selectFinalisedQuote?.tcBrokerageAmount
              );
              const srccBrokerageAmount = parseNumericInput(
                values?.selectFinalisedQuote?.srccBrokerageAmount
              );
              const feeAmount = parseNumericInput(
                values?.selectFinalisedQuote?.fee
              );

              const total =
                (basicBrokerageAmount ?? 0) +
                (tcBrokerageAmount ?? 0) +
                (srccBrokerageAmount ?? 0) +
                (feeAmount ?? 0);

              const finalValue = Number(total.toFixed(4));

              // const currentTotal = parseNumericInput(
              //   values?.selectFinalisedQuote?.totalBrokerageAmount
              // );

              return finalValue;
            },
          },
        ];

        return configs;
      }
      case ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION: {
        const netPremiumBaseFields = isSriLankaUser
          ? [
              "policyDetails.basicPremium",
              "policyDetails.srccAmount",
              "policyDetails.terrorism",
            ]
          : ["policyDetails.basicPremium", "policyDetails.terrorism"];
        const chargeFields = [
          "policyDetails.adminCharges",
          "policyDetails.other",
          "policyDetails.cessAmount",
          "policyDetails.fee",
        ];
        const grossPremiumFields = isSriLankaUser
          ? [
              "policyDetails.netPremium",
              ...chargeFields,
              "policyDetails.gstAmount",
            ]
          : ["policyDetails.netPremium", "policyDetails.gstAmount"];
        const gstAmountFields = isSriLankaUser
          ? [
              "policyDetails.netPremium",
              ...chargeFields,
              "policyDetails.gstPercentage",
            ]
          : ["policyDetails.netPremium", "policyDetails.gstPercentage"];

        const totalBrokerageFields = [
          "policyDetails.basicBrokerageAmount",
          "policyDetails.srccBrokerageAmount",
          "policyDetails.tcBrokerageAmount",
          "policyDetails.fee",
        ];

        return [
          {
            target: "policyDetails.netPremium",
            fields: netPremiumBaseFields,
            compute: ({ values }) => {
              const sectionValues = values?.policyDetails;
              const basicPremium = parseNumericInput(
                sectionValues?.basicPremium
              );
              const terrorism = parseNumericInput(
                sectionValues?.terrorism ??
                  sectionValues?.terrorismAmount ??
                  sectionValues?.terrorismCommission
              );
              const srccAmount = isSriLankaUser
                ? parseNumericInput(sectionValues?.srccAmount)
                : null;
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
            target: "policyDetails.totalInstallmentAmount",
            fields: [
              "policyDetails.basicPremium",
              "policyDetails.terrorism",
              "policyDetails.srccAmount",
              "policyDetails.other",
            ],
            compute: ({ values }) => {
              const sectionValues = values?.policyDetails;
              const basicPremium = parseNumericInput(
                sectionValues?.basicPremium
              );
              const terrorism = parseNumericInput(sectionValues?.terrorism);
              const srccAmount = isSriLankaUser
                ? parseNumericInput(sectionValues?.srccAmount)
                : null;
              const other = parseNumericInput(sectionValues?.other);

              const hasAnyBase = [
                basicPremium,
                terrorism,
                srccAmount,
                other,
              ].some((value) => value !== null);

              if (!hasAnyBase) {
                return "";
              }

              return Number(
                (
                  (basicPremium ?? 0) +
                  (terrorism ?? 0) +
                  (srccAmount ?? 0) +
                  (other ?? 0)
                ).toFixed(4)
              );
            },
          },
          {
            target: "policyDetails.gstAmount",
            fields: gstAmountFields,
            compute: ({ values }) => {
              if (getActiveFieldKey() === "gstAmount") {
                return undefined;
              }
              const sectionValues = values?.policyDetails;
              const gstPercentage = parseNumericInput(
                sectionValues?.gstPercentage
              );

              if (gstPercentage === null) {
                return "";
              }

              if (!isSriLankaUser) {
                const netPremium = parseNumericInput(sectionValues?.netPremium);
                if (netPremium === null) {
                  return "";
                }
                return Number(((netPremium * gstPercentage) / 100).toFixed(4));
              }

              const netPremium = parseNumericInput(sectionValues?.netPremium);
              const adminCharges = parseNumericInput(
                sectionValues?.adminCharges
              );
              const other = parseNumericInput(sectionValues?.other);
              const cessAmount = parseNumericInput(sectionValues?.cessAmount);
              const fee = parseNumericInput(sectionValues?.fee);
              const hasAnyBase = [
                netPremium,
                adminCharges,
                other,
                cessAmount,
                fee,
              ].some((value) => value !== null);

              if (!hasAnyBase) {
                return "";
              }

              const baseCharges =
                (netPremium ?? 0) +
                (adminCharges ?? 0) +
                (other ?? 0) +
                (cessAmount ?? 0) +
                (fee ?? 0);

              return Number(((baseCharges * gstPercentage) / 100).toFixed(4));
            },
          },
          // basicBrokerageAmount now handled via calculatePercentageAmountUpdate
          // Commented out - now using createBrokerageAutoPopulateConfig for reverse calculation
          // {
          //   target: "policyDetails.tcBrokerageAmount",
          //   fields: [
          //     "policyDetails.terrorism",
          //     "policyDetails.terrorismBrokeragePercentage",
          //   ],
          //   compute: ({ values }) => {
          //     const sectionValues = values?.policyDetails;
          //     const terrorism = parseNumericInput(sectionValues?.terrorism);
          //     const brokeragePercentage = parseNumericInput(
          //       sectionValues?.terrorismBrokeragePercentage
          //     );

          //     if (terrorism === null || brokeragePercentage === null) {
          //       return "";
          //     }

          //     return Number(
          //       ((terrorism * brokeragePercentage) / 100).toFixed(4)
          //     );
          //   },
          // },
          // srccBrokerageAmount now handled via calculatePercentageAmountUpdate
          {
            target: "policyDetails.grossPremium",
            fields: grossPremiumFields,
            compute: ({ values }) => {
              const sectionValues = values?.policyDetails;
              const netPremium = parseNumericInput(sectionValues?.netPremium);

              if (!isSriLankaUser) {
                const gstAmount = parseNumericInput(sectionValues?.gstAmount);
                if (netPremium === null || gstAmount === null) {
                  return "";
                }
                return Number(
                  ((netPremium ?? 0) + (gstAmount ?? 0)).toFixed(4)
                );
              }

              const adminCharges = parseNumericInput(
                sectionValues?.adminCharges
              );
              const other = parseNumericInput(sectionValues?.other);
              const cessAmount = parseNumericInput(sectionValues?.cessAmount);
              const fee = parseNumericInput(sectionValues?.fee);
              const gstAmount = parseNumericInput(sectionValues?.gstAmount);
              const hasAnyBase = [
                netPremium,
                adminCharges,
                other,
                cessAmount,
                fee,
                gstAmount,
              ].some((value) => value !== null);

              if (!hasAnyBase) {
                return "";
              }

              return Number(
                (
                  (netPremium ?? 0) +
                  (adminCharges ?? 0) +
                  (other ?? 0) +
                  (cessAmount ?? 0) +
                  (fee ?? 0) +
                  (gstAmount ?? 0)
                ).toFixed(4)
              );
            },
          },
          {
            target: "policyDetails.totalBrokerageAmount",
            fields: totalBrokerageFields,
            compute: ({ values }) => {
              const sectionValues = values?.policyDetails;
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
    // Removed Sri Lanka user restriction - now works for all users
    const buildConfigs = (section: string, fieldSet: BrokerageFieldSet) =>
      buildBrokerageAutoPopulateConfigs(section, fieldSet);

    switch (activityMetaData?.activityKey) {
      case ACTIVITY_KEYS.FINAL_NEGOTIATION:
        return buildConfigs("selectFinalisedQuote", {
          basicBase: "basicPremium",
          srccBase: "srccAmount",
          tcBase: "terrorism",
          taxBase: "netPremium",
        });
      case ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION:
        return buildConfigs("policyDetails", {
          basicBase: "basicPremium",
          srccBase: "srccAmount",
          tcBase: "terrorism",
          taxBase: "grossPremium",
        });
      default:
        return [];
    }
  }, [activityMetaData?.activityKey]);

  const forceEnableAutoPopulate =
    [
      ACTIVITY_KEYS.FINAL_NEGOTIATION,
      ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION,
    ].includes(activityMetaData?.activityKey ?? "");

  const handleAutoPopulateGrossPremium = useAutoPopulateCalculatedFields(
    formRef,
    grossPremiumAutoPopulateConfigs,
    {
      onBeforeSetValues: autoPopulateBeforeSetValues,
      forceEnable: forceEnableAutoPopulate,
    }
  );
  const handleAutoPopulateBrokerageAmounts = useAutoPopulateCalculatedFields(
    formRef,
    brokerageAutoPopulateConfigs,
    {
      forceEnable: true,
    }
  );
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const [cdDetailsId, setCdDetailsId] = useState<number | null>(null);

  const { data: cdDetailsResponse } = useApiQuery({
    queryKey: ["cdDetailsId", cdDetailsId],
    url: endPoints.getCdDetailsById(Number(cdDetailsId)),
    enabled: !!cdDetailsId,
  });

  const premiumPrefillActivities = useMemo(
    () => [ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION],
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
    if (!isPlacementSlipActivity) {
      return;
    }
    const policyPlacedField = leadSectionMeta.policyPlacedField;
    if (!policyPlacedField) {
      return;
    }
    const insurerRows = resolvePreferredInsurerRows();
    if (!Array.isArray(insurerRows) || insurerRows.length <= 1) {
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
    isPlacementSlipActivity,
    leadSectionMeta.policyPlacedField,
    leadSectionMeta.sectionKey,
    insurerPrefillVersion,
    userChangedPolicyPlacedTypeRef,
  ]);

  useEffect(() => {
    if (cdDetailsResponse) {
      let res = {};

      const getValues = formRef?.current?.getValues?.();
      res = transformCDDetailsData(cdDetailsResponse.data);

      const resetData = {
        ...getValues,
        cdAccountDetails: {
          ...getValues?.cdAccountDetails,
          ...res,
        },
      };
      formRef.current?.resetForms(resetData);
    }
  }, [cdDetailsResponse]);

  useEffect(() => {
    if (activity?.activityKey !== ACTIVITY_KEYS.FINAL_NEGOTIATION) {
      return;
    }

    if (!hasUserChangedFinalizedQuoteRef.current) {
      return;
    }

    if (!quoteDataResponse?.data || !formRef?.current?.setValues) {
      return;
    }

    const transformed = transformFinalizedQuoteData(quoteDataResponse.data);
    const currentValues = formRef.current?.getValues?.() ?? {};
    const nextSelectFinalisedQuote = {
      ...(currentValues?.selectFinalisedQuote ?? {}),
      ...(transformed.selectFinalisedQuote ?? {}),
    };
    if (
      currentValues?.selectFinalisedQuote?.finalizedVersionId &&
      !nextSelectFinalisedQuote.finalizedVersionId
    ) {
      nextSelectFinalisedQuote.finalizedVersionId =
        currentValues.selectFinalisedQuote.finalizedVersionId;
    }

    const nextValues = {
      ...currentValues,
      quoteTaxDetails:
        transformed.quoteTaxDetails?.length > 0
          ? transformed.quoteTaxDetails
          : currentValues?.quoteTaxDetails ?? [{}],
      netPremiumDetails: {
        ...(currentValues?.netPremiumDetails || {}),
        ...(transformed.netPremiumDetails || {}),
      },
      covers: {
        ...(currentValues?.covers ?? {}),
        ...transformed.covers,
      },
      selectFinalisedQuote: nextSelectFinalisedQuote,
    };

    // const leadInsurerIdForPrefill = getLeadInsurerIdFromValues(nextValues);
    // if (
    //   activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION &&
    //   leadInsurerIdForPrefill
    // ) {
    //   mergePreferredInsurersIntoData(
    //     nextValues,
    //     Number(leadInsurerIdForPrefill),
    //     { force: true }
    //   );
    // }

    skipNextOnChange.current = true;
    formRef.current.resetForms(nextValues);
    latestValuesRef.current = nextValues;

    // Manually trigger auto-populate calculations after form reset
    setTimeout(() => {
      skipNextOnChange.current = false; // Reset flag before triggering calculations
      if (formRef.current?.isMounted && handleAutoPopulateGrossPremium) {
        const currentValues = formRef.current.getValues();
        handleAutoPopulateGrossPremium(currentValues);
      }
    }, 100); // Increased timeout to ensure form state stabilizes
  }, [
    activity?.activityKey,
    quoteDataResponse,
    formRef,
    handleAutoPopulateGrossPremium,
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
        if (value === null || value === undefined) {
          return;
        }
        const current = currentSection[key];
        if (isUnsetValue(current)) {
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

  // Auto-calculate net premium on initial form load
  useEffect(() => {
    const autoCalculateInitialPremium = () => {
      if (!isFormMounted || !formRef.current) {
        return;
      }

      const currentValues = formRef.current.getValues?.();
      if (!currentValues?.policyDetails) {
        return;
      }

      const isPlacementSlip =
        currentActivityKey === ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION;
      if (!isPlacementSlip) {
        return;
      }

      const basicPremium =
        parseNumericInput(currentValues.policyDetails.basicPremium) ?? 0;
      const srccAmount =
        parseNumericInput(currentValues.policyDetails.srccAmount) ?? 0;
      const terrorismAmount =
        parseNumericInput(
          currentValues.policyDetails.terrorism ??
            currentValues.policyDetails.terrorismAmount ??
            currentValues.policyDetails.terrorismCommission
        ) ?? 0;

      const calculatedNetPremium = isSriLankaUser
        ? basicPremium + srccAmount + terrorismAmount
        : basicPremium + terrorismAmount;

      const currentNetPremium =
        parseNumericInput(currentValues.policyDetails.netPremium) ?? 0;

      // Only update if the calculated value is different and greater than 0
      if (
        calculatedNetPremium > 0 &&
        Math.abs(calculatedNetPremium - currentNetPremium) > 0.01
      ) {
        const updates = {
          policyDetails: {
            ...currentValues.policyDetails,
            netPremium: calculatedNetPremium,
          },
        };
        applyFormUpdatesOnce(currentValues, updates);
      }
    };

    // Run after a short delay to ensure form is fully initialized
    const timeoutId = setTimeout(autoCalculateInitialPremium, 100);
    return () => clearTimeout(timeoutId);
  }, [
    isFormMounted,
    formRef,
    currentActivityKey,
    isSriLankaUser,
    activity?.activityKey,
    dynamicValues,
  ]);

  const fetchCDDetails = (changedValue: any) => {
    const selectedCdDetailsId = changedValue?.value;
    if (selectedCdDetailsId) {
      setCdDetailsId(selectedCdDetailsId);
    } else {
      console.error("Invalid cd details id", changedValue);
    }
  };

  const getOptyActivityState = () => {
    return {
      ...optyActivitiesState,
      [activity?.activityKey]: {
        key: activity?.activityKey,
        data: latestValuesRef.current,
      },
    };
  };

  const qouteGenerationReport = () => {
    navigate(
      `/opportunities/quotecomparison/${activity.opportunityActivityId}`,
      {
        state: {
          originPath: `/opportunities/${opportunityId}`,
          accordionStep: breadCumbSep,
          opportunityId: opportunityId,
          optyActivitiesState: getOptyActivityState(),
        },
      }
    );
  };

  const [statusLidState, setStatusLid] = useState<number | null>(null);

  const effectiveStatusLid = statusLidState ?? activityMetaData?.statusLid;

  const opportunityInitialStatus = opportunityActivityStatus?.find(
    (status: any) => status.id === effectiveStatusLid
  )?.lookUpKey;

  const handleFinalizedQuoteSelection = (
    changedValue: any,
    formValues: any
  ) => {
    const rawValue =
      typeof changedValue === "object" && changedValue !== null
        ? changedValue.value
        : changedValue;

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      setQuoteId(null);
      hasUserChangedFinalizedQuoteRef.current = false;
      return;
    }

    const parsedQuoteId = Number(rawValue);
    if (Number.isNaN(parsedQuoteId)) {
      setQuoteId(null);
      hasUserChangedFinalizedQuoteRef.current = false;
      return;
    }

    setQuoteId(parsedQuoteId);
    hasUserChangedFinalizedQuoteRef.current = true;
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

  const hasAddQuotationPermission = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ADD_QUOTATION)(state)
  );

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
    MeetingsTable,
    MeetingFormDrawer,
    isAllMeetingsCompleted,
    isMeetingDetailsLoading,
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

  const INSURER_DETAILS_CLEAR_FIELDS = [
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

  const clearInsurerDetailsNumericFields = (
    rows: any[],
    isSinglePlacement: boolean
  ) => {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row, index) => {
      const nextRow = { ...(row || {}) };
      INSURER_DETAILS_CLEAR_FIELDS.forEach((field) => {
        nextRow[field] = null;
      });
      nextRow.sharePercentage = isSinglePlacement ? 100 : null;
      if (nextRow.isLeadInsurer == null) {
        nextRow.isLeadInsurer =
          index === 0
            ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
            : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO;
      }
      return nextRow;
    });
  };

  const clearInsurerDetailsOnPolicyPlacedToggle = (
    rows: any[],
    isSinglePlacement: boolean
  ) => {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row, index) => ({
      insurerId: row?.insurerId ?? null,
      insurerLocationId: row?.insurerLocationId ?? null,
      insurerBranchId: row?.insurerBranchId ?? null,
      insurerContactId: null,
      sharePercentage: isSinglePlacement ? 100 : null,
      shareAmount: null,
      brokeragePercentage: null,
      brokerageAmount: null,
      terrorismBrokeragePercentage: null,
      terrorismBrokerageAmount: null,
      totalBrokerageAmount: null,
      isLeadInsurer:
        index === 0
          ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
          : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO,
    }));
  };

  const buildInsurerDetailsValue = (existingDetails: any, rows: any[]) => {
    if (Array.isArray(existingDetails)) {
      return rows;
    }
    if (
      existingDetails &&
      typeof existingDetails === "object" &&
      Array.isArray((existingDetails as any).retArray)
    ) {
      return {
        ...(existingDetails as any),
        retArray: rows,
      };
    }
    return rows;
  };

  useEffect(() => {
    if (!isFinalNegotiationActivity) {
      return;
    }
    if (!finalizedQuoteInsurerId) {
      return;
    }
    const addresses =
      insurerByIdResponse?.data?.insurerAddresses ??
      insurerByIdResponse?.data?.data?.insurerAddresses ??
      [];
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return;
    }
    const matchedAddress =
      addresses.find(
        (address: any) =>
          finalizedQuoteLocationId !== null &&
          finalizedQuoteLocationId !== undefined &&
          Number(address?.cityId?.id) === Number(finalizedQuoteLocationId)
      ) ?? addresses[0];

    const nextLocationId = toNumberOrNull(matchedAddress?.cityId?.id);
    const nextBranchId = toNumberOrNull(matchedAddress?.id);
    lastFinalNegotiationLocationRef.current = {
      locationId: nextLocationId,
      branchId: nextBranchId,
    };
    const keyParts = [
      finalizedQuoteInsurerId,
      finalizedQuoteLocationId ?? "null",
      nextLocationId ?? "null",
      nextBranchId ?? "null",
    ].join("|");

    if (lastFinalNegotiationPrefillKeyRef.current === keyParts) {
      return;
    }

    const baseValues =
      Object.keys(latestValuesRef.current || {}).length > 0
        ? latestValuesRef.current
        : formRef.current?.getValues?.() ?? {};

    const leadSectionKey = leadSectionMeta.sectionKey;
    const leadInsurerFieldName = leadSectionMeta.leadInsurerField;
    const existingLeadSection = baseValues?.[leadSectionKey] ?? {};
    const updates: Record<string, any> = {};

    if (
      leadInsurerFieldName &&
      existingLeadSection?.[leadInsurerFieldName] !== finalizedQuoteInsurerId
    ) {
      updates[leadSectionKey] = {
        ...existingLeadSection,
        [leadInsurerFieldName]: finalizedQuoteInsurerId,
      };
    }

    const existingDetails = baseValues?.insurerDetails;
    const rows = extractInsurerRows(existingDetails);
    const nextRows =
      rows.length > 0 ? [...rows] : [buildDefaultInsurerRow(baseValues, true)];

    nextRows[0] = {
      ...(nextRows[0] || {}),
      insurerId: finalizedQuoteInsurerId,
      insurerLocationId: nextLocationId,
      insurerBranchId: nextBranchId,
    };

    if (Array.isArray(existingDetails)) {
      updates.insurerDetails = nextRows;
    } else if (
      existingDetails &&
      typeof existingDetails === "object" &&
      Array.isArray((existingDetails as any).retArray)
    ) {
      updates.insurerDetails = {
        ...(existingDetails as any),
        retArray: nextRows,
      };
    } else {
      updates.insurerDetails = nextRows;
    }

    if (Object.keys(updates).length === 0) {
      lastFinalNegotiationPrefillKeyRef.current = keyParts;
      return;
    }

    applyFormUpdatesOnce(baseValues, updates);
    lastFinalNegotiationPrefillKeyRef.current = keyParts;
  }, [
    isFinalNegotiationActivity,
    finalizedQuoteInsurerId,
    finalizedQuoteLocationId,
    insurerByIdResponse,
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    applyFormUpdatesOnce,
  ]);

  useEffect(() => {
    if (!isFinalNegotiationActivity || !finalizedQuoteInsurerId) {
      return;
    }
    if (!isFormMounted || !formRef.current?.getValues) {
      return;
    }
    const leadSectionKey = leadSectionMeta.sectionKey;
    const leadInsurerFieldName = leadSectionMeta.leadInsurerField;
    if (!leadInsurerFieldName) {
      return;
    }
    const currentValues = formRef.current.getValues?.() ?? {};
    const currentLeadInsurerId =
      currentValues?.[leadSectionKey]?.[leadInsurerFieldName];

    if (!isUnsetValue(currentLeadInsurerId)) {
      return;
    }

    applyFormUpdatesOnce(currentValues, {
      [leadSectionKey]: {
        ...(currentValues?.[leadSectionKey] ?? {}),
        [leadInsurerFieldName]: finalizedQuoteInsurerId,
      },
    });
  }, [
    isFinalNegotiationActivity,
    finalizedQuoteInsurerId,
    leadSectionMeta.sectionKey,
    leadSectionMeta.leadInsurerField,
    isFormMounted,
    leadInsurerSelectionVersion,
    applyFormUpdatesOnce,
  ]);

  useEffect(() => {
    if (!isFinalNegotiationActivity || !finalizedQuoteInsurerId) {
      return;
    }
    if (!isFormMounted || !formRef.current?.getValues) {
      return;
    }

    const currentValues = formRef.current.getValues?.() ?? {};
    const currentDetails = currentValues?.insurerDetails;
    const rows = extractInsurerRows(currentDetails);
    if (!Array.isArray(rows) || rows.length === 0) {
      return;
    }

    const firstRow = rows[0] || {};
    if (Number(firstRow?.insurerId) !== Number(finalizedQuoteInsurerId)) {
      return;
    }

    const stored = lastFinalNegotiationLocationRef.current;
    if (!stored) {
      return;
    }

    const needsLocation = isUnsetValue(firstRow?.insurerLocationId);
    const needsBranch = isUnsetValue(firstRow?.insurerBranchId);

    if (!needsLocation && !needsBranch) {
      return;
    }

    const nextRows = [...rows];
    nextRows[0] = {
      ...firstRow,
      insurerLocationId: needsLocation
        ? stored.locationId
        : firstRow?.insurerLocationId,
      insurerBranchId: needsBranch
        ? stored.branchId
        : firstRow?.insurerBranchId,
    };

    const updates: Record<string, any> = {};
    if (Array.isArray(currentDetails)) {
      updates.insurerDetails = nextRows;
    } else if (
      currentDetails &&
      typeof currentDetails === "object" &&
      Array.isArray((currentDetails as any).retArray)
    ) {
      updates.insurerDetails = {
        ...(currentDetails as any),
        retArray: nextRows,
      };
    } else {
      updates.insurerDetails = nextRows;
    }

    applyFormUpdatesOnce(currentValues, updates);
  }, [
    isFinalNegotiationActivity,
    finalizedQuoteInsurerId,
    isFormMounted,
    insurerDetailsVersion,
    leadInsurerSelectionVersion,
    applyFormUpdatesOnce,
  ]);

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

    let hasChanges = false;

    const updatedRows = rows.map((row, index) => {
      const sharePct = parseNumericInput(row?.sharePercentage);
      const currentShareAmount = parseNumericInput(row?.shareAmount);

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

  const addQuoteMutation = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(setToastMessage("Quote activities updated successfully"));

        // Update activity states to reflect the new status (only Enter Quote)
        setOptyActivitiesState((prevState) => {
          // Ensure prevState is an array
          const stateArray = Array.isArray(prevState) ? prevState : [];

          const updatedState = stateArray.map((activity) => {
            if (activity.activityKey === ACTIVITY_KEYS.QUOTE_ENTRY) {
              return {
                ...activity,
                activityStatus: "In Progress",
                statusKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
              };
            }
            return activity;
          });

          return updatedState;
        });

        if (setTransformedActivities) {
          setTransformedActivities((prev) =>
            prev.map((activity) => {
              if (
                activity.activityKey === ACTIVITY_KEYS.QUOTE_ENTRY ||
                activity.activityKey === "quote_comparison_report_activity"
              ) {
                return {
                  ...activity,
                  activityStatus: "In Progress",
                };
              }
              return activity;
            })
          );
        }

        openAccordionByActivityKey?.(ACTIVITY_KEYS.QUOTE_ENTRY);
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Failed to update quote activities";
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleAddQuoteClick = () => {
    setShowAddQuoteConfirmModal(true);
  };

  const handleConfirmAddQuote = () => {
    if (!activity?.opportunityActivityId) {
      dispatch(setToastMessage("Activity ID not found"));
      setShowAddQuoteConfirmModal(false);
      return;
    }

    // Close modal immediately
    setShowAddQuoteConfirmModal(false);

    addQuoteMutation.mutate({
      endpoint: endPoints.addQuoteFromFinalNegotiation(
        activity.opportunityActivityId
      ),
      method: HTTP_METHODS.POST,
      data: undefined,
    });
  };

  const handleCancelAddQuote = () => {
    setShowAddQuoteConfirmModal(false);
  };

  const actionMap = {
    saveActivity,
    submit,
    handleFinalizedQuoteSelection,
    submitForApproval,
    approve,
    reject,
    fetchCDDetails,
    handleAddQuoteClick,
  };

  const handleFileDownload = async () => {
    if (!activity?.opportunityActivityId) return;

    const policyId = getActivityData?.data?.policyId;

    if (!policyId) {
      dispatch(setToastMessage("Policy details unavailable for download."));
      return;
    }

    setIsPdfDownloading(true);

    // Pre-open a tab synchronously (NO noopener here so we can still access it)
    const newTab = window.open("about:blank", "_blank"); // keep a live handle
    if (newTab) {
      // Minimal loading shell so the tab isn't considered empty
      newTab.document.write(
        "<!doctype html><title>Opening PDF…</title><body style='font-family:system-ui;padding:16px'>Preparing your PDF…</body>"
      );
      newTab.document.close();
    }

    try {
      // 1) Get placement slip data
      const placementSlipResponse = await apiRequest(
        endPoints.placementSlipData,
        {
          method: HTTP_METHODS.POST,
          data: { policyId },
        }
      );

      const placementSlipData =
        placementSlipResponse?.data?.data ??
        placementSlipResponse?.data ??
        placementSlipResponse;

      if (
        !placementSlipData ||
        typeof placementSlipData !== "object" ||
        Object.keys(placementSlipData).length === 0
      ) {
        dispatch(
          setToastMessage(
            "Unable to fetch placement slip data. Please try again."
          )
        );
        newTab?.close?.();
        return;
      }

      // 2) Ask backend for the presigned PDF URL
      const response = await apiRequest(endPoints.placementSlipPdf, {
        method: HTTP_METHODS.POST,
        data: { fileName: "placement-slip", data: placementSlipData },
        responseType: "json",
      });

      // API shape: { status: 201, message: "...", data: "<presigned-url>" }
      const pdfUrl: string | undefined =
        response?.data?.data ??
        (typeof response?.data === "string" ? response.data : undefined);

      if (!pdfUrl) {
        dispatch(setToastMessage("Download failed — PDF link not received."));
        newTab?.close?.();
        return;
      }

      if (newTab) {
        // Prevent reverse tabnabbing AFTER we have a handle
        try {
          newTab.opener = null;
        } catch {}
        // Use replace so the blank page isn't in history
        newTab.location.replace(pdfUrl);
        // As a final fallback, render a clickable link in the new tab
        setTimeout(() => {
          try {
            if (newTab.location.href === "about:blank") {
              newTab.document.body.innerHTML = `<a href="${pdfUrl}" style="font-family:system-ui" target="_self" rel="noreferrer">Click here if your PDF didn’t open</a>`;
            }
          } catch {
            /* no-op */
          }
        }, 700);
      } else {
        // If pre-open failed, try anchor fallback
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.target = "_blank";
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      newTab?.close?.();
      dispatch(
        setToastMessage("Unable to open placement slip. Please try again.")
      );
    } finally {
      setIsPdfDownloading(false);
    }
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
          {activity?.activityKey === ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION &&
            opportunityInitialStatus ===
              OPPORTUNITY_ACTIVITY_STATUS.APPROVED &&
            isExportAllowed && (
              <ExportPDFButton
                onClick={handleFileDownload}
                variantType="secondary"
                size="small"
                disabled={isPdfDownloading}
              >
                {isPdfDownloading ? PREPARING : VIEW_PDF}
              </ExportPDFButton>
            )}

          <NestedDynamicForm
            config={resolvedConfig.map((group: any) => {
              // Inject dynamic button state for Add Quote button in selectFinalisedQuote section header
              if (
                group.key === "selectFinalisedQuote" &&
                activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION &&
                Array.isArray(group.renderActions)
              ) {
                return {
                  ...group,
                  renderActions: group.renderActions
                    .filter((action: any) => {
                      // Filter out Add Quote button if user doesn't have permission
                      if (action.key === "addQuoteButton") {
                        return hasAddQuotationPermission;
                      }
                      return true;
                    })
                    .map((action: any) => {
                      if (action.key === "addQuoteButton") {
                        return {
                          ...action,
                          componentProps: {
                            ...(action.componentProps || {}),
                            disabled:
                              addQuoteMutation.isPending ||
                              !canEditActivity ||
                              isFormDisabled,
                          },
                          text: addQuoteMutation.isPending
                            ? "Processing..."
                            : action.text,
                        };
                      }
                      return action;
                    }),
                };
              }
              return group;
            })}
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
                    const currentRows = extractInsurerRows(
                      values?.insurerDetails
                    );
                    const baseRows =
                      currentRows.length > 0
                        ? currentRows
                        : [buildDefaultInsurerRow(values, !isMultiple)];

                    const clearedRows = clearInsurerDetailsOnPolicyPlacedToggle(
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
                    formRef.current?.setValues?.({
                      insurerDetails: nextDetails,
                    });
                    latestValuesRef.current = {
                      ...values,
                      insurerDetails: nextDetails,
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

              // const isInitialLoad = !hasAppliedInitialNormalizeRef.current;

              //for localisation refactor in the future
              if (
                grossPremiumAutoPopulateConfigs.length > 0 &&
                values
                // !isInitialLoad
              ) {
                handleAutoPopulateGrossPremium(values);
              }

              // Removed Sri Lanka user restriction - now works for all users
              if (
                brokerageAutoPopulateConfigs.length > 0 &&
                values
                // !isInitialLoad
              ) {
                handleAutoPopulateBrokerageAmounts(values);
              }

              let shouldResetDeviationSections = false;
              let shouldResetAnyDeviationSections = false;
              let shouldResetRevisedDeviationSections = false;
              const prevValues = latestValuesRef.current || {};
              let updatedValues = values;

              const updates: Record<string, any> = {};

              let requiresFormReset = false;

              if (isSharedInsurerActivity) {
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
                const policyPlacedTypeChanged = prevPlaced !== currPlaced;

                const insurerRowCountNow = extractInsurerRows(
                  values?.insurerDetails
                ).length;
                const preferredRowCount = resolvePreferredInsurerRows().length;
                const hasMultiInsurersFromServerOrPrefill =
                  insurerRowCountNow > 1 ||
                  preferredRowCount > 1 ||
                  hasApiInsurerDetails;

                if (
                  policyPlacedTypeChanged &&
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
                const prevLeadPays = prevLeadSectionValues?.[leadPaysFieldName];
                const currLeadPays =
                  getLeadSectionSnapshot()?.[leadPaysFieldName];
                const leadPaysChanged = prevLeadPays !== currLeadPays;

                const prevLeadInsurerId =
                  prevLeadSectionValues?.[leadInsurerFieldName];
                let currLeadInsurerId =
                  getLeadSectionSnapshot()?.[leadInsurerFieldName];

                if (
                  isPlacementSlipActivity &&
                  leadInsurerFieldName &&
                  isUnsetValue(currLeadInsurerId) &&
                  !isUnsetValue(prevLeadInsurerId)
                ) {
                  applyLeadSectionUpdates({
                    [leadInsurerFieldName]: prevLeadInsurerId,
                  });
                  currLeadInsurerId = prevLeadInsurerId;
                }

                if (prevLeadInsurerId !== currLeadInsurerId) {
                  lastLeadInsurerIdRef.current =
                    currLeadInsurerId === null ||
                    currLeadInsurerId === undefined ||
                    currLeadInsurerId === ""
                      ? null
                      : Number(currLeadInsurerId);
                  setLeadInsurerSelectionVersion((prev) => prev + 1);
                }

                const wasLeadInsurerCleared =
                  prevLeadInsurerId != null &&
                  prevLeadInsurerId !== "" &&
                  (currLeadInsurerId === null ||
                    currLeadInsurerId === undefined ||
                    currLeadInsurerId === "");

                const isFinalNegotiation =
                  activity?.activityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION ||
                  activityMetaData?.activityKey ===
                    ACTIVITY_KEYS.FINAL_NEGOTIATION;
                const storedFinalNegotiationLocation =
                  isFinalNegotiation && finalizedQuoteInsurerId
                    ? lastFinalNegotiationLocationRef.current
                    : null;
                const emptyLocationFallback = {
                  insurerLocationId: null,
                  insurerBranchId: null,
                };
                const finalNegotiationLocationFallback =
                  storedFinalNegotiationLocation
                    ? {
                        insurerLocationId:
                          storedFinalNegotiationLocation.locationId,
                        insurerBranchId:
                          storedFinalNegotiationLocation.branchId,
                      }
                    : emptyLocationFallback;

                if (
                  isFinalNegotiation &&
                  wasLeadInsurerCleared &&
                  leadInsurerFieldName &&
                  finalizedQuoteInsurerId
                ) {
                  applyLeadSectionUpdates({
                    [leadInsurerFieldName]: finalizedQuoteInsurerId,
                  });
                }

                if (policyPlacedTypeChanged) {
                  const currentRows = extractInsurerRows(
                    values?.insurerDetails
                  );
                  const fallbackRow = {
                    ...buildDefaultInsurerRow(values, !isMultiple),
                    ...(isFinalNegotiation && finalizedQuoteInsurerId
                      ? {
                          insurerId: finalizedQuoteInsurerId,
                          ...finalNegotiationLocationFallback,
                        }
                      : {}),
                  };
                  const baseRows =
                    currentRows.length > 0 ? currentRows : [fallbackRow];
                  const clearedRows = clearInsurerDetailsOnPolicyPlacedToggle(
                    baseRows,
                    !isMultiple
                  );
                  const nextRows = !isMultiple ? [clearedRows[0]] : clearedRows;
                  updates.insurerDetails = buildInsurerDetailsValue(
                    values?.insurerDetails,
                    nextRows
                  );
                  values = {
                    ...values,
                    insurerDetails: updates.insurerDetails,
                  };
                  requiresFormReset = true;

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

                  const shouldApplyMultiplePrefill = isPlacementSlipActivity;
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
                      const normalizedFirstRowInsurerId =
                        toNumberOrNull(firstRowInsurerId);
                      const normalizedLeadInsurerId = resolvedLeadInsurerId;
                      const needsPopulation =
                        normalizedFirstRowInsurerId === null ||
                        normalizedLeadInsurerId === null ||
                        normalizedFirstRowInsurerId !== normalizedLeadInsurerId;

                      if (needsPopulation) {
                        const locationFallback =
                          isFinalNegotiation &&
                          finalizedQuoteInsurerId &&
                          Number(leadInsurerId) ===
                            Number(finalizedQuoteInsurerId)
                            ? finalNegotiationLocationFallback
                            : emptyLocationFallback;
                        updates.insurerDetails = [
                          ...currentInsurerDetailsArray,
                        ];
                        updates.insurerDetails[0] = {
                          ...updates.insurerDetails[0],
                          insurerId: leadInsurerId,
                          ...locationFallback,
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

                if (wasLeadInsurerCleared && !isFinalNegotiation) {
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
                  applyLeadInsurerSync(true);

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

                    if (hasChanges) {
                      updates.insurerDetails = updatedRows;
                      values = {
                        ...values,
                        insurerDetails: updatedRows,
                      };
                    }
                  }
                }

                if (leadSectionMeta.leadInsurerField) {
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
                      const locationFallback =
                        isFinalNegotiation &&
                        finalizedQuoteInsurerId &&
                        Number(leadInsurerId) ===
                          Number(finalizedQuoteInsurerId)
                          ? finalNegotiationLocationFallback
                          : emptyLocationFallback;
                      const fixed = [...currentList];
                      fixed[0] = {
                        ...fixed[0],
                        insurerId: leadInsurerId,
                        ...locationFallback,
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

                if (!policyPlacedTypeChanged) {
                  prefillNonLeadRows();
                }
              }

              const totalPremium =
                Number(
                  activityMetaData?.activityKey ===
                    ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
                    ? values?.policyDetails?.totalPremium ??
                        values?.policyDetails?.basicPremium
                    : values?.policyDetails?.totalPremium
                ) || 0;
              const brokeragePercentage =
                parseNumericInput(values?.policyDetails?.basicBrokeragePercentage) ??
                0;
              const brokerageAmount =
                parseNumericInput(values?.policyDetails?.basicBrokerageAmount) ??
                0;

              const prevTotalPremium =
                Number(
                  activityMetaData?.activityKey ===
                    ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
                    ? prevValues?.policyDetails?.totalPremium ??
                        prevValues?.policyDetails?.basicPremium
                    : prevValues?.policyDetails?.totalPremium
                ) || 0;
              const prevPercentage =
                parseNumericInput(
                  prevValues?.policyDetails?.basicBrokeragePercentage
                ) ?? 0;
              const prevAmount =
                parseNumericInput(
                  prevValues?.policyDetails?.basicBrokerageAmount
                ) ?? 0;
              const basicChangedField = resolveChangedField(
                brokeragePercentage,
                brokerageAmount,
                prevPercentage,
                prevAmount
              );

              const isPlacementSlip =
                currentActivityKey === ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION;

              const brokerageBase =
                parseNumericInput(values?.policyDetails?.basicPremium) ?? 0;

              const prevBrokerageBase =
                parseNumericInput(prevValues?.policyDetails?.basicPremium) ?? 0;

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
                      changedField: basicChangedField,
                    }
                  : getBrokerageCalcOptions(basicChangedField, isSriLankaUser)
              );
              if (brokerageUpdate) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  ...brokerageUpdate,
                };
              }

              const terrorismPercentage =
                Number(values?.policyDetails?.terrorismBrokeragePercentage) || 0;
              const terrorismAmount =
                Number(values?.policyDetails?.tcBrokerageAmount) || 0;
              const terrorismBase = isPlacementSlip
                ? parseNumericInput(
                    values?.policyDetails?.terrorism ??
                      values?.policyDetails?.terrorismAmount ??
                      values?.policyDetails?.terrorismCommission
                  ) ?? 0
                : brokerageBase;
              const prevTerrorismBase = isPlacementSlip
                ? parseNumericInput(
                    prevValues?.policyDetails?.terrorism ??
                      prevValues?.policyDetails?.terrorismAmount ??
                      prevValues?.policyDetails?.terrorismCommission
                  ) ?? 0
                : prevBrokerageBase;
              const prevTerrorismPercentage =
                Number(
                  prevValues?.policyDetails?.terrorismBrokeragePercentage
                ) || 0;
              const prevTerrorismAmount =
                Number(prevValues?.policyDetails?.tcBrokerageAmount) || 0;

              const terrorismBrokerageUpdate =
                calculatePercentageAmountUpdate(
                  terrorismBase,
                  terrorismPercentage,
                  terrorismAmount,
                  prevTerrorismBase,
                  prevTerrorismPercentage,
                  prevTerrorismAmount,
                  "terrorismBrokeragePercentage",
                  "tcBrokerageAmount",
                  getBrokerageCalcOptions(
                    resolveChangedField(
                      terrorismPercentage,
                      terrorismAmount,
                      prevTerrorismPercentage,
                      prevTerrorismAmount
                    ),
                    isSriLankaUser
                  )
                );

              if (terrorismBrokerageUpdate) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  ...terrorismBrokerageUpdate,
                };
              }

              const srccPercentage =
                parseNumericInput(values?.policyDetails?.srccPercentage) ?? 0;
              const srccAmount =
                parseNumericInput(values?.policyDetails?.srccBrokerageAmount) ??
                0;
              const srccBase =
                parseNumericInput(values?.policyDetails?.srccAmount) ?? 0;
              const prevSrccPercentage =
                parseNumericInput(prevValues?.policyDetails?.srccPercentage) ??
                0;
              const prevSrccAmount =
                parseNumericInput(
                  prevValues?.policyDetails?.srccBrokerageAmount
                ) ?? 0;
              const prevSrccBase =
                parseNumericInput(prevValues?.policyDetails?.srccAmount) ?? 0;

              const srccChangedField = resolveChangedField(
                srccPercentage,
                srccAmount,
                prevSrccPercentage,
                prevSrccAmount
              );

              const srccBrokerageUpdate = calculatePercentageAmountUpdate(
                srccBase,
                srccPercentage,
                srccAmount,
                prevSrccBase,
                prevSrccPercentage,
                prevSrccAmount,
                "srccPercentage",
                "srccBrokerageAmount",
                isSriLankaUser
                  ? {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: srccChangedField,
                    }
                  : getBrokerageCalcOptions(srccChangedField, isSriLankaUser)
              );

              if (srccBrokerageUpdate) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  ...srccBrokerageUpdate,
                };
              }

              const mergedPolicyDetails = {
                ...(values?.policyDetails || {}),
                ...(updates.policyDetails || {}),
              };

              const basicBrokerageAmount =
                Number(mergedPolicyDetails?.basicBrokerageAmount) || 0;
              const terrorismBrokerageAmount =
                Number(mergedPolicyDetails?.tcBrokerageAmount) || 0;
              const totalBrokerage = Number(
                (basicBrokerageAmount + terrorismBrokerageAmount).toFixed(4)
              );

              const prevTotalBrokerage = Number(
                (Number(prevValues?.policyDetails?.basicBrokerageAmount) || 0) +
                  (Number(prevValues?.policyDetails?.tcBrokerageAmount) || 0)
              );

              if (totalBrokerage !== prevTotalBrokerage) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  brokerageAmount: totalBrokerage,
                };
              }

              if (currentActivityKey === ACTIVITY_KEYS.FINAL_NEGOTIATION) {
                const selectValues = values?.selectFinalisedQuote || {};
                const prevSelectValues = prevValues?.selectFinalisedQuote || {};
                const selectBase =
                  parseNumericInput(selectValues?.basicPremium) ?? 0;
                const selectPercent =
                  parseNumericInput(
                    selectValues?.basicBrokeragePercentage
                  ) ?? 0;
                const selectAmount =
                  parseNumericInput(selectValues?.basicBrokerageAmount) ?? 0;
                const prevSelectBase =
                  parseNumericInput(prevSelectValues?.basicPremium) ?? 0;
                const prevSelectPercent =
                  parseNumericInput(
                    prevSelectValues?.basicBrokeragePercentage
                  ) ?? 0;
                const prevSelectAmount =
                  parseNumericInput(prevSelectValues?.basicBrokerageAmount) ?? 0;
                const selectChangedField = resolveChangedField(
                  selectPercent,
                  selectAmount,
                  prevSelectPercent,
                  prevSelectAmount
                );

                const selectBrokerageUpdate = calculatePercentageAmountUpdate(
                  selectBase,
                  selectPercent,
                  selectAmount,
                  prevSelectBase,
                  prevSelectPercent,
                  prevSelectAmount,
                  "basicBrokeragePercentage",
                  "basicBrokerageAmount",
                  isSriLankaUser
                    ? {
                        skipCountryCheck: true,
                        preferPercentageInput: true,
                        allowReverseWhenAmountChanged: true,
                        changedField: selectChangedField,
                      }
                    : getBrokerageCalcOptions(selectChangedField, isSriLankaUser)
                );

                if (selectBrokerageUpdate) {
                  updates.selectFinalisedQuote = {
                    ...(updates.selectFinalisedQuote || selectValues || {}),
                    ...selectBrokerageUpdate,
                  };
                }

                const selectSrccPercentage =
                  parseNumericInput(selectValues?.srccPercentage) ?? 0;
                const selectSrccAmount =
                  parseNumericInput(selectValues?.srccBrokerageAmount) ?? 0;
                const selectSrccBase =
                  parseNumericInput(selectValues?.srccAmount) ?? 0;
                const prevSelectSrccPercentage =
                  parseNumericInput(prevSelectValues?.srccPercentage) ?? 0;
                const prevSelectSrccAmount =
                  parseNumericInput(prevSelectValues?.srccBrokerageAmount) ?? 0;
                const prevSelectSrccBase =
                  parseNumericInput(prevSelectValues?.srccAmount) ?? 0;

                const selectSrccChangedField = resolveChangedField(
                  selectSrccPercentage,
                  selectSrccAmount,
                  prevSelectSrccPercentage,
                  prevSelectSrccAmount
                );

                const selectSrccBrokerageUpdate =
                  calculatePercentageAmountUpdate(
                    selectSrccBase,
                    selectSrccPercentage,
                    selectSrccAmount,
                    prevSelectSrccBase,
                    prevSelectSrccPercentage,
                    prevSelectSrccAmount,
                    "srccPercentage",
                    "srccBrokerageAmount",
                    isSriLankaUser
                      ? {
                          skipCountryCheck: true,
                          preferPercentageInput: true,
                          allowReverseWhenAmountChanged: true,
                          changedField: selectSrccChangedField,
                        }
                      : getBrokerageCalcOptions(
                          selectSrccChangedField,
                          isSriLankaUser
                        )
                  );

                if (selectSrccBrokerageUpdate) {
                  updates.selectFinalisedQuote = {
                    ...(updates.selectFinalisedQuote || selectValues || {}),
                    ...selectSrccBrokerageUpdate,
                  };
                }

                const terrorismPercentage =
                  Number(selectValues?.terrorismBrokeragePercentage) || 0;
                const terrorismAmount =
                  Number(selectValues?.tcBrokerageAmount) || 0;
                const prevTerrorismPercentage =
                  Number(prevSelectValues?.terrorismBrokeragePercentage) || 0;
                const prevTerrorismAmount =
                  Number(prevSelectValues?.tcBrokerageAmount) || 0;
                const selectTerrorismBase =
                  parseNumericInput(selectValues?.terrorism) ?? 0;
                const prevSelectTerrorismBase =
                  parseNumericInput(prevSelectValues?.terrorism) ?? 0;

                const terrorismBrokerageUpdate =
                  calculatePercentageAmountUpdate(
                    selectTerrorismBase,
                    terrorismPercentage,
                    terrorismAmount,
                    prevSelectTerrorismBase,
                    prevTerrorismPercentage,
                    prevTerrorismAmount,
                    "terrorismBrokeragePercentage",
                    "tcBrokerageAmount",
                    {
                      skipCountryCheck: true,
                      changedField: resolveChangedField(
                        terrorismPercentage,
                        terrorismAmount,
                        prevTerrorismPercentage,
                        prevTerrorismAmount
                      ),
                    }
                  );

                if (terrorismBrokerageUpdate) {
                  updates.selectFinalisedQuote = {
                    ...(updates.selectFinalisedQuote || selectValues || {}),
                    ...terrorismBrokerageUpdate,
                  };
                }

                const mergedSelectValues = {
                  ...(selectValues || {}),
                  ...(updates.selectFinalisedQuote || {}),
                };

                const selectBasicBrokerageAmount =
                  Number(mergedSelectValues?.basicBrokerageAmount) || 0;
                const selectTerrorismBrokerageAmount =
                  Number(mergedSelectValues?.tcBrokerageAmount) || 0;
                const totalSelectBrokerage = Number(
                  (
                    selectBasicBrokerageAmount + selectTerrorismBrokerageAmount
                  ).toFixed(4)
                );

                const prevSelectBrokerageTotal = Number(
                  (Number(prevSelectValues?.basicBrokerageAmount) || 0) +
                    (Number(prevSelectValues?.tcBrokerageAmount) || 0)
                );

                if (totalSelectBrokerage !== prevSelectBrokerageTotal) {
                  updates.selectFinalisedQuote = {
                    ...(updates.selectFinalisedQuote || selectValues || {}),
                    totalBrokerageAmount: totalSelectBrokerage,
                    brokerageAmount: totalSelectBrokerage,
                  };
                }
              }

              if (isSriLankaUser) {
                const applySriLankaVatUpdate = (
                  sectionKey: "selectFinalisedQuote" | "policyDetails"
                ) => {
                  if (
                    activityMetaData?.activityKey ===
                      ACTIVITY_KEYS.FINAL_NEGOTIATION &&
                    !hasAppliedFinalizedQuotePrefill.current
                  ) {
                    return;
                  }
                  const sectionValues = {
                    ...(values?.[sectionKey] || {}),
                    ...(updates[sectionKey] || {}),
                  };
                  const prevSectionValues = prevValues?.[sectionKey] || {};

                  const parseOrZero = (input: any) =>
                    parseNumericInput(input) ?? 0;

                  const currentNetPremium =
                    parseOrZero(sectionValues.netPremium) ||
                    parseOrZero(sectionValues.totalPremium) ||
                    parseOrZero(sectionValues.basicPremium);

                  const prevNetPremium =
                    parseOrZero(prevSectionValues.netPremium) ||
                    parseOrZero(prevSectionValues.totalPremium) ||
                    parseOrZero(prevSectionValues.basicPremium);

                  const vatBase =
                    currentNetPremium +
                    parseOrZero(sectionValues.adminCharges) +
                    parseOrZero(sectionValues.other) +
                    parseOrZero(sectionValues.cessAmount) +
                    parseOrZero(sectionValues.fee);

                  const prevVatBase =
                    prevNetPremium +
                    parseOrZero(prevSectionValues.adminCharges) +
                    parseOrZero(prevSectionValues.other) +
                    parseOrZero(prevSectionValues.cessAmount) +
                    parseOrZero(prevSectionValues.fee);

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
                        vatChangedField === "amount" && prevHasVatValues,
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

                if (
                  activityMetaData?.activityKey ===
                  ACTIVITY_KEYS.FINAL_NEGOTIATION
                ) {
                  applySriLankaVatUpdate("selectFinalisedQuote");
                } else if (
                  activityMetaData?.activityKey ===
                  ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
                ) {
                  applySriLankaVatUpdate("policyDetails");
                }
              }

              if (!isSriLankaUser && !disableServiceTaxAutoCalculation) {
                const applyTaxCalculation = (
                  sectionKey: "policyDetails" | "selectFinalisedQuote",
                  percentageKey: string,
                  amountKey: string
                ) => {
                  const sectionValues = {
                    ...(values?.[sectionKey] || {}),
                    ...(updates[sectionKey] || {}),
                  };
                  const prevSectionValues = prevValues?.[sectionKey] || {};

                  const percentageValue =
                    parseNumericInput(sectionValues?.[percentageKey]) ?? 0;
                  const amountValue =
                    parseNumericInput(sectionValues?.[amountKey]) ?? 0;
                  const prevPercentageValue =
                    parseNumericInput(prevSectionValues?.[percentageKey]) ?? 0;
                  const prevAmountValue =
                    parseNumericInput(prevSectionValues?.[amountKey]) ?? 0;

                  const resolveIndianNetPremium = (values: any) => {
                    const basicPremium = parseNumericInput(
                      values?.basicPremium
                    );
                    const terrorism = parseNumericInput(
                      values?.terrorism ??
                        values?.terrorismAmount ??
                        values?.terrorismCommission
                    );
                    if (basicPremium === null && terrorism === null) {
                      return null;
                    }
                    return Number(((basicPremium ?? 0) + (terrorism ?? 0)).toFixed(4));
                  };

                  const pickTaxBase = (values: any) => {
                    const netPremium =
                      parseNumericInput(values?.netPremium) ??
                      parseNumericInput(values?.totalPremium);
                    if (isSriLankaUser) {
                      return (
                        netPremium ??
                        parseNumericInput(values?.basicPremium) ??
                        0
                      );
                    }
                    const derivedNetPremium = resolveIndianNetPremium(values);
                    if (derivedNetPremium === null) {
                      return (
                        netPremium ??
                        parseNumericInput(values?.basicPremium) ??
                        0
                      );
                    }
                    if (netPremium === null) {
                      return derivedNetPremium;
                    }
                    return Math.abs(netPremium - derivedNetPremium) > 0.01
                      ? derivedNetPremium
                      : netPremium;
                  };

                  const serviceTaxBase = pickTaxBase(sectionValues);
                  const prevServiceTaxBase = pickTaxBase(prevSectionValues);

                  const serviceTaxUpdate = calculatePercentageAmountUpdate(
                    serviceTaxBase,
                    percentageValue,
                    amountValue,
                    prevServiceTaxBase,
                    prevPercentageValue,
                    prevAmountValue,
                    percentageKey,
                    amountKey,
                    {
                      skipCountryCheck: true,
                      preferPercentageInput: true,
                      allowReverseWhenAmountChanged: true,
                      changedField: resolveChangedField(
                        percentageValue,
                        amountValue,
                        prevPercentageValue,
                        prevAmountValue
                      ),
                    }
                  );

                  if (serviceTaxUpdate) {
                    updates[sectionKey] = {
                      ...(updates[sectionKey] || values?.[sectionKey] || {}),
                      ...serviceTaxUpdate,
                    };
                  }
                };

                // const policyDetailsPercentageKey = isSriLankaUser
                //   ? "gstPercentage"
                //   : "gstPercentage";
                // const policyDetailsAmountKey = isSriLankaUser
                //   ? "gstAmount"
                //   : "gstAmount";

                applyTaxCalculation(
                  "policyDetails",
                  "gstPercentage",
                  "gstAmount"
                );

                if (
                  activityMetaData?.activityKey ===
                  ACTIVITY_KEYS.FINAL_NEGOTIATION
                ) {
                  // const selectPercentageKey = isSriLankaUser
                  //   ? "serviceTaxPercentage"
                  //   : "gstPercentage";
                  // const selectAmountKey = isSriLankaUser
                  //   ? "serviceTaxAmount"
                  //   : "gstAmount";

                  applyTaxCalculation(
                    "selectFinalisedQuote",
                    "gstPercentage",
                    "gstAmount"
                  );
                }
              }

              const areNumbersClose = (a: number, b: number, epsilon = 0.01) =>
                Math.abs(a - b) < epsilon;

              if (
                activityMetaData?.activityKey ===
                ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
              ) {
                const mergedPolicyDetails = {
                  ...(values?.policyDetails || {}),
                  ...(updates.policyDetails || {}),
                };

                const basicPremium =
                  parseNumericInput(mergedPolicyDetails?.basicPremium) ?? 0;
                const srccAmountPlacement =
                  parseNumericInput(mergedPolicyDetails?.srccAmount) ?? 0;
                const terrorismAmountPlacement =
                  parseNumericInput(
                    mergedPolicyDetails?.terrorism ??
                      mergedPolicyDetails?.terrorismAmount ??
                      mergedPolicyDetails?.terrorismCommission
                  ) ?? 0;

                const netPremiumPlacement = isSriLankaUser
                  ? basicPremium +
                    srccAmountPlacement +
                    terrorismAmountPlacement
                  : basicPremium + terrorismAmountPlacement;
                const prevTotalPremiumPlacement =
                  Number(prevValues?.policyDetails?.netPremium) || 0;
                const currentTotalPremiumPlacement =
                  Number(mergedPolicyDetails?.netPremium) || 0;

                if (
                  !areNumbersClose(
                    netPremiumPlacement,
                    prevTotalPremiumPlacement
                  ) ||
                  !areNumbersClose(
                    netPremiumPlacement,
                    currentTotalPremiumPlacement
                  )
                ) {
                  updates.policyDetails = {
                    ...(updates.policyDetails || values.policyDetails),
                    netPremium: netPremiumPlacement,
                  };
                }
              }

              if (
                activityMetaData?.activityKey ===
                ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
              ) {
                const toggleYes = String(dynamicValues?.TOGGLE_YES ?? "");
                const toggleNo = String(dynamicValues?.TOGGLE_NO ?? "");
                const prevInstallmentToggle = String(
                  prevValues?.policyDetails?.isPremiumInstallmentBased ?? ""
                );
                const currInstallmentToggle = String(
                  values?.policyDetails?.isPremiumInstallmentBased ?? ""
                );

                if (
                  prevInstallmentToggle === toggleYes &&
                  currInstallmentToggle === toggleNo
                ) {
                  updates.installmentDetails = [
                    {
                      installmentDate: null,
                      installmentNetAmount: null,
                      installmentSequence: null,
                      installmentPercentage: null,
                    },
                  ];
                  updates.installmentDates = [
                    {
                      firstInstallmentDate: null,
                      installmentAmount: null,
                    },
                  ];
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

              if (
                activityMetaData?.activityKey ===
                ACTIVITY_KEYS.PLACEMENT_SLIP_GENERATION
              ) {
                const installmentDate =
                  updatedValues?.policyDetails?.isPremiumInstallmentBased;
                setPlacementSlipInstallmentDate(installmentDate);

                const cdAccountRequired =
                  updatedValues?.cdAccountDetails?.paymentTypeLid;
                setPlacementSlipCdAccountRequired(cdAccountRequired);

                const cdAccountSelected =
                  updatedValues?.cdAccountDetails?.selectCdAccount;
                setPlacementSlipCdAccountSelected(cdAccountSelected);
              }
            }}
          />
          {/* Tasks Section */}
          {TasksTable()}
          {TaskFormDrawer()}
          {/* Notes Section */}
          {NotesTable()}
          {NoteFormDrawer()}
          {/* Meetings Section - Only for specific activities */}
          {shouldShowMeetings && (
            <>
              {MeetingsTable()}
              {MeetingFormDrawer()}
            </>
          )}
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

                    // Additional condition to disable button for data validation activity at initial step
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

          <CustomModal
            open={showAddQuoteConfirmModal}
            handleClose={handleCancelAddQuote}
            heading={ADD_QUOTATION_CONFIRMATION}
            buttons={[
              {
                label: "Cancel",
                onClick: handleCancelAddQuote,
                variant: "secondary",
                disabled: addQuoteMutation.isPending,
              },
              {
                label: addQuoteMutation.isPending
                  ? "Processing..."
                  : "Yes, Add Quote",
                onClick: handleConfirmAddQuote,
                variant: "primary",
                disabled: addQuoteMutation.isPending,
              },
            ]}
            headingStyles={{
              fontWeight: 500,
              color: "#111111",
            }}
            modalBoxStyles={{
              width: "30%",
            }}
          >
            <QuotationModalContent>
              {ADD_QUOTATION_CONFIRMATION_MESSAGE}
            </QuotationModalContent>
          </CustomModal>
        </>
      )}
    </CommonActivitiesMainContainer>
  );
};

export default FinalNegotiationAndPlacementSlipGenerationActivity;
