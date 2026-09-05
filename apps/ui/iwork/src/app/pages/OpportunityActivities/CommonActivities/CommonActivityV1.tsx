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
  NestedGroupedDataCollectionHandle,
  useApiQuery,
  useApiMutation,
  setToastMessage,
  apiRequest,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
  FeatureKey,
  formatDate,
  cleanEmptyArrayRows,
  CommonAGGrid,
  environment,
} from "@ui/ui-lib";
import TaskMeetingNotesForm, {
  TaskMeetingNotesTabs,
  TaskMeetingNotesTabKey,
} from "../../TaskMeetingNotesPage/TaskMeetingNotesForm";
import {
  ALERT_MESSAGES,
  CREATE_TASK,
  DEVIATION_TASK_NAMES,
  ENDORSEMENT_TOASTS,
  NO_TASKS_AVAILABLE,
  PREPARING,
  TASKS,
  THIS_ACTIVITY_WAS_APPROVED_BY,
  VIEW_PDF,
  WAITING_FOR_ACTIVITY_APPROVAL_BY,
} from "../../../constants";
import { IsgHandoverAssignment } from "./BdToIsgHandoverBanner";
import { transformPremiumData } from "../../../constants/transformUtils";
import { HTTP_METHODS } from "@ui/ui-lib";
import {
  approvalButtonsConfig,
  buttonsConfig,
  onlyApproveButtonConfig,
  qouteButtonsConfig,
  getTasksColumnDefs,
} from "../Constants/config";
import {
  ActivitiesButtonsContainer,
  LoaderContainer,
  CommonActivitiesMainContainer,
  ExportPDFButton,
  CommonTableContainer,
  TasksTableTypography,
} from "./styles";
import policyDocIcon from "../../../assets/svgs/file-upload-policy-doc.svg";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import { buildSectionAwareCoverConfig } from "./utils/buildSectionAwareCoverConfig";
import {
  AutoPopulateConfig,
  parseNumericInput,
} from "../Constants/autoPopulateFields";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils";
import { renderActivityBasedOnActivityKey } from "./RenderActivity";
import { buildDocumentsPayload } from "./utils/documents";
import { useActivityTasks } from "../hooks/useActivityTasks";

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

const SHARED_INSURER_ACTIVITY_KEYS = new Set([
  "placement_slip_generation_activity",
  "held_cover_note_activity",
  "policy_hard_copy_activity",
  "policy_confirmation_activity",
]);

const LEAD_SECTION_CONFIG = {
  placement_slip_generation_activity: {
    sectionKey: "feeDetails",
    policyPlacedField: "policyPlacedTypeLid",
    leadInsurerField: "leadInsurerId",
    leadPaysField: "isLeadInsurerPayCommission",
  },
  held_cover_note_activity: {
    sectionKey: "premiumReceiptDetailsSection",
    policyPlacedField: "policyPlacedTypeLid",
    leadInsurerField: "leadInsurerId",
    leadPaysField: "isLeadInsurerPayCommission",
  },
  policy_hard_copy_activity: {
    sectionKey: "deviationSection",
    policyPlacedField: "policyPlacedTypeLid",
    leadInsurerField: "leadInsurerId",
    leadPaysField: "isLeadInsurerPayCommission",
  },
  policy_confirmation_activity: {
    sectionKey: "policyDataRectifiedSection",
    policyPlacedField: "policyPlacedTypeLid",
    leadInsurerField: "leadInsurerId",
    leadPaysField: "isLeadInsurerPayCommission",
  },
} as const;

const PREMIUM_SECTION_PREFILL_MAP: Record<
  string,
  Array<{ section: string; allowed: readonly string[] }>
> = {
  policy_hard_copy_activity: [
    {
      section: "deviationSection",
      allowed: [
        "sumInsured",
        "premium",
        "brokeragePercentage",
        "brokerageAmount",
        "serviceTaxPercentage",
        "serviceTaxAmount",
        "totalNetPremium",
        "totalGrossPremiumIncTax",
        "totalGrossPremiumIncTaxCharges",
        "fee",
        "feePercentage",
        "other",
        "otherPercentage",
        "adminCharges",
        "adminChargesPercentage",
        "cessAmount",
        "cessPercentage",
        "tcBrokerageAmount",
        "terrorismCommission",
        "terrorismBrokeragePercentage",
        "basicBrokerageAmount",
        "basicPremiumPercentage",
        "srccAmount",
        "srccPercentage",
        "srccBrokerageAmount",
        "totalPremium",
      ],
    },
  ],
  held_cover_note_activity: [
    {
      section: "premiumReceiptDetailsSection",
      allowed: [
        "sumInsured",
        "basicPremium",
        "basicPremiumPercentage",
        "basicBrokerageAmount",
        "tcBrokerageAmount",
        "srccAmount",
        "srccPercentage",
        "srccBrokerageAmount",
        "terrorismCommission",
        "terrorismBrokeragePercentage",
        "serviceTaxAmount",
        "serviceTaxPercentage",
        "fee",
        "feePercentage",
        "other",
        "otherPercentage",
        "adminCharges",
        "adminChargesPercentage",
        "cessAmount",
        "cessPercentage",
        "brokeragePercentage",
        "brokerageAmount",
        "totalPremium",
        "totalNetPremium",
        "totalGrossPremiumIncTax",
        "totalGrossPremiumIncTaxCharges",
      ],
    },
  ],
  policy_confirmation_activity: [
    {
      section: "policyDataRectifiedSection",
      allowed: [
        "basicPremium",
        "sumInsured",
        "totalPremium",
        "basicPremiumPercentage",
        "basicBrokerageAmount",
        "tcBrokerageAmount",
        "brokeragePercentage",
        "brokerageAmount",
        "serviceTaxPercentage",
        "serviceTaxAmount",
        "fee",
        "feePercentage",
        "other",
        "otherPercentage",
        "totalNetPremium",
        "terrorismCommission",
        "terrorismBrokeragePercentage",
        "srccAmount",
        "srccPercentage",
        "srccBrokerageAmount",
        "totalGrossPremiumIncTax",
        "totalGrossPremiumIncTaxCharges",
        "adminCharges",
        "adminChargesPercentage",
        "cessAmount",
        "cessPercentage",
      ],
    },
  ],
  placement_slip_generation_activity: [
    {
      section: "policyDetails",
      allowed: [
        "sumInsured",
        "basicPremium",
        "basicPremiumPercentage",
        "basicBrokerageAmount",
        "tcBrokerageAmount",
        "srccAmount",
        "srccPercentage",
        "srccBrokerageAmount",
        "terrorismCommission",
        "terrorismBrokeragePercentage",
        "serviceTaxAmount",
        "serviceTaxPercentage",
        "totalGrossPremiumIncTax",
        "totalGrossPremiumIncTaxCharges",
        "totalPremium",
        "fee",
        "feePercentage",
        "other",
        "otherPercentage",
        "adminCharges",
        "adminChargesPercentage",
        "cessAmount",
        "cessPercentage",
        "brokeragePercentage",
        "brokerageAmount",
      ],
    },
  ],
};

const CommonActivityV1: React.FC<CommonActivityProps> = ({
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
  const lastMergedLeadInsurerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { id: opportunityId } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  const [lockFirstInsurer, setLockFirstInsurer] = useState(false);

  const skipNextOnChangeRef = skipNextOnChange;
  const [insurerPrefillVersion, setInsurerPrefillVersion] = useState(0);
  const pendingLeadPrefillRef = useRef<number | null>(null);

  const [insurerDetailsVersion, setInsurerDetailsVersion] = useState(0);

  const [isFormMounted, setIsFormMounted] = useState(false);

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
    }
  };

  useEffect(() => {
    hasAppliedInitialNormalizeRef.current = false;
  }, [activity?.activityKey, activity?.opportunityActivityId]);

  // State for tracking validation status
  const [validationStep, setValidationStep] = useState<ValidationSteps>({
    company: "validated",
    opportunity: "initial",
  });

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
    "placement_slip_generation_activity",
    "held_cover_note_activity",
    "policy_hard_copy_activity",
    "policy_confirmation_activity",
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

  const placementSlipActivityKey = "placement_slip_generation_activity";
  const heldCoverNoteActivityKey = "held_cover_note_activity";
  const policyHardCopyActivityKey = "policy_hard_copy_activity";
  const policyConfirmationActivityKey = "policy_confirmation_activity";
  const isPlacementSlipActivity =
    activity?.activityKey === placementSlipActivityKey ||
    activityMetaData?.activityKey === placementSlipActivityKey;
  const isHeldCoverNoteActivity =
    activity?.activityKey === heldCoverNoteActivityKey ||
    activityMetaData?.activityKey === heldCoverNoteActivityKey;
  const isPolicyHardCopyActivity =
    activity?.activityKey === policyHardCopyActivityKey ||
    activityMetaData?.activityKey === policyHardCopyActivityKey;
  const isPolicyConfirmationActivity =
    activity?.activityKey === policyConfirmationActivityKey ||
    activityMetaData?.activityKey === policyConfirmationActivityKey;

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

  const sanitizeKDMMeetingParticipant = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, value]) => Array.isArray(value) && value.length > 0
      )
    );
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
    if (updated.participants) {
      updated.participants = sanitizeKDMMeetingParticipant(
        updated.participants
      );
    }
    return updated;
  };

  const DEVIATION_FIELDS_TO_REMOVE = [
    "premium",
    "exclusions",
    "deviationsLid",
    "deductibles",
    "coverages",
    "brokeragePercentage",
    "brokerageAmount",
    // "deviationCoveragesLid",
  ];

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
          description: getValues?.deviationSection?.premium.toString(),
          opportunityActivityId: activity?.opportunityActivityId,
        },
      });
    }
  };

  const saveActivity = async () => {
    // ✅ Same submission guard as submit/approve/reject
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
        const documentsPayload = buildDocumentsPayload({
          documentsFromForm: documents,
          quoteDocumentsFromForm: cleanedRest?.quoteDocuments,
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
            ...cleanedRest,
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
        const sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        if (sanitizedRest?.policyDataWrongSection) {
          delete sanitizedRest.policyDataWrongSection.premium;
        }
        stripWrongSectionBrokerage(sanitizedRest);
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
        const sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
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
        const sanitizedRest = sanitizeParticipantFields(rest);
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);
        // stripFinalNegotiationDisallowedFields(sanitizedRest);

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
    handleApproveReject(approvedStatusData, false, "APPROVE_ACTIVITY");
  const reject = () =>
    handleApproveReject(rejectedStatusData, true, "REJECT_ACTIVITY");
  const submitForApproval = () =>
    submitWithStatus(submitStatusDataForApproval, true);

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
      const shouldPrefillAllRows =
        (isPlacementSlipActivity ||
          isHeldCoverNoteActivity ||
          isPolicyHardCopyActivity ||
          isPolicyConfirmationActivity) &&
        !onlyLeadRow;
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

  const normalizeInsurerRowsFromSource = (
    rows: any[],
    basePremium: number | null
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
          isLeadInsurer:
            row?.isLeadInsurer ??
            (index === 0
              ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
              : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO),
        };
      })
      .filter((row): row is Record<string, any> => row !== null);
  };

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
          if (field.key === "insurerId" && isSharedInsurerActivity) {
            return {
              ...field,
              componentProps: {
                ...(field.componentProps || {}),
                // Only lock row 0 in the session where we auto-populated it
                disabledByIndex: (idx: number) =>
                  shouldDisableInsurerSelection ||
                  (idx === 0 && lockFirstInsurer),
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
    activityMetaData,
    dynamicValues,
    getActivityData,
    latestLeadSectionValues?.[leadSectionMeta.leadInsurerField],
    lockFirstInsurer,
    isSharedInsurerActivity,
    insurerPrefillVersion,
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

    const normalizedRows = normalizeInsurerRowsFromSource(
      extractInsurerRows(apiSource),
      basePremiumFromSource
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
      basePremiumFromSource
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

  const grossPremiumAutoPopulateConfigs = React.useMemo(() => {
    switch (activityMetaData?.activityKey) {
      case "placement_slip_generation_activity": {
        const netPremiumBaseFields = [
          "policyDetails.basicPremium",
          "policyDetails.srccAmount",
          "policyDetails.terrorismCommission",
        ];
        const baseFields = [
          ...netPremiumBaseFields,
          "policyDetails.serviceTaxAmount",
        ];
        const chargeFields = [
          ...baseFields,
          "policyDetails.fee",
          "policyDetails.other",
          "policyDetails.adminCharges",
          "policyDetails.cessAmount",
        ];
        const totalBrokerageFields = [
          "policyDetails.basicBrokerageAmount",
          "policyDetails.srccBrokerageAmount",
          "policyDetails.tcBrokerageAmount",
        ];

        return [
          {
            target: "policyDetails.totalGrossPremiumIncTax",
            fields: baseFields,
          },
          {
            target: "policyDetails.totalGrossPremiumIncTaxCharges",
            fields: chargeFields,
          },
          {
            target: "policyDetails.brokerageAmount",
            fields: totalBrokerageFields,
          },
        ];
      }
      case "policy_hard_copy_activity": {
        const netPremiumBaseFields = [
          "deviationSection.premium",
          "deviationSection.srccAmount",
          "deviationSection.terrorismCommission",
        ];
        const baseFields = [
          ...netPremiumBaseFields,
          "deviationSection.serviceTaxAmount",
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
        ];

        return [
          {
            target: "deviationSection.totalNetPremium",
            fields: netPremiumBaseFields,
          },
          {
            target: "deviationSection.totalGrossPremiumIncTax",
            fields: baseFields,
          },
          {
            target: "deviationSection.totalGrossPremiumIncTaxCharges",
            fields: chargeFields,
          },
          {
            target: "deviationSection.brokerageAmount",
            fields: totalBrokerageFields,
          },
        ];
      }
      case "held_cover_note_activity": {
        const netPremiumBaseFields = [
          "premiumReceiptDetailsSection.basicPremium",
          "premiumReceiptDetailsSection.srccAmount",
          "premiumReceiptDetailsSection.terrorismCommission",
        ];
        const baseFields = [
          ...netPremiumBaseFields,
          "premiumReceiptDetailsSection.serviceTaxAmount",
        ];

        const chargeFields = [
          ...baseFields,
          "premiumReceiptDetailsSection.fee",
          "premiumReceiptDetailsSection.other",
          "premiumReceiptDetailsSection.adminCharges",
          "premiumReceiptDetailsSection.cessAmount",
        ];

        const totalBrokerageFields = [
          "premiumReceiptDetailsSection.basicBrokerageAmount",
          "premiumReceiptDetailsSection.srccBrokerageAmount",
          "premiumReceiptDetailsSection.tcBrokerageAmount",
        ];

        return [
          {
            target: "premiumReceiptDetailsSection.totalNetPremium",
            fields: netPremiumBaseFields,
          },
          {
            target: "premiumReceiptDetailsSection.totalGrossPremiumIncTax",
            fields: baseFields,
          },
          {
            target:
              "premiumReceiptDetailsSection.totalGrossPremiumIncTaxCharges",
            fields: chargeFields,
          },
          {
            target: "premiumReceiptDetailsSection.brokerageAmount",
            fields: totalBrokerageFields,
          },
        ];
      }

      case "policy_confirmation_activity": {
        const netPremiumBaseFields = [
          "policyDataRectifiedSection.basicPremium",
          "policyDataRectifiedSection.srccAmount",
          "policyDataRectifiedSection.terrorismCommission",
        ];
        const baseFields = [
          ...netPremiumBaseFields,
          "policyDataRectifiedSection.serviceTaxAmount",
        ];
        const chargeFields = [
          ...baseFields,
          "policyDataRectifiedSection.fee",
          "policyDataRectifiedSection.other",
          "policyDataRectifiedSection.adminCharges",
          "policyDataRectifiedSection.cessAmount",
        ];
        const totalBrokerageFields = [
          "policyDataRectifiedSection.basicBrokerageAmount",
          "policyDataRectifiedSection.srccBrokerageAmount",
          "policyDataRectifiedSection.tcBrokerageAmount",
        ];

        return [
          {
            target: "policyDataRectifiedSection.totalNetPremium",
            fields: netPremiumBaseFields,
          },
          {
            target: "policyDataRectifiedSection.totalGrossPremiumIncTax",
            fields: baseFields,
          },
          {
            target: "policyDataRectifiedSection.totalGrossPremiumIncTaxCharges",
            fields: chargeFields,
          },
          {
            target: "policyDataRectifiedSection.brokerageAmount",
            fields: totalBrokerageFields,
          },
        ];
      }
      default:
        return [];
    }
  }, [activityMetaData?.activityKey, isSriLankaUser]);

  const premiumPrefillActivities = useMemo(
    () => [
      "held_cover_note_activity",
      "policy_hard_copy_activity",
      "policy_confirmation_activity",
      "placement_slip_generation_activity",
    ],
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
    if (
      !(
        isPlacementSlipActivity ||
        isHeldCoverNoteActivity ||
        isPolicyHardCopyActivity ||
        isPolicyConfirmationActivity
      )
    ) {
      return;
    }
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
    isHeldCoverNoteActivity,
    isPolicyHardCopyActivity,
    isPolicyConfirmationActivity,
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

    const valuesSnapshot = latestValuesRef.current || {};
    const currentValues =
      Object.keys(valuesSnapshot).length > 0
        ? valuesSnapshot
        : formRef.current?.getValues?.() || {};
    const premium = transformPremiumData(premiumResponseData);
    if (activity?.activityKey === "policy_hard_copy_activity") {
      const basicPremiumOverride =
        premium?.basicPremium ?? premium?.premium ?? null;
      premium.premium =
        basicPremiumOverride === null ? premium.premium : basicPremiumOverride;
    }
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

  const actionMap = {
    saveActivity,
    submit,
    createTaskForDeviation,
    createTaskForPolicyHardCopy,
    qouteGenerationReport,
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
  const isEq = (a: any, b: any) => String(a ?? "") === String(b ?? "");

  const disableSFAForHeld =
    activity?.activityKey === "held_cover_note_activity" &&
    (isEq(deviationAddressedId, dynamicValues?.TOGGLE_NO) ||
      isEq(revisedHeldCoverNoteId, dynamicValues?.TOGGLE_NO));

  let isFormDisabled = false;
  if (isActivityApproved) {
    if (canGiveApproval) {
      isFormDisabled =
        isLost ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_APPROVED" ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_OPEN" ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_CLOSED";
    } else {
      isFormDisabled = !(
        (!isLost &&
          opportunityInitialStatus ===
            "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS") ||
        opportunityInitialStatus === "OPPORTUNITY_ACTIVITY_STATUS_REJECTED"
      );
    }
  } else {
    isFormDisabled =
      isLost ||
      opportunityInitialStatus !==
        "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS";
  }

  // Use activity tasks hook to replace existing task logic
  const {
    handleCreateTask,
    TasksTable,
    TaskFormDrawer,
    isTaskDetailsLoading,
    isAllTasksCompleted,
    // Meetings
    shouldShowMeetings,
    MeetingsTable,
    MeetingFormDrawer,
    isAllMeetingsCompleted,
    isMeetingDetailsLoading,
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
    if (opportunityInitialStatus == "OPPORTUNITY_ACTIVITY_STATUS_CLOSED")
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
          {renderActivityBasedOnActivityKey(
            activity?.activityKey,
            resolvedConfig,
            formRef,
            actionMap,
            dynamicValues,
            activity,
            isFormDisabled,
            canEditActivity,
            isActivitySubmitForApprovalStatus,
            opportunityInitialStatus,
            getActivityData,
            latestValuesRef,
            optyActivitiesState,
            setValidationStep,
            validationStep,
            activityMetaData,
            userOrganisationKey,
            currActivityDataFromGlobalState
          )}
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
            <ActivitiesButtonsContainer>
              {qouteButtonsConfig?.map((qouteButton) => {
                const actionHandler = actionMap[qouteButton.onClick || ""];
                let isButtonDisabled = false;
                if (qouteButton.onClick === "submit") {
                  if (!isAllTasksCompleted) {
                    isButtonDisabled = true;
                  }
                }

                return (
                  <Button
                    key={qouteButton.key}
                    variantType={qouteButton.componentProps?.variantType}
                    style={qouteButton.componentProps?.style}
                    onClick={actionHandler}
                    disabled={
                      (qouteButton.name === "generateQuoteComparison"
                        ? !activityMetaData?.isEnabled
                        : isFormDisabled || !canEditActivity) ||
                      isSubmitting ||
                      isButtonDisabled
                    }
                  >
                    {qouteButton.label}
                  </Button>
                );
              })}
            </ActivitiesButtonsContainer>
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
                  {activity?.activityKey === "rfp_details_entry_activity" && (
                    <IsgHandoverAssignment
                      isgAssignee={getActivityData?.data?.isgAssignee}
                      isgOwner={getActivityData?.data?.isgOwner}
                    />
                  )}
                </div>
              )}
              {/* <Button onClick={handleSaveDraft}>Save as Draft</Button> */}
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
                      activity?.activityKey === "data_validation_activity" &&
                      validationStep.opportunity === "initial" &&
                      button.key !== "saveActivity"
                    ) {
                      isButtonDisabled = true;
                    }
                    if (
                      button.onClick === "submitForApproval" &&
                      disableSFAForHeld
                    ) {
                      isButtonDisabled = true;
                    }

                    if (button.onClick === "submit") {
                      if (
                        activity?.activityKey === "held_cover_note_activity"
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

                      if (
                        activity?.activityKey === "policy_hard_copy_activity"
                      ) {
                        //Todo: need to enable when calling policy hard copy
                        // isButtonDisabled =
                        //   isButtonDisabled || isPolicyHardCopyDisabled;
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

export default CommonActivityV1;
