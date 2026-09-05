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
import { StateEnum } from "../../../../../components/NestedStepper/RenderComponent";
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import StepLoader from "../StepLoader";
import { useResolvedConfig } from "../hooks/useResolvedConfig";
import { processDocumentsSimple } from "../utils/documentProcessor";

// Public payload shape exposed to parent
export interface FonlSentToInsurerPayload {
  body: unknown;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface FonlSentToInsurerHandle {
  getPayload: () => FonlSentToInsurerPayload;
  getFormValues: () => unknown;
  validate?: () => Promise<boolean> | boolean;
  submitAll: () => unknown;
}

export interface CommonStepItemProps {
  config?: unknown;
  selectedStep?: Step;
  selectedItem?: StepItem;
  setIsPutCall: React.Dispatch<React.SetStateAction<boolean>>;
}

const FonlSentToInsurer = forwardRef<
  FonlSentToInsurerHandle,
  CommonStepItemProps
>(({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
  const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

  const payload = (): FonlSentToInsurerPayload => {
    const values = innerRef.current?.getValues?.() || {};

    // Use utility to process documents
    const documents = processDocumentsSimple(values, "fonlSentToInsurer");

    return {
      body: {
        fonlSentToInsurer: {
          fnolSentDate: values.fonlSentToInsurer.fnolSentDate,
          insurerReferenceNo: values.fonlSentToInsurer.insurerReferenceNo,
          documents: documents,
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
    documentPath: "fonlSentToInsurer",
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
    />
  );
});

FonlSentToInsurer.displayName = "FonlSentToInsurer";

export default FonlSentToInsurer;
