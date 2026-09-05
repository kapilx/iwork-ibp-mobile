import {
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
} from "@ui/ui-lib";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Step } from "../../../../components/NestedStepper/config.js";
import { ENDORSEMENT_STEP_KEYS } from "../../../../constants/index.js";

export interface RenderEndorsementStepProps {
  config?: Step["config"];
  stepName?: Step["key"];
  stepData: any;
  onValuesChange?: (values: Record<string, any>) => void;
}

export interface StepInterface {
  submitAll?: () => Promise<{
    isAllValid: boolean;
    result: Record<string, any>;
    invalidFields: string[];
  }>;
  setValues?: (values: Record<string, any>) => void;
  testing: () => string;
}

const RenderEndorsementStep = forwardRef<
  StepInterface, //parent interface
  RenderEndorsementStepProps //props interface
>(
  (
    {
      config,
      stepName, // not used currently
      stepData,
      onValuesChange,
    },
    parentRef
  ) => {
    const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

    // Expose child methods to parent
    useImperativeHandle(parentRef, () => ({
      submitAll: async () => {
        return await innerRef.current?.submitAll?.();
      },
      setValues: (values: Record<string, any>) => {
        innerRef.current?.setValues?.(values);
      },
    }));

    // Reset form whenever step data changes
    useEffect(() => {
      if (stepData?.data && stepData?.isCompleted) {
        // Defer so NestedDynamicForm's child DynamicForm effects have time to
        // register their form methods into formMethodsMap before resetForms runs.
        const timer = setTimeout(() => {
          innerRef.current?.resetForms(stepData.data);
        }, 0);
        return () => clearTimeout(timer);
      } else if (
        stepName === ENDORSEMENT_STEP_KEYS.RECEIVE_INSURER_ACKNOWLEDGEMENT &&
        stepData?.data
      ) {
        const {
          endorsementPremiumAmount,
          gstAmount,
          terrorismPremiumAmount,
          totalPremiumAmount,
        } = stepData.data?.premiumDetails ?? {};

        innerRef.current?.setValues?.({
          premiumDetails: {
            endorsementPremiumAmount,
            gstAmount,
            terrorismPremiumAmount,
            totalPremiumAmount,
          },
        });
      } else if (
        stepName === ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT &&
        stepData?.data
      ) {
        // Prefill brokerage for inception (inceptionBrokerageDetails) and endorsement (endorsementBrokerageDetails)
        const brokerage =
          stepData.data?.inceptionBrokerageDetails ??
          stepData.data?.endorsementBrokerageDetails;
        const summary = stepData.data?.endorsementSummary;
        const pct =
          brokerage?.basicBrokeragePercentage ??
          summary?.basicBrokeragePercentage;
        const amt =
          brokerage?.basicBrokerageAmount ?? summary?.basicBrokerageAmount;
        const hasPct = pct !== null && pct !== undefined && pct !== "";
        const hasAmt = amt !== null && amt !== undefined && amt !== "";
        if (hasPct || hasAmt) {
          // Pass both keys — NestedDynamicForm silently skips whichever section doesn't exist in config
          const timer = setTimeout(() => {
            innerRef.current?.setValues?.({
              inceptionBrokerageDetails: {
                basicBrokeragePercentage: pct,
                basicBrokerageAmount: amt,
              },
              endorsementBrokerageDetails: {
                basicBrokeragePercentage: pct,
                basicBrokerageAmount: amt,
              },
            });
          }, 0);
          return () => clearTimeout(timer);
        }
      }
    }, [stepData, stepName, stepData?.isCompleted]);

    let disableAllFields = false;
    if (
      (stepData?.isCompleted && stepData?.stepOrder >= 2) ||
      (!stepData?.isCompleted && !stepData?.isCurrentStep)
    ) {
      disableAllFields = true;
    }

    return (
      <NestedDynamicForm
        config={config}
        ref={innerRef}
        disableAllFormFields={disableAllFields}
        onValuesChange={onValuesChange}
      />
    );
  }
);

export default RenderEndorsementStep;
