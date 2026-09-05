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

// Public payload shape exposed to parent
export interface ClaimSettlementPayload {
  body: any;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface ClaimSettlementHandle {
  getPayload: () => ClaimSettlementPayload;
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

const ClaimSettlement = forwardRef<ClaimSettlementHandle, CommonStepItemProps>(
  ({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
    const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

    const payload = (): ClaimSettlementPayload => {
      const settlement = innerRef.current?.getValues?.()?.claimSettlement || {};

      const {
        settlementDate,
        settlementAmount,
        approvedBy,
        modeOfSettlementKey,
      } = settlement;

      return {
        body: {
          claimSettlement: {
            settlementDate,
            settlementAmount,
            approvedBy,
            modeOfSettlementKey,
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

    if (isLoading) {
      return <StepLoader />;
    }

    if (!config) return null;

    return (
      <NestedDynamicForm
        config={config}
        ref={innerRef}
        disableAllFormFields={selectedItem?.stepState !== StateEnum.ACTIVE}
      />
    );
  }
);

ClaimSettlement.displayName = "ClaimSettlement";

export default ClaimSettlement;
