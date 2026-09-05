import {
  endPoints,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  useApiQuery,
} from "@ui/ui-lib";
import {
  Step,
  StepItem,
} from "apps/ui/iwork/src/app/components/NestedStepper/config";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import StepLoader from "../StepLoader";
import { StateEnum } from "../../../../../components/NestedStepper/RenderComponent";
import { useResolvedConfig } from "../hooks/useResolvedConfig";
import { processDocumentsSimple } from "../utils/documentProcessor";

// Public payload shape exposed to parent
export interface LetterOfRequirementPayload {
  body: any;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface LetterOfRequirementHandle {
  getPayload: () => LetterOfRequirementPayload;
  getFormValues: () => unknown;
  validate?: () => Promise<boolean> | boolean;
  submitAll: () => any;
}

export interface CommonStepItemProps {
  config?: any;
  selectedStep?: Step;
  selectedItem?: StepItem;
  setIsPutCall: React.Dispatch<React.SetStateAction<boolean>>;
}

const LetterOfRequirement = forwardRef<
  LetterOfRequirementHandle,
  CommonStepItemProps
>(({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
  const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

  const payload = (): LetterOfRequirementPayload => {
    const values = innerRef.current?.getValues?.() || {};
    const { letterOfRequirements = {} } = values;

    const { lorIssuedDate, issuedByKey, requiredDocuments } =
      letterOfRequirements;

    // Use utility to process documents
    const documents = processDocumentsSimple(values, "letterOfRequirements");

    return {
      body: {
        letterOfRequirements: {
          lorIssuedDate,
          issuedByKey,
          requiredDocuments,
          documents,
        },
      },
    };
  };

  // Expose imperative API to parent
  useImperativeHandle(
    ref,
    () => ({
      getPayload: () => payload(),
      getFormValues: () => innerRef.current?.getValues?.(),
      validate: () => {
        return false;
      },
      submitAll: () => {
        return innerRef.current?.submitAll?.();
      },
    }),
    []
  );

  const { data, isLoading } = useApiQuery({
    url: endPoints.getNonGroupClaimActivityById(
      selectedItem?.claimActivityId || ""
    ),
    queryKey: ["getClaimDataByActivity", selectedItem?.claimActivityId],
    enabled: Boolean(selectedItem?.claimActivityId),
  });

  useEffect(() => {
    if (data && innerRef.current) {
      const activityData = data?.data?.data?.[0];

      Boolean(activityData?.statusKey) &&
        innerRef.current.resetForms(activityData?.data);
      setIsPutCall(Boolean(activityData?.statusKey));
    }
  }, [data, setIsPutCall]);

  const resolvedConfig = useResolvedConfig({
    config,
    data,
    documentPath: "letterOfRequirements",
  });

  if (isLoading) {
    return <StepLoader />;
  }

  if (!config) return null;
  return (
    <NestedDynamicForm
      config={resolvedConfig}
      ref={innerRef}
      disableAllFormFields={selectedItem?.stepState !== StateEnum.ACTIVE}
      onValuesChange={() => {}}
    />
  );
});

LetterOfRequirement.displayName = "LetterOfRequirement";

export default LetterOfRequirement;
