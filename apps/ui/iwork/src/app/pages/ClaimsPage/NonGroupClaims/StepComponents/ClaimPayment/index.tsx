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
import { StateEnum } from "../../../../../components/NestedStepper/RenderComponent";
import StepLoader from "../StepLoader";
import { useResolvedConfig } from "../hooks/useResolvedConfig";
import { processDocumentsSimple } from "../utils/documentProcessor";

// Public payload shape exposed to parent
export interface ClaimPaymentPayload {
  body: any;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface ClaimPaymentHandle {
  getPayload: () => ClaimPaymentPayload;
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

const ClaimPayment = forwardRef<ClaimPaymentHandle, CommonStepItemProps>(
  ({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
    const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

    const payload = (): ClaimPaymentPayload => {
      const values = innerRef.current?.getValues?.() || {};
      const claimPayment = values.claimPayment || {};

      const { paymentDate, paymentReferenceNo, paidAmount, modeOfPaymentKey } =
        claimPayment;

      // Use utility to process documents
      const documents = processDocumentsSimple(values, "claimPayment");

      return {
        body: {
          claimPayment: {
            paymentDate,
            paymentReferenceNo,
            paidAmount,
            modeOfPaymentKey,
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
      documentPath: "claimPayment",
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
  }
);

ClaimPayment.displayName = "ClaimPayment";

export default ClaimPayment;
