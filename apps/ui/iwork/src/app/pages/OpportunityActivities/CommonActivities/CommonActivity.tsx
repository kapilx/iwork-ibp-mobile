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
  SUCCESS_MESSAGE,
  useApiQuery,
  useApiMutation,
  setToastMessage,
  apiRequest,
  parseApiConfigToLocalFormConfig,
  selectHasPermission,
  FeatureKey,
  DynamicForm,
  formatDate,
  environment,
} from "@ui/ui-lib";
import {
  ALERT_MESSAGES,
  COMPANY_VALIDATION_LABEL,
  COVER_EXTRACTION_FAILURE_MESSAGE,
  COVER_EXTRACTION_SUCCESS_MESSAGE,
  DATA_VALIDATION_LABEL,
  DEVIATION_TASK_NAMES,
  ENDORSEMENT_TOASTS,
  ISG_ASSIGNED_TO_TEXT,
  ISG_ASSIGNMENT_PENDING_TEXT,
  OPPORTUNITY_VALIDATION_LABEL,
  PREPARING,
  THIS_ACTIVITY_WAS_APPROVED_BY,
  VIEW_PDF,
  WAITING_FOR_ACTIVITY_APPROVAL_BY,
} from "../../../constants";
import {
  transformCDDetailsData,
  transformHandOverMeetData,
  transformKDMMeetingData,
  transformPremiumData,
} from "../../../constants/transformUtils";
import { HTTP_METHODS } from "@ui/ui-lib";
import { calculatePercentageAmountUpdate } from "../../../Utils/calculatePercentageAmountUpdate";
import {
  approvalButtonsConfig,
  buttonsConfig,
  onlyApproveButtonConfig,
  qouteButtonsConfig,
  transformQuestions,
} from "../Constants/config.js";
import {
  ActivitiesButtonsContainer,
  LoaderContainer,
  CommonActivitiesMainContainer,
  MandateLabelContainer,
  StyledLinearProgress,
  StyledMandateText,
  StyledRfpDataCollectionContainer,
  ValidateButton,
  ValidationButtonContainer,
  ExportPDFButton,
} from "./styles";
import axios from "axios";
import policyDocIcon from "../../../assets/svgs/file-upload-policy-doc.svg";
// import { activityConfigMap } from "../Activities/ActivitiesConfigs";
import { getActivityConfig } from "../Activities/ActivitiesConfigs";
import {
  AutoPopulateConfig,
  parseNumericInput,
  useAutoPopulateCalculatedFields,
} from "../Constants/autoPopulateFields";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils";
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

type BrokerageFieldSet = {
  basicBase: string;
  srccBase: string;
  tcBase: string;
  taxBase?: string | null;
};

const createBrokerageAutoPopulateConfig = (
  section: string,
  baseField: string,
  percentageField: string,
  amountField: string
): AutoPopulateConfig => ({
  target: `${section}.${amountField}`,
  fields: [`${section}.${baseField}`, `${section}.${percentageField}`],
  compute: ({ values }) => {
    const sectionValues = values?.[section];

    if (!sectionValues || typeof sectionValues !== "object") {
      return "";
    }

    const baseNumeric = parseNumericInput(sectionValues?.[baseField]);
    const percentageNumeric = parseNumericInput(
      sectionValues?.[percentageField]
    );

    if (baseNumeric === null || percentageNumeric === null) {
      return "";
    }

    const computedAmount = Number(
      ((baseNumeric * percentageNumeric) / 100).toFixed(2)
    );

    const currentAmountNumeric = parseNumericInput(
      sectionValues?.[amountField]
    );

    if (
      currentAmountNumeric !== null &&
      Math.abs(currentAmountNumeric - computedAmount) < 0.01
    ) {
      return undefined;
    }

    return computedAmount;
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
      "basicPremiumPercentage",
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

  if (taxBaseField) {
    configs.push({
      target: `${section}.serviceTaxPercentage`,
      fields: [
        `${section}.${taxBaseField}`,
        `${section}.adminCharges`,
        `${section}.other`,
        `${section}.cessAmount`,
        `${section}.fee`,
        `${section}.serviceTaxAmount`,
      ],
      compute: ({ values }) => {
        const sectionValues = values?.[section];
        if (!sectionValues) return "";

        const getNum = (v: any) => (v == null || v === "" ? 0 : Number(v) || 0);

        const vatAmount = getNum(sectionValues.serviceTaxAmount);
        const netPremiumBase = getNum(sectionValues[taxBaseField]);
        const adminCharges = getNum(sectionValues.adminCharges);
        const other = getNum(sectionValues.other);
        const cessAmount = getNum(sectionValues.cessAmount);
        const fee = getNum(sectionValues.fee);

        const vatBase =
          netPremiumBase + adminCharges + other + cessAmount + fee;

        if (!vatBase) return ""; // cannot compute % without a base

        const computedPct = Number(((vatAmount / vatBase) * 100).toFixed(4));

        const current = Number(sectionValues.serviceTaxPercentage || 0);

        // prevent infinite update loops
        if (Math.abs(current - computedPct) < 0.01) return undefined;

        return computedPct;
      },
    });
  }

  return configs;
};

const CommonActivity: React.FC<CommonActivityProps> = ({
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
  const [compensationTypeLid, setCompensationTypeLid] = useState<number | null>(
    null
  );

  const [heldCoverNoteDevitation, setHeldCoverNoteDeviation] = useState<
    string | null
  >(null);
  const [isPolicyDataRectified, setIsPolicyDataRectified] = useState<
    string | null
  >(null);
  const [deviationAddressedId, setDeviationsAddressedLid] = useState<
    string | null
  >(null);
  const [deviationCoveragesId, setDeviationCoveragesId] = useState<
    string | null
  >(null);

  const [revisedHeldCoverNoteId, setRevisedHeldCoverNoteId] = useState<
    string | null
  >(null);

  const hasInitializedHeldCoverNoteDeviationRef = useRef(false);

  useEffect(() => {
    if (activity?.activityKey !== "held_cover_note_activity") {
      hasInitializedHeldCoverNoteDeviationRef.current = false;
    }
  }, [activity?.activityKey]);

  const [isPolicyHardCopyDisabled, setIsPolicyHardCopyDisabled] =
    useState(false);

  const [
    isCoverageDeviationsYesInPolicyHardCopy,
    setIsCoverageDeviationsYesInPolicyHardCopy,
  ] = useState<string | null>(null);
  const [placementSlipInstallmentDate, setPlacementSlipInstallmentDate] =
    useState<string | null>(null);
  const [placementSlipCdAccountRequired, setPlacementSlipCdAccountRequired] =
    useState<string | null>(null);
  const [placementSlipCdAccountSelected, setPlacementSlipCdAccountSelected] =
    useState<string | null>(null);

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

  useEffect(() => {
    if (
      activity?.activityKey === "held_cover_note_activity" &&
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
      activity?.activityKey === "held_cover_note_activity" &&
      heldCoverNoteDevitation !== null
    ) {
      hasInitializedHeldCoverNoteDeviationRef.current = true;
    }
  }, [activity?.activityKey, heldCoverNoteDevitation, TOGGLE_NO]);

  // State for tracking validation status
  const [isOpportunityValidated, setIsOpportunityValidated] = useState(false);
  const [validationStep, setValidationStep] = useState<ValidationSteps>({
    company: "validated",
    opportunity: "initial",
  });

  const STRING_FIELDS = [
    "chequeNumber",
    "receiptNo",
    "insurerPolicyNo",
    "brokeragePercentage",
    "brokerageAmount",
    "premium",
    "remarks",
  ];

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

          const response = configData?.data?.activityMeta?.map((item) => {
            if (item?.isCoversRequired) {
              return {
                ...item,
                config: coverConfigData?.data?.formConfig, //formConfig for covers
                defaultValues: coversPrefillData?.data?.covers || {},
              };
            }
            return item;
          });

          return {
            ...configData?.data,
            activityMeta: response,
            coversConfig: coverConfigData?.data?.formConfig || [],
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

  const {
    data: getMandatePreviousData,
    isLoading: isGetMandatePreviousActivityLoading,
  } = useApiQuery({
    queryKey: [
      "opportunityMandateGetCall",
      activity.opportunityActivityId,
      activityMetaData,
    ],
    url: endPoints.fetchOpportunityPreviousMandate(
      Number(activity.opportunityActivityId)
    ),
    enabled:
      !!activity.opportunityActivityId &&
      !!activityMetaData &&
      !getActivityData?.data?.dataActivity &&
      activity?.activityKey === "mandate_details_entry_activity",
  });

  const {
    data: policyConfirmationAccountDetails,
    isLoading: isPolicyConfirmationAccountDetailsLoading,
  } = useApiQuery({
    queryKey: ["policyConfirmationAccountDetails"],
    url: endPoints.policyConfirmation(activity.opportunityActivityId),
    enabled: activity?.activityKey === "policy_confirmation_activity",
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

  const transformDocuments = (documents: any) => {
    let docsArray: any[] = [];

    if (Array.isArray(documents)) {
      docsArray = documents;
    } else if (documents && Array.isArray(documents.documents)) {
      docsArray = documents.documents;
    } else {
      console.warn(
        "documents is not an array and doesn't have a 'documents' array"
      );
      return [];
    }

    const transformed = docsArray
      .map((doc) => {
        const documentId = doc?.fileUpload?.id ?? doc?.documentId;
        const documentTypeLid = Number(
          doc?.documentTypeLid ?? doc?.documentType
        );

        if (!documentId || isNaN(documentTypeLid)) {
          console.warn("Skipping document due to missing id or type:", doc);
          return null;
        }

        return {
          documentTypeLid,
          documentId,
        };
      })
      .filter(Boolean);
    return transformed;
  };

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
      onSuccess: async (response) => {
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
      },
      onError: async (error) => {
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
        stripDeviationFields(sanitizedRest);
        stripWrongSectionBrokerage(sanitizedRest);

        console.log("saving draft...", {
          opportunityActivityId: activity.opportunityActivityId,
          ...sanitizedRest,
          ...(activity.activityKey !== "opportunity_lost_activity" && {
            documents: transformDocuments(documents),
            ...(sanitizedRest?.quoteDocuments && {
              quoteDocuments: transformDocuments(
                sanitizedRest?.quoteDocuments || []
              ),
            }),
          }),
          statusLid: saveStatusData?.data[0]?.id,
        });
        // let parsed = parseNumbersDeep(rest);
        // parsed = parseStringsDeep(parsed, STRING_FIELDS);
        // mutation.mutate({
        //   endpoint: isPutCall
        //     ? endPoints.updateOpportunityActivity(
        //         getActivityData?.data?.opportunityActivityId
        //       )
        //     : endPoints.activityMeta,
        //   method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
        //   data: {
        //     opportunityActivityId: activity.opportunityActivityId,
        //     ...sanitizedRest,
        //     ...(activity.activityKey !== "opportunity_lost_activity" && {
        //       documents: transformDocuments(documents),
        //       ...(sanitizedRest?.quoteDocuments && {
        //         quoteDocuments: transformDocuments(
        //           sanitizedRest?.quoteDocuments || []
        //         ),
        //       }),
        //     }),
        //     statusLid: saveStatusData?.data[0]?.id,
        //   },
        // });
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
        mutation.mutate(
          {
            endpoint: isPutCall
              ? endPoints.updateOpportunityActivity(
                  getActivityData?.data?.opportunityActivityId
                )
              : endPoints.activityMeta,
            method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
            data: {
              opportunityActivityId: activity.opportunityActivityId,
              ...sanitizedRest,
              ...(activity.activityKey !== "opportunity_lost_activity" && {
                documents: transformDocuments(documents),
              }),
              ...(sanitizedRest?.quoteDocuments && {
                quoteDocuments: transformDocuments(
                  sanitizedRest?.quoteDocuments || []
                ),
              }),
              statusLid: submitStatusData.data[0].id,
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
              ...(activity.activityKey !== "opportunity_lost_activity" && {
                documents: transformDocuments(documents),
              }),
              ...(sanitizedRest?.quoteDocuments && {
                quoteDocuments: transformDocuments(
                  sanitizedRest?.quoteDocuments || []
                ),
              }),
              statusLid: statusData.data[0].id,
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
        mutation.mutate(
          {
            endpoint: endPoints.activityApproval(
              activity.opportunityActivityId
            ),
            method: HTTP_METHODS.PUT,
            data: {
              opportunityActivityId: activity.opportunityActivityId,
              ...sanitizedRest,
              ...(activity.activityKey !== "opportunity_lost_activity" && {
                documents: transformDocuments(documents),
              }),
              ...(sanitizedRest?.quoteDocuments && {
                quoteDocuments: transformDocuments(
                  sanitizedRest?.quoteDocuments || []
                ),
              }),
              statusLid: statusData.data[0].id,
            },
          },
          {
            onSuccess: (response) => {
              if (
                activity.activityKey === "placement_slip_generation_activity" &&
                actionType === "approve"
              ) {
                setIsOpportunityWon(true);
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
    handleApproveReject(approvedStatusData, false, "approve");
  const reject = () => handleApproveReject(rejectedStatusData, true, "reject");
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

  const hasInsurerSelectionsInValues = (values?: Record<string, any>) =>
    hasInsurerSelections(extractInsurerRows(values?.insurerDetails));

  const hasInsurerDetailsInValues = (values?: Record<string, any>) =>
    hasMeaningfulInsurerRows(extractInsurerRows(values?.insurerDetails));

  const shouldForcePreferredInsurerPrefill = (values?: Record<string, any>) => {
    if (userChangedPolicyPlacedTypeRef.current) {
      return false;
    }
    const shouldApplyMultiplePrefill =
      isPlacementSlipActivity ||
      isHeldCoverNoteActivity ||
      isPolicyHardCopyActivity ||
      isPolicyConfirmationActivity;
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
  const cachedInsurerRows = extractInsurerRows(
    currActivityDataFromGlobalState?.data?.insurerDetails
  );
  const hasCachedInsurerDetails = hasMeaningfulInsurerRows(cachedInsurerRows);

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
    if (Array.isArray(normalized?.insurerDetails)) {
      normalized.insurerDetails = normalizeInsurerRowsFromSource(
        normalized.insurerDetails,
        basePremiumForRows
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
      if (Array.isArray(normalized?.insurerDetails)) {
        normalized.insurerDetails = normalizeInsurerRowsFromSource(
          normalized.insurerDetails,
          basePremiumForRows
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

  const validate = async (): Promise<void> => {
    const companyId = dynamicValues.companyId;
    const activityStep = dynamicValues.breadCumbSep;
    navigate(`/companies/${companyId}/edit`, {
      state: {
        opportunities: {
          from: location.pathname,
          to: `/companies/${companyId}/edit`,
          validationMode: true,
          opportunityId,
          activityStep,
          optyActivitiesState: getOptyActivityState(),
        },
      },
    });
  };

  // Updated validation functions with state management
  const companyId = dynamicValues.companyId;
  const validateCompany = () => {
    const activityStep = dynamicValues.breadCumbSep;
    navigate(`/companies/${companyId}/edit`, {
      state: {
        company: {
          from: location.pathname,
          to: `/companies/${companyId}/edit`,
          validationMode: true,
          opportunityId,
          companyId,
          activityStep,
          validationStep: validationStep,
          optyActivitiesState: getOptyActivityState(),
        },
      },
    });
  };

  const validateOpportunity = () => {
    // Set the state to true for opportunity validation
    setIsOpportunityValidated(true);
    const activityStep = dynamicValues.breadCumbSep;
    navigate(`/opportunities/${opportunityId}/edit`, {
      state: {
        opportunities: {
          from: location.pathname,
          to: `/opportunities/${opportunityId}/edit`,
          validationMode: true,
          opportunityId,
          companyId,
          activityStep,
          validationStep: validationStep, // Pass the validation state
          optyActivitiesState: getOptyActivityState(),
        },
      },
    });
  };

  const routeState = location?.state?.opportunities;
  useEffect(() => {
    const toPath = location?.state?.opportunities?.to;
    if (toPath) {
      if (toPath === `/opportunities/${opportunityId}/edit`) {
        setValidationStep((prev) => ({
          ...prev,
          opportunity: "validated",
        }));
      }
      if (toPath === `/companies/${companyId}/edit`) {
        setValidationStep((prev) => ({
          ...prev,
          opportunity: "validated" ? "validated" : "initial",
        }));
      }
    }
  }, [routeState]);

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
    compensationTypeLid,
    heldCoverNoteDevitation,
    placementSlipInstallmentDate,
    placementSlipCdAccountRequired,
    placementSlipCdAccountSelected,
    deviationAddressedId,
    deviationCoveragesId,
    revisedHeldCoverNoteId,
    isCoverageDeviationsYesInPolicyHardCopy,
    isPolicyDataRectified,
    lockFirstInsurer,
    isSharedInsurerActivity,
    insurerPrefillVersion,
    leadInsurerSelectionVersion,
    insurerDetailsVersion,
    isExportAllowed,
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
      // Apply the same full-row preferred-insurer prefill (which carries
      // brokeragePercentage/brokerageAmount) to every shared-insurer activity,
      // not just placement slip. Otherwise policy hard copy / held cover note /
      // policy confirmation prefill share but lose brokerage on fresh entry.
      !(
        isPlacementSlipActivity ||
        isHeldCoverNoteActivity ||
        isPolicyHardCopyActivity ||
        isPolicyConfirmationActivity
      ) ||
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
    isHeldCoverNoteActivity,
    isPolicyHardCopyActivity,
    isPolicyConfirmationActivity,
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

  const brokerageAutoPopulateConfigs = React.useMemo(() => {
    if (!isSriLankaUser) {
      return [];
    }
    const buildConfigs = (section: string, fieldSet: BrokerageFieldSet) =>
      buildBrokerageAutoPopulateConfigs(section, fieldSet);

    switch (activityMetaData?.activityKey) {
      // case "final_negotiation_activity":
      //   return buildConfigs("selectFinalisedQuote", {
      //     basicBase: "basicPremium",
      //     srccBase: "srccAmount",
      //     tcBase: "terrorism",
      //     taxBase: "netPremium", // <-- NEW VAT base
      //   });
      case "placement_slip_generation_activity":
        return buildConfigs("policyDetails", {
          basicBase: "basicPremium",
          srccBase: "srccAmount",
          tcBase: "terrorismCommission",
          taxBase: "totalPremium", // <-- already net (final slip logic)
        });
      case "policy_hard_copy_activity":
        return buildConfigs("deviationSection", {
          basicBase: "premium",
          srccBase: "srccAmount",
          tcBase: "terrorismCommission",
          taxBase: "totalNetPremium", // <-- NEW VAT base
        });
      case "held_cover_note_activity":
        return buildConfigs("premiumReceiptDetailsSection", {
          basicBase: "basicPremium",
          srccBase: "srccAmount",
          tcBase: "terrorismCommission",
          taxBase: "totalNetPremium", // <-- NEW VAT base
        });
      case "policy_confirmation_activity":
        return buildConfigs("policyDataRectifiedSection", {
          basicBase: "basicPremium",
          srccBase: "srccAmount",
          tcBase: "terrorismCommission",
          taxBase: "totalNetPremium", // <-- NEW VAT base
        });
      default:
        return [];
    }
  }, [activityMetaData?.activityKey, isSriLankaUser]);

  const handleAutoPopulateGrossPremium = useAutoPopulateCalculatedFields(
    formRef,
    grossPremiumAutoPopulateConfigs,
    { onBeforeSetValues: autoPopulateBeforeSetValues }
  );
  const handleAutoPopulateBrokerageAmounts = useAutoPopulateCalculatedFields(
    formRef,
    brokerageAutoPopulateConfigs
  );
  const [loading, setLoading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

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

  const renderLabelsOfActivity = (title: string | undefined) => {
    if (!title) return null;
    switch (title) {
      case "rfp_cover_detail_activity":
        return (
          <StyledRfpDataCollectionContainer>
            <DynamicForm
              formConfig={rfpDataCollectionCoversAiConfig}
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}
              onFileUpload={onFileUpload}
              disableAllFields={isFormDisabled || !canEditActivity}
            />
            {loading && <StyledLinearProgress color="secondary" />}
          </StyledRfpDataCollectionContainer>
        );

      case "mandate_details_entry_activity":
        if (
          getMandatePreviousData?.data &&
          !getActivityData?.data &&
          opportunityInitialStatus ===
            "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS"
        ) {
          return (
            <MandateLabelContainer>
              <StyledMandateText>
                {`Mandate document for ${dynamicValues.companyName} already exists. Do you want to use the same one?`}
              </StyledMandateText>
              <Button
                variantType="secondary"
                onClick={() => {
                  const existingData =
                    getMandatePreviousData.data?.dataActivity;
                  const documents = existingData?.documents || [];

                  const updatedConfig = resolvedConfig.map((group: any) => {
                    if (Array.isArray(group.config)) {
                      group.config = group.config.map((field: any) => {
                        if (field.type === "documentupload") {
                          return {
                            ...field,
                            componentProps: {
                              ...(field.componentProps || {}),
                              documents,
                              isDownloadAllowed: isExportAllowed,
                            },
                          };
                        }
                        return field;
                      });
                    }
                    return group;
                  });

                  if (formRef.current) {
                    formRef.current.resetForms(existingData);
                  }
                }}
              >
                Fetch existing mandate
              </Button>
            </MandateLabelContainer>
          );
        }
        return null;

      case "policy_confirmation_activity":
        if (policyConfirmationAccountDetails?.data?.cdData) {
          const cdData = policyConfirmationAccountDetails.data.cdData;

          const result = cdData
            .map((item: any) => `${item.key}: ${item.value}`)
            .join(" | ");

          return result;
        }
        return "";
      case "data_validation_activity":
        if (getActivityData) {
          const isSubmitted =
            opportunityInitialStatus !==
            "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS";
          return (
            <>
              <label>{DATA_VALIDATION_LABEL}</label>
              <ValidationButtonContainer>
                <ValidateButton
                  variantType={
                    validationStep.company === "initial"
                      ? "primary"
                      : "secondary"
                  }
                  disabled={isSubmitted}
                  style={{ gridColumn: 5 }}
                  onClick={() => {
                    if (isSubmitted) return;
                    validateCompany();
                  }}
                >
                  {COMPANY_VALIDATION_LABEL}
                </ValidateButton>
                <ValidateButton
                  variantType={
                    validationStep.opportunity === "initial"
                      ? "primary"
                      : "secondary"
                  }
                  disabled={isSubmitted}
                  style={{ gridColumn: 5 }}
                  onClick={() => {
                    if (isSubmitted) return;
                    validateOpportunity();
                  }}
                >
                  {OPPORTUNITY_VALIDATION_LABEL}
                </ValidateButton>
              </ValidationButtonContainer>
            </>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [cdDetailsId, setCdDetailsId] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState<any>(null);

  const { data: meetingDataResponse } = useApiQuery({
    queryKey: ["meetingId", meetingId],
    url: endPoints.meetingById(Number(meetingId)),
    enabled: !!meetingId, // runs only when meetingId is truthy
  });

  const { data: cdDetailsResponse } = useApiQuery({
    queryKey: ["cdDetailsId", cdDetailsId],
    url: endPoints.getCdDetailsById(Number(cdDetailsId)),
    enabled: !!cdDetailsId,
  });

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
    if (meetingDataResponse?.data) {
      setMeetingData(meetingDataResponse.data);
      let res = {};
      if (
        meetingDataResponse?.data?.activity?.activityKey ===
        "kdm_meeting_activity"
      ) {
        const getValues = formRef?.current?.getValues?.();
        res = transformKDMMeetingData(meetingDataResponse.data);

        formRef.current?.resetForms({
          ...res,
          kdmMeetingFormFields: {
            ...res?.kdmMeetingFormFields,
            kdmMeetingTypeLid:
              getValues?.kdmMeetingFormFields?.kdmMeetingTypeLid || null,
            selectMeeting:
              getValues?.kdmMeetingFormFields?.selectMeeting || null,
          },
        });
      }
      if (
        meetingDataResponse?.data?.activity?.activityKey ===
        "hand_over_meet_activity"
      ) {
        const getValues = formRef?.current?.getValues?.();

        res = transformHandOverMeetData(meetingDataResponse.data);
        formRef.current?.resetForms({
          ...res,
          handOverMeetFields: {
            ...res?.handOverMeetFields,
            handOverMeetingTypeLid:
              getValues?.handOverMeetFields?.handOverMeetingTypeLid || null,
            selectMeeting: getValues?.handOverMeetFields?.selectMeeting || null,
          },
        });
      }
    }
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
  }, [meetingDataResponse, cdDetailsResponse]);

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

  const fetchMeetingDetails = (changedValue: any, formValues: any) => {
    const selectedMeetingId = changedValue?.value;
    if (selectedMeetingId) {
      setMeetingId(selectedMeetingId);
    } else {
      console.error("Invalid meeting ID:", changedValue);
    }
    // State to store fetched meeting data
  };

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

  const actionMap = {
    saveActivity,
    submit,
    createTaskForDeviation,
    createTaskForPolicyHardCopy,
    validate,
    fetchMeetingDetails,
    handleFinalizedQuoteSelection,
    qouteGenerationReport,
    submitForApproval,
    approve,
    reject,
    fetchCDDetails,
  };
  const isLoading =
    isActivityMetaLoading ||
    isGetActivityLoading ||
    isPolicyConfirmationAccountDetailsLoading ||
    isGetMandatePreviousActivityLoading;

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

  const isPolicyConfirmationSubmitDisabled = (vals: any, dyn: any): boolean => {
    if (opportunityInitialStatus == "OPPORTUNITY_ACTIVITY_STATUS_CLOSED")
      return true;

    const dev = vals?.policyDataWrongSection?.policyDataWrongLid;
    const addressed = vals?.policyDataRectifiedSection?.policyDataRectifiedLid;

    const YES = String(dyn?.TOGGLE_YES);
    const NO = String(dyn?.TOGGLE_NO);

    if (dev == null || dev === "") return true;

    if (String(dev) === NO) return false;

    if (String(dev) === YES && String(addressed) === NO) return true;

    return false;
  };

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

  const handleSaveDraft = async () => {
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
      stripDeviationFields(sanitizedRest);
      stripWrongSectionBrokerage(sanitizedRest);

      console.log("saving draft...", {
        opportunityActivityId: activity.opportunityActivityId,
        ...sanitizedRest,
        ...(activity.activityKey !== "opportunity_lost_activity" && {
          documents: transformDocuments(documents),
          ...(sanitizedRest?.quoteDocuments && {
            quoteDocuments: transformDocuments(
              sanitizedRest?.quoteDocuments || []
            ),
          }),
        }),
        statusLid: saveStatusData?.data[0]?.id,
      });
      // let parsed = parseNumbersDeep(rest);
      // parsed = parseStringsDeep(parsed, STRING_FIELDS);
      // mutation.mutate({
      //   endpoint: isPutCall
      //     ? endPoints.updateOpportunityActivity(
      //         getActivityData?.data?.opportunityActivityId
      //       )
      //     : endPoints.activityMeta,
      //   method: isPutCall ? HTTP_METHODS.PUT : HTTP_METHODS.POST,
      //   data: {
      //     opportunityActivityId: activity.opportunityActivityId,
      //     ...sanitizedRest,
      //     ...(activity.activityKey !== "opportunity_lost_activity" && {
      //       documents: transformDocuments(documents),
      //       ...(sanitizedRest?.quoteDocuments && {
      //         quoteDocuments: transformDocuments(
      //           sanitizedRest?.quoteDocuments || []
      //         ),
      //       }),
      //     }),
      //     statusLid: saveStatusData?.data[0]?.id,
      //   },
      // });
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
          {activity?.activityKey === "placement_slip_generation_activity" &&
            opportunityInitialStatus ===
              "OPPORTUNITY_ACTIVITY_STATUS_APPROVED" &&
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
                latestValuesRef.current = values;

                if (
                  activityMetaData?.activityKey === "policy_hard_copy_activity"
                ) {
                  setIsPolicyHardCopyDisabled(
                    isPolicyHardCopySubmitDisabled(values, dynamicValues)
                  );
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
                  userChangedPolicyPlacedTypeRef.current =
                    currPlaced !==
                    String(dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER);
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
                const currLeadInsurerId =
                  getLeadSectionSnapshot()?.[leadInsurerFieldName];

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

                if (prevPlaced !== currPlaced && !isMultiple) {
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

                  const updatedRows = currentRows.map((row) => {
                    if (!row?.insurerId) {
                      return row;
                    }
                    const matcher = map.get(Number(row.insurerId));
                    if (!matcher) {
                      return row;
                    }
                    const nextRow = { ...row };
                    [
                      "insurerLocationId",
                      "insurerBranchId",
                      "insurerContactId",
                      "sharePercentage",
                      "shareAmount",
                      "brokeragePercentage",
                      "brokerageAmount",
                    ].forEach((field) => {
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

                  const shouldApplyMultiplePrefill =
                    isPlacementSlipActivity ||
                    isHeldCoverNoteActivity ||
                    isPolicyHardCopyActivity ||
                    isPolicyConfirmationActivity;
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

                if (wasLeadInsurerCleared) {
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

                prefillNonLeadRows();
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
              const brokeragePercentage = Number(brokeragePercentageRaw) || 0;
              const brokerageAmount = Number(brokerageAmountRaw) || 0;

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
              const prevPercentage = Number(prevPercentageRaw) || 0;
              const prevAmount = Number(prevAmountRaw) || 0;

              const isPlacementSlip =
                currentActivityKey === "placement_slip_generation_activity";
              const placementNetPremium = isPlacementSlip
                ? (Number(values?.policyDetails?.basicPremium) || 0) +
                  (Number(values?.policyDetails?.srccAmount) || 0) +
                  (Number(
                    values?.policyDetails?.terrorismCommission ??
                      values?.policyDetails?.terrorismAmount
                  ) || 0)
                : 0;
              const prevPlacementNetPremium = isPlacementSlip
                ? (Number(prevValues?.policyDetails?.basicPremium) || 0) +
                  (Number(prevValues?.policyDetails?.srccAmount) || 0) +
                  (Number(
                    prevValues?.policyDetails?.terrorismCommission ??
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
                "brokeragePercentage",
                "brokerageAmount"
              );
              if (brokerageUpdate) {
                updates.policyDetails = {
                  ...(updates.policyDetails || values.policyDetails),
                  ...brokerageUpdate,
                };
              }

              if (!disableServiceTaxAutoCalculation) {
                // Service Tax
                const serviceTaxPercentage =
                  Number(values?.policyDetails?.serviceTaxPercentage) || 0;
                const serviceTaxAmount =
                  Number(values?.policyDetails?.serviceTaxAmount) || 0;
                const prevServiceTaxPercentage =
                  Number(prevValues?.policyDetails?.serviceTaxPercentage) || 0;
                const prevServiceTaxAmount =
                  Number(prevValues?.policyDetails?.serviceTaxAmount) || 0;

                const shouldUseBasicPremiumForTax =
                  activityMetaData?.activityKey ===
                    "placement_slip_generation_activity" && !isSriLankaUser;

                const serviceTaxBase = shouldUseBasicPremiumForTax
                  ? Number(values?.policyDetails?.basicPremium) || 0
                  : isPlacementSlip
                  ? isSriLankaUser && placementNetPremium > 0
                    ? placementNetPremium
                    : currentPlacementTotalPremium > 0
                    ? currentPlacementTotalPremium
                    : totalPremium
                  : totalPremium;

                const prevServiceTaxBase = shouldUseBasicPremiumForTax
                  ? Number(prevValues?.policyDetails?.basicPremium) || 0
                  : isPlacementSlip
                  ? isSriLankaUser && prevPlacementNetPremium > 0
                    ? prevPlacementNetPremium
                    : prevPlacementTotalPremium > 0
                    ? prevPlacementTotalPremium
                    : prevTotalPremium
                  : prevTotalPremium;

                const serviceTaxUpdate = calculatePercentageAmountUpdate(
                  serviceTaxBase,
                  serviceTaxPercentage,
                  serviceTaxAmount,
                  prevServiceTaxBase,
                  prevServiceTaxPercentage,
                  prevServiceTaxAmount,
                  "serviceTaxPercentage",
                  "serviceTaxAmount",
                  { skipCountryCheck: isSriLankaUser }
                );
                if (serviceTaxUpdate) {
                  updates.policyDetails = {
                    ...(updates.policyDetails || values.policyDetails),
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
                  terrorismField = "terrorismCommission",
                  serviceTaxField = "serviceTaxAmount",
                  totalField = "totalPremium",
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

                const brokerageUpdate = calculatePercentageAmountUpdate(
                  toNumericValue(mergedSectionValues?.[baseField]),
                  toNumericValue(mergedSectionValues?.brokeragePercentage),
                  toNumericValue(mergedSectionValues?.brokerageAmount),
                  toNumericValue(previousSectionValues?.[baseField]),
                  toNumericValue(previousSectionValues?.brokeragePercentage),
                  toNumericValue(previousSectionValues?.brokerageAmount),
                  "brokeragePercentage",
                  "brokerageAmount"
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

                const serviceTaxUpdate = calculatePercentageAmountUpdate(
                  toNumericValue(mergedSectionValues?.[baseField]),
                  toNumericValue(mergedSectionValues?.serviceTaxPercentage),
                  toNumericValue(mergedSectionValues?.serviceTaxAmount),
                  toNumericValue(previousSectionValues?.[baseField]),
                  toNumericValue(previousSectionValues?.serviceTaxPercentage),
                  toNumericValue(previousSectionValues?.serviceTaxAmount),
                  "serviceTaxPercentage",
                  "serviceTaxAmount"
                );

                if (serviceTaxUpdate) {
                  updates[sectionKey] = {
                    ...(updates[sectionKey] || currentSectionValues || {}),
                    ...serviceTaxUpdate,
                  };
                }
              };

              if (
                activityMetaData?.activityKey ===
                "placement_slip_generation_activity"
              ) {
                const mergedPolicyDetails = {
                  ...(values?.policyDetails || {}),
                  ...(updates.policyDetails || {}),
                };

                const basicPremium =
                  Number(mergedPolicyDetails?.basicPremium) || 0;
                const srccAmountPlacement =
                  Number(mergedPolicyDetails?.srccAmount) || 0;
                const serviceTaxAmountPlacement =
                  Number(mergedPolicyDetails?.serviceTaxAmount) || 0;
                const terrorismAmountPlacement =
                  Number(
                    mergedPolicyDetails?.terrorismCommission ??
                      mergedPolicyDetails?.terrorismAmount
                  ) || 0;

                const netPremiumPlacement =
                  basicPremium + srccAmountPlacement + terrorismAmountPlacement;

                const computedTotalPremium = isSriLankaUser
                  ? netPremiumPlacement
                  : netPremiumPlacement + serviceTaxAmountPlacement;
                const prevTotalPremiumPlacement =
                  Number(prevValues?.policyDetails?.totalPremium) || 0;
                const currentTotalPremiumPlacement =
                  Number(mergedPolicyDetails?.totalPremium) || 0;

                if (
                  !areNumbersClose(
                    computedTotalPremium,
                    prevTotalPremiumPlacement
                  ) ||
                  !areNumbersClose(
                    computedTotalPremium,
                    currentTotalPremiumPlacement
                  )
                ) {
                  updates.policyDetails = {
                    ...(updates.policyDetails || values.policyDetails),
                    totalPremium: computedTotalPremium,
                  };
                }
              }

              if (
                activityMetaData?.activityKey === "policy_hard_copy_activity"
              ) {
                ensureSectionTotalPremium("deviationSection", "premium");
                ensureSectionServiceTax("deviationSection", "premium");
                // Auto-calculate brokerage for policy hard copy deviation section
                const baseValues = { ...values, ...updates };
                const deviationPremium =
                  Number(baseValues?.deviationSection?.premium) || 0;
                const deviationBrokeragePercentageRaw =
                  baseValues?.deviationSection?.brokeragePercentage;
                const deviationBrokerageAmountRaw =
                  baseValues?.deviationSection?.brokerageAmount;
                const deviationBrokeragePercentage =
                  Number(deviationBrokeragePercentageRaw) || 0;
                const deviationBrokerageAmount =
                  Number(deviationBrokerageAmountRaw) || 0;

                const prevDeviationPremium =
                  Number(prevValues?.deviationSection?.premium) || 0;
                const prevDeviationPercentage =
                  Number(prevValues?.deviationSection?.brokeragePercentage) ||
                  0;
                const prevDeviationAmount =
                  Number(prevValues?.deviationSection?.brokerageAmount) || 0;

                const deviationUpdate = calculatePercentageAmountUpdate(
                  deviationPremium,
                  deviationBrokeragePercentage,
                  deviationBrokerageAmount,
                  prevDeviationPremium,
                  prevDeviationPercentage,
                  prevDeviationAmount,
                  "brokeragePercentage",
                  "brokerageAmount"
                );

                if (deviationUpdate) {
                  updates.deviationSection = {
                    ...(updates.deviationSection ||
                      baseValues.deviationSection),
                    ...deviationUpdate,
                  };
                }

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
                  updates.deviationSection = {
                    deviationsLid: null,
                    premium: Number(premiumResponseData?.basicPremium) ?? null,
                    brokeragePercentage:
                      Number(premiumResponseData?.brokeragePercentage) ?? null,
                    brokerageAmount:
                      Number(premiumResponseData?.brokerageAmount) ?? null,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  };
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
                  updates.deviationSection = {
                    ...(values.deviationSection || {}),
                    ...updates.deviationSection,
                    deviationsLid: null,
                    // premium: null,
                    // brokeragePercentage: null,
                    // brokerageAmount: null,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  };
                  updates.policyHardCopyCoversConfig = {
                    ...(activityMetaData?.coversPrefillData || {}),
                  };
                }

                // Clear deviation-related fields when toggles change
                if (
                  prevValues?.deviationSection?.deviationsLid !==
                  values?.deviationSection?.deviationsLid
                ) {
                  updates.deviationSection = {
                    ...(values.deviationSection || {}),
                    ...updates.deviationSection,
                    premium: Number(premiumResponseData?.basicPremium) ?? null,
                    brokeragePercentage:
                      Number(premiumResponseData?.brokeragePercentage) ?? null,
                    brokerageAmount:
                      Number(premiumResponseData?.brokerageAmount) ?? null,
                    coverages: null,
                    exclusions: null,
                    deductibles: null,
                  };
                }
              }
              if (
                activityMetaData?.activityKey === "policy_confirmation_activity"
              ) {
                ensureSectionTotalPremium(
                  "policyDataRectifiedSection",
                  "basicPremium"
                );
                ensureSectionServiceTax(
                  "policyDataRectifiedSection",
                  "basicPremium"
                );
                ensureSectionBrokerage(
                  "policyDataRectifiedSection",
                  "basicPremium"
                );

                if (
                  prevValues?.policyDataWrongSection?.policyDataWrongLid !==
                  values?.policyDataWrongSection?.policyDataWrongLid
                ) {
                  updates.policyDataWrongSection = {
                    ...(values.policyDataWrongSection || {}),
                    ...updates.policyDataWrongSection,
                    brokeragePercentage:
                      Number(premiumResponseData?.brokeragePercentage) ?? null,
                    brokerageAmount:
                      Number(premiumResponseData?.brokerageAmount) ?? null,
                  };
                  updates.deviationSection = {
                    ...(values.deviationSection || {}),
                    ...updates.deviationSection,
                    deviations: null,
                  };
                  updates.policyDataRectifiedSection = {
                    ...(values.policyDataRectifiedSection || {}),
                    ...updates.policyDataRectifiedSection,
                    policyDataRectifiedLid: null,
                    resolutionLid: null,
                    brokeragePercentage:
                      Number(premiumResponseData?.brokeragePercentage) ?? null,
                    brokerageAmount:
                      Number(premiumResponseData?.brokerageAmount) ?? null,
                  };
                }
              }

              // --- held cover note: reset fields on toggle changes (without affecting other activities)
              if (
                activityMetaData?.activityKey === "held_cover_note_activity"
              ) {
                ensureSectionTotalPremium(
                  "premiumReceiptDetailsSection",
                  "basicPremium"
                );
                ensureSectionServiceTax(
                  "premiumReceiptDetailsSection",
                  "basicPremium"
                );
                ensureSectionBrokerage(
                  "premiumReceiptDetailsSection",
                  "basicPremium"
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
                activityMetaData?.activityKey === "policy_hard_copy_activity"
              ) {
                setIsPolicyHardCopyDisabled(
                  isPolicyHardCopySubmitDisabled(updatedValues, dynamicValues)
                );
              }

              if (activityMetaData?.activityKey) {
                if (
                  activityMetaData?.activityKey ===
                  "mandate_details_entry_activity"
                ) {
                  const newValue =
                    updatedValues?.mandateDetailsFromFields
                      ?.compensationTypeLid;
                  setCompensationTypeLid(newValue);
                }
              }
              if (
                activityMetaData?.activityKey === "held_cover_note_activity"
              ) {
                const deviationId =
                  updatedValues?.placementSlipDeviationsSection
                    ?.placementSlipDeviationsLid;
                setHeldCoverNoteDeviation(deviationId);
                const deviationsAddressedLid =
                  updatedValues?.deviationsAddressedSection
                    ?.deviationsAddressedLid;
                setDeviationsAddressedLid(deviationsAddressedLid);
                const revisedLid =
                  updatedValues?.deviationsAddressedSection
                    ?.revisedHeldCoverNoteLid ?? null;
                setRevisedHeldCoverNoteId(revisedLid);
              }
              if (
                activityMetaData?.activityKey === "policy_hard_copy_activity"
              ) {
                const deviationId =
                  updatedValues?.deviationsAddressedSection
                    ?.deviationsAddressedLid;
                setDeviationsAddressedLid(deviationId);
                const anyDeviation =
                  updatedValues?.deviationsAddressedSection
                    ?.deviationCoveragesLid;
                setDeviationCoveragesId(anyDeviation);
                const isDeviationsYesInHardCopy =
                  updatedValues?.deviationSection?.deviationsLid;
                setIsCoverageDeviationsYesInPolicyHardCopy(
                  isDeviationsYesInHardCopy
                );
              }
              if (
                activityMetaData?.activityKey === "policy_confirmation_activity"
              ) {
                const deviationId =
                  updatedValues?.policyDataWrongSection?.policyDataWrongLid;
                setHeldCoverNoteDeviation(deviationId);

                const rectifiedLid =
                  updatedValues?.policyDataRectifiedSection
                    ?.policyDataRectifiedLid;
                setIsPolicyDataRectified(rectifiedLid);
              }
              if (
                activityMetaData?.activityKey ===
                "placement_slip_generation_activity"
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
          {activity?.activityKey === "quote_comparison_report_activity" ? (
            <ActivitiesButtonsContainer>
              {qouteButtonsConfig?.map((qouteButton) => {
                const actionHandler = actionMap[qouteButton.onClick || ""];

                return (
                  <Button
                    key={qouteButton.key}
                    variantType={qouteButton.componentProps?.variantType}
                    style={qouteButton.componentProps?.style}
                    onClick={actionHandler}
                    disabled={
                      (qouteButton.name === "generateQuoteComparison"
                        ? !activityMetaData?.isEnabled
                        : isFormDisabled || !canEditActivity) || isSubmitting
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
                    <div>
                      {getActivityData?.data?.isgAssignee?.name ===
                      getActivityData?.data?.isgOwner?.name ? (
                        <div>
                          {ISG_ASSIGNMENT_PENDING_TEXT}{" "}
                          <b>{getActivityData?.data?.isgAssignee?.name}</b>
                        </div>
                      ) : (
                        <>
                          <div>
                            {ISG_ASSIGNED_TO_TEXT}{" "}
                            <b>
                              {getActivityData?.data?.isgOwner?.name || "--"}
                            </b>
                          </div>
                        </>
                      )}
                    </div>
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
                    isButtonDisabled = isButtonDisabled || isSubmitting;

                    // Additional condition to disable button for data validation activity at initial step
                    if (
                      activity?.activityKey === "data_validation_activity" &&
                      validationStep.opportunity === "initial"
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

export default CommonActivity;
