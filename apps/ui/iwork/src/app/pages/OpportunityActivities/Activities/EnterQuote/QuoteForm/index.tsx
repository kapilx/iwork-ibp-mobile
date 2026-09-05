import React, {
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  endPoints,
  SUCCESS_MESSAGE,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  useApiMutation,
  setToastMessage,
  useApiQuery,
  formatDate,
} from "@ui/ui-lib";

import {
  ADD_QUOTE,
  ALERT_MESSAGES,
  DELETE_QUOTE_CONFIRMATION_MESSAGE,
  ENDORSEMENT_TOASTS,
  ENTER_QUTATIONS,
  QUOTE,
  QUOTE_ADDED_SUCCESSFULLY,
  QUOTE_DELETED_SUCCESSFULLY,
  QUOTE_UPDATED_SUCCESSFULLY,
  SAVE_QUOTE,
  SAVE_UPDATED_QUOTE,
} from "../../../../../constants/index";

import { displayBasicDetails, quoteDetailsConfig } from "./formConfig";
import {
  AddQuoteButton,
  BasicContainer,
  CommonQuoteContentContainer,
  CommonQuoteTypography,
  QuoteFormContainer,
  CreateQuoteContainer,
  QuoteContentContainer,
  QuoteDetailsContainer,
  QuoteEntrySpan,
  QuoteHeaderContainer,
  QuoteTypography,
  PlusIconStyles,
  ImageStyles,
} from "./styles";
import EditPencilIcon from "../../../../../assets/svgs/edit-pencil-icon.svg";
import thrashIcon from "../../../../../assets/svgs/thrash-icon.svg";

import {
  MainCoverDetailsContainer,
  VersionFormButton,
} from "../../BrokingSlipGeneration/VersionForm/styles";

import PlusIcon from "../../../../../assets/svgs/plus-icon.svg";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IconAndTextWrapper } from "../../../../../components/VersionsTabs/styles";
import { HTTP_METHODS } from "@ui/ui-lib";
import dayjs from "dayjs";

import { getCountrySpecificConfig } from "../../../Constants/countryConfigUtils";
import { calculatePercentageAmountUpdate } from "../../../../../Utils/calculatePercentageAmountUpdate";
import { useAutoPopulateCalculatedFields } from "../../../Constants/autoPopulateFields";

type QuoteFormValues = Record<string, any>;

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

const isCompleteAmountValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (normalized === "") {
    return false;
  }

  return /^\d+(\.\d{2})?$/.test(normalized);
};

const isActiveField = (fieldName: string): boolean => {
  if (typeof document === "undefined") {
    return false;
  }

  const activeName =
    (document.activeElement as HTMLElement | null)?.getAttribute("name") ?? "";

  return activeName.includes(fieldName);
};

const resolveChangedField = (
  percentageValue: unknown,
  amountValue: unknown,
  prevPercentageValue: unknown,
  prevAmountValue: unknown,
  parsedPercentageValue: number,
  parsedAmountValue: number,
  prevParsedPercentageValue: number,
  prevParsedAmountValue: number
): "percentage" | "amount" | undefined => {
  const percentageRawChanged = percentageValue !== prevPercentageValue;
  const amountRawChanged = amountValue !== prevAmountValue;
  const percentageParsedChanged =
    parsedPercentageValue !== prevParsedPercentageValue;
  const amountParsedChanged = parsedAmountValue !== prevParsedAmountValue;

  if (amountRawChanged || amountParsedChanged) {
    return "amount";
  }

  if (percentageRawChanged || percentageParsedChanged) {
    return "percentage";
  }

  return undefined;
};

const getNumericPrefillValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = parseNumericFieldValue(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createQuoteValuesChangeHandler = (
  formRef: React.RefObject<NestedGroupedDataCollectionHandle>,
  prevValuesRef: MutableRefObject<QuoteFormValues | null>,
  skipNextChangeRef: MutableRefObject<boolean>,
  autoPopulateHandler: (values: QuoteFormValues) => void,
  isSriLankaUser: boolean
) => {
  const safeAutoPopulate =
    typeof autoPopulateHandler === "function" ? autoPopulateHandler : () => {};

  return (values: QuoteFormValues) => {
    if (!values || typeof values !== "object") {
      prevValuesRef.current = values ?? null;
      return;
    }

    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      safeAutoPopulate(values);
      prevValuesRef.current = cloneFormValues(values);
      return;
    }

    safeAutoPopulate(values);

    const prevValues = prevValuesRef.current || {};

    const calculations: Array<{
      base: number;
      percentage: number;
      amount: number;
      prevBase: number;
      prevPercentage: number;
      prevAmount: number;
      rawPercentage: unknown;
      rawAmount: unknown;
      prevRawPercentage: unknown;
      prevRawAmount: unknown;
      allowReverseWhenAmountChanged?: boolean;
      changedField?: "percentage" | "amount";
      percentageField: string;
      amountField: string;
    }> = [];

    if (!isSriLankaUser) {
      calculations.push(
        {
          base: parseNumericFieldValue(values?.quoteDetails?.netPremium),
          percentage: parseNumericFieldValue(
            values?.quoteDetails?.gstPercentage
          ),
          amount: parseNumericFieldValue(values?.quoteDetails?.gstAmount),
          prevBase: parseNumericFieldValue(
            prevValues?.quoteDetails?.netPremium
          ),
          prevPercentage: parseNumericFieldValue(
            prevValues?.quoteDetails?.gstPercentage
          ),
          prevAmount: parseNumericFieldValue(
            prevValues?.quoteDetails?.gstAmount
          ),
          rawPercentage: values?.quoteDetails?.gstPercentage,
          rawAmount: values?.quoteDetails?.gstAmount,
          prevRawPercentage: prevValues?.quoteDetails?.gstPercentage,
          prevRawAmount: prevValues?.quoteDetails?.gstAmount,
          allowReverseWhenAmountChanged: isCompleteAmountValue(
            values?.quoteDetails?.gstAmount
          ),
          changedField: resolveChangedField(
            values?.quoteDetails?.gstPercentage,
            values?.quoteDetails?.gstAmount,
            prevValues?.quoteDetails?.gstPercentage,
            prevValues?.quoteDetails?.gstAmount,
            parseNumericFieldValue(values?.quoteDetails?.gstPercentage),
            parseNumericFieldValue(values?.quoteDetails?.gstAmount),
            parseNumericFieldValue(prevValues?.quoteDetails?.gstPercentage),
            parseNumericFieldValue(prevValues?.quoteDetails?.gstAmount)
          ),
          percentageField: "gstPercentage",
          amountField: "gstAmount",
        }
      );
    }

    calculations.push(
      {
        base: parseNumericFieldValue(values?.quoteDetails?.basicPremium),
        percentage: parseNumericFieldValue(
          values?.quoteDetails?.basicBrokeragePercentage
        ),
        amount: parseNumericFieldValue(
          values?.quoteDetails?.basicBrokerageAmount
        ),
        prevBase: parseNumericFieldValue(
          prevValues?.quoteDetails?.basicPremium
        ),
        prevPercentage: parseNumericFieldValue(
          prevValues?.quoteDetails?.basicBrokeragePercentage
        ),
        prevAmount: parseNumericFieldValue(
          prevValues?.quoteDetails?.basicBrokerageAmount
        ),
        rawPercentage: values?.quoteDetails?.basicBrokeragePercentage,
        rawAmount: values?.quoteDetails?.basicBrokerageAmount,
        prevRawPercentage: prevValues?.quoteDetails?.basicBrokeragePercentage,
        prevRawAmount: prevValues?.quoteDetails?.basicBrokerageAmount,
        allowReverseWhenAmountChanged: isCompleteAmountValue(
          values?.quoteDetails?.basicBrokerageAmount
        ),
        changedField: resolveChangedField(
          values?.quoteDetails?.basicBrokeragePercentage,
          values?.quoteDetails?.basicBrokerageAmount,
          prevValues?.quoteDetails?.basicBrokeragePercentage,
          prevValues?.quoteDetails?.basicBrokerageAmount,
          parseNumericFieldValue(values?.quoteDetails?.basicBrokeragePercentage),
          parseNumericFieldValue(values?.quoteDetails?.basicBrokerageAmount),
          parseNumericFieldValue(
            prevValues?.quoteDetails?.basicBrokeragePercentage
          ),
          parseNumericFieldValue(prevValues?.quoteDetails?.basicBrokerageAmount)
        ),
        percentageField: "basicBrokeragePercentage",
        amountField: "basicBrokerageAmount",
      },
      {
        base: parseNumericFieldValue(values?.quoteDetails?.srccAmount),
        percentage: parseNumericFieldValue(
          values?.quoteDetails?.srccPercentage
        ),
        amount: parseNumericFieldValue(
          values?.quoteDetails?.srccBrokerageAmount
        ),
        prevBase: parseNumericFieldValue(prevValues?.quoteDetails?.srccAmount),
        prevPercentage: parseNumericFieldValue(
          prevValues?.quoteDetails?.srccPercentage
        ),
        prevAmount: parseNumericFieldValue(
          prevValues?.quoteDetails?.srccBrokerageAmount
        ),
        rawPercentage: values?.quoteDetails?.srccPercentage,
        rawAmount: values?.quoteDetails?.srccBrokerageAmount,
        prevRawPercentage: prevValues?.quoteDetails?.srccPercentage,
        prevRawAmount: prevValues?.quoteDetails?.srccBrokerageAmount,
        allowReverseWhenAmountChanged: isCompleteAmountValue(
          values?.quoteDetails?.srccBrokerageAmount
        ),
        changedField: resolveChangedField(
          values?.quoteDetails?.srccPercentage,
          values?.quoteDetails?.srccBrokerageAmount,
          prevValues?.quoteDetails?.srccPercentage,
          prevValues?.quoteDetails?.srccBrokerageAmount,
          parseNumericFieldValue(values?.quoteDetails?.srccPercentage),
          parseNumericFieldValue(values?.quoteDetails?.srccBrokerageAmount),
          parseNumericFieldValue(prevValues?.quoteDetails?.srccPercentage),
          parseNumericFieldValue(prevValues?.quoteDetails?.srccBrokerageAmount)
        ),
        percentageField: "srccPercentage",
        amountField: "srccBrokerageAmount",
      },
      {
        base: parseNumericFieldValue(values?.quoteDetails?.terrorism),
        percentage: parseNumericFieldValue(
          values?.quoteDetails?.terrorismBrokeragePercentage
        ),
        amount: parseNumericFieldValue(values?.quoteDetails?.tcBrokerageAmount),
        prevBase: parseNumericFieldValue(prevValues?.quoteDetails?.terrorism),
        prevPercentage: parseNumericFieldValue(
          prevValues?.quoteDetails?.terrorismBrokeragePercentage
        ),
        prevAmount: parseNumericFieldValue(
          prevValues?.quoteDetails?.tcBrokerageAmount
        ),
        rawPercentage: values?.quoteDetails?.terrorismBrokeragePercentage,
        rawAmount: values?.quoteDetails?.tcBrokerageAmount,
        prevRawPercentage:
          prevValues?.quoteDetails?.terrorismBrokeragePercentage,
        prevRawAmount: prevValues?.quoteDetails?.tcBrokerageAmount,
        allowReverseWhenAmountChanged: isCompleteAmountValue(
          values?.quoteDetails?.tcBrokerageAmount
        ),
        changedField: resolveChangedField(
          values?.quoteDetails?.terrorismBrokeragePercentage,
          values?.quoteDetails?.tcBrokerageAmount,
          prevValues?.quoteDetails?.terrorismBrokeragePercentage,
          prevValues?.quoteDetails?.tcBrokerageAmount,
          parseNumericFieldValue(
            values?.quoteDetails?.terrorismBrokeragePercentage
          ),
          parseNumericFieldValue(values?.quoteDetails?.tcBrokerageAmount),
          parseNumericFieldValue(
            prevValues?.quoteDetails?.terrorismBrokeragePercentage
          ),
          parseNumericFieldValue(prevValues?.quoteDetails?.tcBrokerageAmount)
        ),
        percentageField: "terrorismBrokeragePercentage",
        amountField: "tcBrokerageAmount",
      }
    );

    if (isSriLankaUser) {
      const currentNetPremium = parseNumericFieldValue(
        values?.quoteDetails?.netPremium
      );
      const currentAdminCharges = parseNumericFieldValue(
        values?.quoteDetails?.adminCharges
      );
      const currentOther = parseNumericFieldValue(values?.quoteDetails?.other);
      const currentCessAmount = parseNumericFieldValue(
        values?.quoteDetails?.cessAmount
      );
      const currentFee = parseNumericFieldValue(values?.quoteDetails?.fee);

      const currentVatBase =
        currentNetPremium +
        currentAdminCharges +
        currentOther +
        currentCessAmount +
        currentFee;

      const prevNetPremium = parseNumericFieldValue(
        prevValues?.quoteDetails?.netPremium
      );
      const prevAdminCharges = parseNumericFieldValue(
        prevValues?.quoteDetails?.adminCharges
      );
      const prevOther = parseNumericFieldValue(prevValues?.quoteDetails?.other);
      const prevCessAmount = parseNumericFieldValue(
        prevValues?.quoteDetails?.cessAmount
      );
      const prevFee = parseNumericFieldValue(prevValues?.quoteDetails?.fee);

      const prevVatBase =
        prevNetPremium +
        prevAdminCharges +
        prevOther +
        prevCessAmount +
        prevFee;

      calculations.push({
        base: currentVatBase,
        percentage: parseNumericFieldValue(values?.quoteDetails?.gstPercentage),
        amount: parseNumericFieldValue(values?.quoteDetails?.gstAmount),
        prevBase: prevVatBase,
        prevPercentage: parseNumericFieldValue(
          prevValues?.quoteDetails?.gstPercentage
        ),
        prevAmount: parseNumericFieldValue(prevValues?.quoteDetails?.gstAmount),
        rawPercentage: values?.quoteDetails?.gstPercentage,
        rawAmount: values?.quoteDetails?.gstAmount,
        prevRawPercentage: prevValues?.quoteDetails?.gstPercentage,
        prevRawAmount: prevValues?.quoteDetails?.gstAmount,
        allowReverseWhenAmountChanged:
          isCompleteAmountValue(values?.quoteDetails?.gstAmount) &&
          !isActiveField("gstAmount"),
        changedField: resolveChangedField(
          values?.quoteDetails?.gstPercentage,
          values?.quoteDetails?.gstAmount,
          prevValues?.quoteDetails?.gstPercentage,
          prevValues?.quoteDetails?.gstAmount,
          parseNumericFieldValue(values?.quoteDetails?.gstPercentage),
          parseNumericFieldValue(values?.quoteDetails?.gstAmount),
          parseNumericFieldValue(prevValues?.quoteDetails?.gstPercentage),
          parseNumericFieldValue(prevValues?.quoteDetails?.gstAmount)
        ),
        percentageField: "gstPercentage",
        amountField: "gstAmount",
      });
    }

    const brokerageUpdates = calculations.reduce<Record<string, number | "">>(
      (acc, item) => {
        const update = calculatePercentageAmountUpdate(
          item.base,
          item.percentage,
          item.amount,
          item.prevBase,
          item.prevPercentage,
          item.prevAmount,
          item.percentageField,
          item.amountField,
          {
            skipCountryCheck: true,
            preferPercentageInput: true,
            allowReverseWhenAmountChanged:
              item.allowReverseWhenAmountChanged ?? true,
            changedField: item.changedField,
          }
        );

        if (update && Object.keys(update).length > 0) {
          const shouldSuppressAmountUpdate =
            isActiveField(item.amountField) &&
            (item.amountField === "basicBrokerageAmount" ||
              item.amountField === "srccBrokerageAmount" ||
              item.amountField === "tcBrokerageAmount");

          if (
            shouldSuppressAmountUpdate &&
            Object.prototype.hasOwnProperty.call(update, item.amountField)
          ) {
            // Keep percentage updates while typing amount, but don't overwrite the active amount field.
            const { [item.amountField]: _ignored, ...rest } = update;
            if (Object.keys(rest).length === 0) {
              return acc;
            }
            return { ...acc, ...rest };
          }

          return { ...acc, ...update };
        }
        return acc;
      },
      {}
    );

    if (!brokerageUpdates || Object.keys(brokerageUpdates).length === 0) {
      prevValuesRef.current = cloneFormValues(values);
      return;
    }

    if (formRef.current?.setValues) {
      const mergedQuoteDetails = {
        ...(values?.quoteDetails || {}),
        ...brokerageUpdates,
      };

      skipNextChangeRef.current = true;
      formRef.current.setValues({
        quoteDetails: mergedQuoteDetails,
      });

      prevValuesRef.current = cloneFormValues({
        ...values,
        quoteDetails: mergedQuoteDetails,
      });
      return;
    }

    prevValuesRef.current = cloneFormValues(values);
  };
};

const createInsurerLocationAutoFillHandler = (
  baseHandler: (values: QuoteFormValues) => void,
  formRef: React.RefObject<NestedGroupedDataCollectionHandle>,
  skipNextChangeRef: MutableRefObject<boolean>,
  insurerLocationMap: Record<string, number>
) => {
  return (values: QuoteFormValues) => {
    // Run existing auto-populate / brokerage logic first
    baseHandler(values);

    if (!values || typeof values !== "object") return;

    const quoteDetails = values.quoteDetails || {};
    const insurerId = quoteDetails.insurerId;

    // No insurer selected yet
    if (!insurerId) return;

    const nextLocationId = insurerLocationMap[String(insurerId)];
    if (!nextLocationId) return;

    const currentLocationId = quoteDetails.insurerLocationId;
    if (currentLocationId === nextLocationId) return;

    if (!formRef.current?.setValues) return;

    const nextQuoteDetails = {
      ...quoteDetails,
      insurerLocationId: nextLocationId, // 🔥 this matches formConfig
    };

    // IMPORTANT: defer the update so it runs AFTER clearFieldsOnChange / dependent logic
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        skipNextChangeRef.current = true;
        formRef.current?.setValues({
          quoteDetails: nextQuoteDetails,
        });
      });
    } else {
      // Fallback (SSR etc.)
      skipNextChangeRef.current = true;
      formRef.current.setValues({
        quoteDetails: nextQuoteDetails,
      });
    }
  };
};

const ensureBrokerageDefaults = (
  data: QuoteFormValues | null | undefined
): QuoteFormValues | null | undefined => {
  if (!data || typeof data !== "object") {
    return data;
  }

  const quoteDetails = {
    ...(data.quoteDetails || {}),
  };

  if (
    quoteDetails.basicBrokerageAmount === undefined ||
    quoteDetails.basicBrokerageAmount === null ||
    quoteDetails.basicBrokerageAmount === ""
  ) {
    quoteDetails.basicBrokerageAmount = 0;
  } else if (typeof quoteDetails.basicBrokerageAmount === "string") {
    quoteDetails.basicBrokerageAmount = parseNumericFieldValue(
      quoteDetails.basicBrokerageAmount
    );
  }

  if (
    quoteDetails.srccBrokerageAmount === undefined ||
    quoteDetails.srccBrokerageAmount === null ||
    quoteDetails.srccBrokerageAmount === ""
  ) {
    quoteDetails.srccBrokerageAmount = 0;
  } else if (typeof quoteDetails.srccBrokerageAmount === "string") {
    quoteDetails.srccBrokerageAmount = parseNumericFieldValue(
      quoteDetails.srccBrokerageAmount
    );
  }

  if (
    quoteDetails.tcBrokerageAmount === undefined ||
    quoteDetails.tcBrokerageAmount === null ||
    quoteDetails.tcBrokerageAmount === ""
  ) {
    quoteDetails.tcBrokerageAmount = 0;
  } else if (typeof quoteDetails.tcBrokerageAmount === "string") {
    quoteDetails.tcBrokerageAmount = parseNumericFieldValue(
      quoteDetails.tcBrokerageAmount
    );
  }

  if (
    quoteDetails.basicBrokeragePercentage === undefined ||
    quoteDetails.basicBrokeragePercentage === null ||
    quoteDetails.basicBrokeragePercentage === ""
  ) {
    quoteDetails.basicBrokeragePercentage = 0;
  } else if (typeof quoteDetails.basicBrokeragePercentage === "string") {
    quoteDetails.basicBrokeragePercentage = parseNumericFieldValue(
      quoteDetails.basicBrokeragePercentage
    );
  }

  if (
    quoteDetails.srccPercentage === undefined ||
    quoteDetails.srccPercentage === null ||
    quoteDetails.srccPercentage === ""
  ) {
    quoteDetails.srccPercentage = 0;
  } else if (typeof quoteDetails.srccPercentage === "string") {
    quoteDetails.srccPercentage = parseNumericFieldValue(
      quoteDetails.srccPercentage
    );
  }

  if (
    quoteDetails.terrorismBrokeragePercentage === undefined ||
    quoteDetails.terrorismBrokeragePercentage === null ||
    quoteDetails.terrorismBrokeragePercentage === ""
  ) {
    quoteDetails.terrorismBrokeragePercentage = 0;
  } else if (typeof quoteDetails.terrorismBrokeragePercentage === "string") {
    quoteDetails.terrorismBrokeragePercentage = parseNumericFieldValue(
      quoteDetails.terrorismBrokeragePercentage
    );
  }

  if (
    quoteDetails.brokerageAmount !== undefined &&
    quoteDetails.brokerageAmount !== null &&
    quoteDetails.brokerageAmount !== "" &&
    typeof quoteDetails.brokerageAmount === "string"
  ) {
    quoteDetails.brokerageAmount = parseNumericFieldValue(
      quoteDetails.brokerageAmount
    );
  }

  return {
    ...data,
    quoteDetails,
  };
};

const sanitizeQuoteFormResult = (
  data: QuoteFormValues | null | undefined
): QuoteFormValues | undefined => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  if (
    data.quoteDetails &&
    typeof data.quoteDetails === "object" &&
    "brokeragePercent" in data.quoteDetails
  ) {
    return {
      ...data,
      quoteDetails: {
        ...data.quoteDetails,
        brokeragePercent: undefined,
      },
    };
  }

  return data;
};

interface QuoteFormProps {
  selectedTab: string;
  quoteVersionConfig: any;
  activity: any;
  disableAllFormFields: boolean;
  setQuoteEntryData: React.Dispatch<React.SetStateAction<number>>;
  onQuoteCountChange: (tabId: string, count: number) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  selectedTab,
  quoteVersionConfig,
  activity,
  disableAllFormFields,
  setQuoteEntryData,
  onQuoteCountChange,
}) => {
  const [quoteData, setQuoteData] = React.useState([]);
  const [enableForm, setEnableForm] = React.useState(true);
  const [editQuoteIndex, setEditQuoteIndex] = useState<number | null>(null);

  const addQuoteRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const editQuoteRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const addQuotePrevValuesRef = useRef<QuoteFormValues | null>(null);
  const editQuotePrevValuesRef = useRef<QuoteFormValues | null>(null);
  const addQuoteSkipNextChangeRef = useRef(false);
  const editQuoteSkipNextChangeRef = useRef(false);
  const shouldForcePrefillRef = useRef(true);
  const hasInitializedEnableFormRef = useRef(false);

  const [isLoading, setLoading] = React.useState(false);

  const isSriLankaUser = useMemo(
    () =>
      getCountrySpecificConfig(false, {
        "Sri Lanka": true,
      }),
    []
  );

  const { id: opportunityId } = useParams<{ id: string }>();

  const dispatch = useDispatch();

  // Function to scroll to the accordion header on validation failure
  const scrollToAccordionHeader = () => {
    const accordionEl = formContainerRef.current?.closest(
      '[data-testid="Root-accordion"]'
    ) as HTMLElement | null;
    accordionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const {
    data: versionData,
    isLoading: isVersionLoading,
    isError: isVersionError,
  } = useApiQuery({
    queryKey: ["versionData", selectedTab, opportunityId],
    url: endPoints.getopportunityVersionById(opportunityId, selectedTab),
  });

  const {
    data: quotesList,
    isLoading: quoteGetLoading,
    isError: quoteGetError,
  } = useApiQuery({
    queryKey: ["manageQuote", opportunityId, selectedTab],
    url: endPoints.getAllQuotesByBrokingSlipId(Number(selectedTab)),
  });

  const { data: preferredInsurersData } = useApiQuery({
    queryKey: ["preferredInsurersForQuotes", opportunityId],
    url: endPoints.preferredInsurersByOpportunityId(Number(opportunityId)),
  });

  const insurerLocationMap = useMemo(() => {
    const preferredList = Array.isArray(
      preferredInsurersData?.data?.preferredInsurers?.data
    )
      ? preferredInsurersData.data.preferredInsurers.data
      : Array.isArray(preferredInsurersData?.preferredInsurers?.data)
      ? preferredInsurersData.preferredInsurers.data
      : Array.isArray(preferredInsurersData?.data?.data)
      ? preferredInsurersData.data.data
      : [];

    return preferredList.reduce((acc: Record<string, number>, item: any) => {
      const insurerId = item?.insurerId ?? item?.id;
      const locationId = item?.insurerBranchId;

      if (insurerId && locationId) {
        acc[String(insurerId)] = locationId;
      }

      return acc;
    }, {} as Record<string, number>);
  }, [preferredInsurersData]);

  const basicPremiumPrefill = quotesList?.data?.basicPremium;
  const brokeragePercentPrefill = quotesList?.data?.brokeragePercentage;
  const brokerageAmountPrefill = quotesList?.data?.brokerageAmount;

  const quotePrefillDefaults = useMemo(() => {
    const defaults: Record<string, number> = {};
    const versionDetails = versionData?.data?.formData?.versionDetails ?? {};

    const resolvedBasicPremium =
      basicPremiumPrefill ??
      getNumericPrefillValue(versionDetails?.basicPremium);
    const resolvedBrokeragePercentage =
      brokeragePercentPrefill ??
      getNumericPrefillValue(versionDetails?.brokeragePercentage);
    const resolvedBrokerageAmount =
      brokerageAmountPrefill ??
      getNumericPrefillValue(versionDetails?.brokerageAmount);

    if (resolvedBasicPremium !== undefined) {
      defaults.basicPremium = resolvedBasicPremium;
    }

    if (resolvedBrokeragePercentage !== undefined) {
      defaults.basicBrokeragePercentage = resolvedBrokeragePercentage;
    }

    if (resolvedBrokerageAmount !== undefined) {
      defaults.brokerageAmount = resolvedBrokerageAmount;
    }

    return defaults;
  }, [
    basicPremiumPrefill,
    brokerageAmountPrefill,
    brokeragePercentPrefill,
    versionData?.data?.formData?.versionDetails?.basicPremium,
    versionData?.data?.formData?.versionDetails?.brokeragePercentage,
    versionData?.data?.formData?.versionDetails?.brokerageAmount,
  ]);

  // Update state when API response changes
  useEffect(() => {
    if (quotesList?.data?.quotes) {
      setQuoteData(quotesList.data?.quotes || []);
      const count = Array.isArray(quotesList?.data?.quotes)
        ? quotesList.data.quotes.length
        : 0;
      onQuoteCountChange(String(selectedTab), count);

      // Avoid auto-opening a new blank quote when existing quotes are present
      if (!hasInitializedEnableFormRef.current && count > 0) {
        setEnableForm(false);
        hasInitializedEnableFormRef.current = true;
      }
    }
  }, [quotesList]);

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

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        setLoading(false);
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
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

  const handleSaveQuote = async () => {
    const formData = await addQuoteRef.current?.submitAll?.();

    if (formData?.isAllValid) {
      const sanitizedResult =
        sanitizeQuoteFormResult(formData?.result as QuoteFormValues) ?? {};

      const payload = {
        opportunityId: Number(opportunityId),
        opportunityActivityId: activity?.opportunityActivityId,
        brokingSlipId: selectedTab,
        ...sanitizedResult,
        documents: transformDocuments(sanitizedResult?.documents || []),
        activityStatusKey: "COMPLETE_ACTIVITY",
      };

      mutation.mutate(
        {
          endpoint: endPoints.opportunityManagement,
          method: HTTP_METHODS.POST,
          data: payload,
        },
        {
          onSuccess: (response) => {
            setEnableForm(false);
            setQuoteData((prev) => {
              const next = [...prev, response.data];
              onQuoteCountChange(String(selectedTab), next.length);
              return next;
            });
            dispatch(setToastMessage(QUOTE_ADDED_SUCCESSFULLY));
          },
        }
      );
    } else {
      // Scroll to accordion header if validation fails
      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
      );
      scrollToAccordionHeader();
    }
  };

  const updateQuoteById = async (quote: any, index: number) => {
    const formData = await editQuoteRef.current?.submitAll?.();

    if (formData?.isAllValid) {
      setLoading(true);
      const sanitizedResult =
        sanitizeQuoteFormResult(formData?.result as QuoteFormValues) ?? {};

      const payload = {
        opportunityId: Number(opportunityId),
        opportunityActivityId: activity?.opportunityActivityId,
        brokingSlipId: selectedTab,
        ...sanitizedResult,
        documents: transformDocuments(sanitizedResult?.documents || []),
        activityStatusKey: "COMPLETE_ACTIVITY",
      };

      mutation.mutate(
        {
          endpoint: endPoints.updateQuote(quote.id),
          method: HTTP_METHODS.PUT,
          data: payload,
        },
        {
          onSuccess: (response) => {
            setEditQuoteIndex(null);
            setQuoteData((prevData) =>
              prevData.map((q, idx) =>
                idx === index ? { ...response.data } : q
              )
            );
            dispatch(setToastMessage(QUOTE_UPDATED_SUCCESSFULLY));
          },
        }
      );
    } else {
      // Scroll to accordion header if validation fails
      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.PLEASE_FILL_ALL_REQUIRED_FIELDS)
      );
      scrollToAccordionHeader();
    }
  };

  const handleEditQuote = (quote: any, index: number) => {
    setEditQuoteIndex(index);
  };

  const handleDeleteQuote = (quote: any, index: number) => {
    const result = window.confirm(DELETE_QUOTE_CONFIRMATION_MESSAGE);

    if (!result) return;

    mutation.mutate(
      {
        endpoint: endPoints.updateQuote(quote.id),
        method: HTTP_METHODS.DELETE,
        data: {},
      },
      {
        onSuccess: () => {
          setQuoteData((prev) => {
            const next = prev.filter((_, i) => i !== index);
            onQuoteCountChange(String(selectedTab), next.length);
            return next;
          });
          dispatch(setToastMessage(QUOTE_DELETED_SUCCESSFULLY));
        },
      }
    );
  };

  const quoteBasicDetails = {
    createdOn: quotesList?.data?.createdAt
      ? formatDate(quotesList?.data?.createdAt)
      : "-",
    sumInsured: quotesList?.data?.sumInsured,
    policyFromTo:
      quotesList?.data?.policyFrom && quotesList?.data?.policyTo
        ? `${formatDate(quotesList?.data?.policyFrom)} - ${formatDate(
            quotesList?.data?.policyTo
          )}`
        : "-",
  };

  const displayQuotes = () => {
    return quoteData?.map((quote, idx) => {
      const title = `${formatValue(
        getNestedValue(quote, "insurerName")
      )}- ${formatValue(
        getNestedValue(quote, "formData.quoteDetails.basicPremium")
      )}`;

      return (
        <>
          {editQuoteIndex !== idx ? (
            <QuoteDetailsContainer key={idx} isFirst={idx === 0}>
              <QuoteHeaderContainer>
                <QuoteTypography>{title}</QuoteTypography>
                {!disableAllFormFields && (
                  <IconAndTextWrapper>
                    <ImageStyles
                      onClick={() => handleEditQuote(quote, idx)}
                      src={EditPencilIcon}
                      alt="Edit pencil Icon"
                    />
                    <ImageStyles
                      onClick={() => handleDeleteQuote(quote, idx)}
                      src={thrashIcon}
                      alt="delete Icon"
                    />
                  </IconAndTextWrapper>
                )}
              </QuoteHeaderContainer>
              <QuoteContentContainer>
                {quoteDetailsConfig?.map(({ label, key }) => (
                  <CommonQuoteContentContainer key={key}>
                    <QuoteEntrySpan>{label}</QuoteEntrySpan>
                    <CommonQuoteTypography>
                      {label === "Quote received on"
                        ? dayjs(getNestedValue(quote, key)).format("DD/MM/YYYY")
                        : formatValue(getNestedValue(quote, key))}
                    </CommonQuoteTypography>
                  </CommonQuoteContentContainer>
                ))}
              </QuoteContentContainer>
            </QuoteDetailsContainer>
          ) : (
            <>
              <QuoteTypography>{title}</QuoteTypography>
              <NestedDynamicForm
                config={quoteVersionConfig}
                ref={editQuoteRef}
                onActionMap={actionMap}
                onValuesChange={editQuoteValuesChange}
                disableAllFormFields={disableAllFormFields}
              />
              <VersionFormButton
                loading={isLoading}
                onClick={() => updateQuoteById(quote, idx)}
                disabled={disableAllFormFields}
              >
                {SAVE_UPDATED_QUOTE}
              </VersionFormButton>
            </>
          )}
        </>
      );
    });
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value).trim();
  };

  function getNestedValue(obj: any, path: string, defaultValue: any = "-") {
    return (
      path.split(".").reduce((acc, part) => {
        if (acc && typeof acc === "object" && part in acc) {
          return acc[part];
        }
        return undefined;
      }, obj) ?? defaultValue
    );
  }

  const actionMap = {
    handleRefresh: () => {},
    handleCompareCovers: () => {},
  };

  // Auto-populate configuration for gross premium calculations for lanka user, need to refactor in future
  const grossPremiumAutoPopulateConfig = useMemo(() => {
    const netPremiumCommonFields = isSriLankaUser
      ? [
          "quoteDetails.basicPremium",
          "quoteDetails.srccAmount",
          "quoteDetails.terrorism",
        ]
      : ["quoteDetails.basicPremium", "quoteDetails.terrorism"];
    const commonFields = [...netPremiumCommonFields, "quoteDetails.gstAmount"];

    return [
      {
        target: "quoteDetails.netPremium",
        fields: netPremiumCommonFields,
      },
      // {
      //   target: "quoteDetails.totalGrossPremiumIncTax",
      //   fields: commonFields,
      // },
      {
        target: "quoteDetails.grossPremium",
        fields: [
          ...commonFields, // reuse first set of fields
          "quoteDetails.cessAmount",
          "quoteDetails.fee",
          "quoteDetails.other",
          "quoteDetails.adminCharges",
        ],
      },
      {
        target: "quoteDetails.totalBrokerageAmount",
        fields: [
          "quoteDetails.basicBrokerageAmount",
          "quoteDetails.srccBrokerageAmount",
          "quoteDetails.tcBrokerageAmount",
        ],
      },
    ];
  }, [isSriLankaUser]);

  const addQuoteAutoPopulate = useAutoPopulateCalculatedFields(
    addQuoteRef,
    grossPremiumAutoPopulateConfig,
    { forceEnable: true }
  );

  const editQuoteAutoPopulate = useAutoPopulateCalculatedFields(
    editQuoteRef,
    grossPremiumAutoPopulateConfig,
    { forceEnable: true }
  );

  useEffect(() => {
    if (editQuoteIndex !== null) {
      const quote = quoteData[editQuoteIndex];
      const normalizedData = normalizeApiDataForResetting(quote?.formData);
      if (quote && editQuoteRef.current) {
        const sanitizedData = ensureBrokerageDefaults(
          normalizedData as QuoteFormValues
        );
        editQuoteRef.current.resetForms(sanitizedData);
        editQuotePrevValuesRef.current = cloneFormValues(sanitizedData);
        editQuoteSkipNextChangeRef.current = false;
      }
    }
  }, [editQuoteIndex, editQuoteRef]);

  useEffect(() => {
    if (
      !enableForm ||
      !quotePrefillDefaults ||
      Object.keys(quotePrefillDefaults).length === 0
    ) {
      return;
    }

    let frameId: number | null = null;

    const applyPrefills = () => {
      if (!addQuoteRef.current?.setValues) {
        frameId =
          typeof window === "undefined"
            ? null
            : window.requestAnimationFrame(applyPrefills);
        return;
      }

      const currentValues =
        (addQuoteRef.current?.getValues?.() as QuoteFormValues) || {};
      const currentQuoteDetails = currentValues?.quoteDetails || {};

      const needsUpdate = Object.entries(quotePrefillDefaults).some(
        ([field, value]) => {
          const currentValue = currentQuoteDetails[field];
          return (
            currentValue === undefined ||
            currentValue === null ||
            currentValue === ""
          );
        }
      );

      const shouldForcePrefill = shouldForcePrefillRef.current;
      if (!needsUpdate && !shouldForcePrefill) {
        return;
      }

      const nextQuoteDetails = {
        ...currentQuoteDetails,
        ...quotePrefillDefaults,
      };

      shouldForcePrefillRef.current = false;
      addQuoteSkipNextChangeRef.current = true;
      addQuoteRef.current.setValues({
        quoteDetails: nextQuoteDetails,
      });

      const nextValues: QuoteFormValues = {
        ...currentValues,
        quoteDetails: nextQuoteDetails,
      };
      addQuotePrevValuesRef.current = cloneFormValues(nextValues);
    };

    frameId =
      typeof window === "undefined"
        ? null
        : window.requestAnimationFrame(applyPrefills);

    return () => {
      if (frameId && typeof window !== "undefined") {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enableForm, quotePrefillDefaults, selectedTab]);

  const handleAddQuote = () => {
    shouldForcePrefillRef.current = true;
    addQuotePrevValuesRef.current = null;
    addQuoteSkipNextChangeRef.current = false;
    setEnableForm(true);
    setTimeout(() => {
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const baseAddQuoteValuesChange = useMemo(
    () =>
      createQuoteValuesChangeHandler(
        addQuoteRef,
        addQuotePrevValuesRef,
        addQuoteSkipNextChangeRef,
        addQuoteAutoPopulate,
        isSriLankaUser
      ),
    [addQuoteAutoPopulate, isSriLankaUser]
  );

  const baseEditQuoteValuesChange = useMemo(
    () =>
      createQuoteValuesChangeHandler(
        editQuoteRef,
        editQuotePrevValuesRef,
        editQuoteSkipNextChangeRef,
        editQuoteAutoPopulate,
        isSriLankaUser
      ),
    [editQuoteAutoPopulate, isSriLankaUser]
  );

  const addQuoteValuesChange = useMemo(
    () =>
      createInsurerLocationAutoFillHandler(
        baseAddQuoteValuesChange,
        addQuoteRef,
        addQuoteSkipNextChangeRef, // ✅ NO prevValuesRef here
        insurerLocationMap
      ),
    [baseAddQuoteValuesChange, insurerLocationMap]
  );

  const editQuoteValuesChange = useMemo(
    () =>
      createInsurerLocationAutoFillHandler(
        baseEditQuoteValuesChange,
        editQuoteRef,
        editQuoteSkipNextChangeRef, // ✅ NO prevValuesRef here
        insurerLocationMap
      ),
    [baseEditQuoteValuesChange, insurerLocationMap]
  );

  const addQuoteConfigWithDefaults = useMemo(() => {
    return quoteVersionConfig.map((config: any) => {
      if (config.isCoversRequired) {
        return {
          ...config,
          defaultValues: versionData?.data?.formData?.coversConfig || {},
        };
      }
      return config;
    });
  }, [quoteVersionConfig, versionData?.data?.formData?.coversConfig]);

  return (
    <>
      <QuoteFormContainer>
        <BasicContainer>
          {displayBasicDetails.map(({ label, key }) => (
            <CommonQuoteContentContainer key={key}>
              <QuoteEntrySpan>{label}</QuoteEntrySpan>
              <CommonQuoteTypography>
                {formatValue(getNestedValue(quoteBasicDetails, key))}{" "}
              </CommonQuoteTypography>
            </CommonQuoteContentContainer>
          ))}
        </BasicContainer>
        <MainCoverDetailsContainer>
          <CreateQuoteContainer>
            <QuoteTypography>{ENTER_QUTATIONS}</QuoteTypography>
            <AddQuoteButton
              disabled={disableAllFormFields}
              variantType="link"
              onClick={handleAddQuote}
            >
              <PlusIconStyles src={PlusIcon} alt="AddNewIcon" />
              {ADD_QUOTE}
            </AddQuoteButton>
          </CreateQuoteContainer>
          {displayQuotes()}
          {enableForm && !disableAllFormFields && (
            <div ref={formContainerRef}>
              {quoteData.length > 0 && (
                <QuoteTypography>
                  {QUOTE} {quoteData.length + 1}
                </QuoteTypography>
              )}
              <NestedDynamicForm
                config={addQuoteConfigWithDefaults}
                ref={addQuoteRef}
                onActionMap={actionMap}
                onValuesChange={addQuoteValuesChange}
                disableAllFormFields={disableAllFormFields}
                key={`add-${selectedTab}-${opportunityId}-${JSON.stringify(
                  versionData?.data?.formData?.coversConfig || {}
                )}`}
              />
            </div>
          )}
        </MainCoverDetailsContainer>
        {enableForm && (
          <VersionFormButton
            disabled={disableAllFormFields}
            loading={isLoading}
            onClick={handleSaveQuote}
          >
            {SAVE_QUOTE}
          </VersionFormButton>
        )}
      </QuoteFormContainer>
    </>
  );
};

export default QuoteForm;
