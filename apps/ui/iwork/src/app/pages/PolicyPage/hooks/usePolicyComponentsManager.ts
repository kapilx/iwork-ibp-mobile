// /Users/naveen/development/vitalia/frontend/src/app/configurator/usePolicyComponentsManager.ts
import { useState, useCallback } from "react";
import {
  PolicyComponent,
  COMMA_SEPARATOR,
  SumInsuredModel,
  PolicyComponentTypeMaster,
} from "../PolicyConfigurator/policytypes";
import { escapeRegExp } from "../utils/formatters";
import { createNewSumInsuredOption } from "../PolicyConfigurator/ConfiguratorFields";

interface FormErrors {
  // Labels for base/parental are now also user-editable, so they might have errors (e.g., if empty)
  // However, uniqueness is only enforced for 'optional' type labels against other 'optional' types.
  componentLabels?: { [id: string]: string };
}

// Define initialBasePolicy outside the hook to make it stable
const baseMasterForInitial = PolicyComponentTypeMaster.find(
  (m) => m.type === "base"
)!;
const STABLE_INITIAL_BASE_POLICY: PolicyComponent = {
  id: "base",
  label: baseMasterForInitial.label,
  type: "base",
  sumInsuredModel: SumInsuredModel.FLAT,
  siMultipleLabel: "CTC",
  siMultipleMin: undefined,
  siMultipleMax: undefined,
  sumInsuredOptions: [createNewSumInsuredOption(1)],
  nextSumInsuredId: 2,
  showCompanyContribution: false,
  premiumPerLife: false,
  sumInsuredPerLife: false,
  proRationEnabled: true,
  acceptRelationsFromParent: false,
  isOptional: false,
};

export interface PolicyComponentsManager {
  policyComponents: PolicyComponent[];
  formErrors: FormErrors;
  focusTargetId: string | null;
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>;

  handleAddSumInsured: (componentId: string) => void;
  handleRemoveSumInsured: (componentId: string, optionId: number) => void;
  handleSumInsuredValueChange: (
    componentId: string,
    optionId: number,
    rawValue: string
  ) => void;

  handleProRationEnabledChange: (
    componentId: string,
    isChecked: boolean
  ) => void;
  handleAcceptRelationsFromParentChange: (
    componentId: string,
    isChecked: boolean
  ) => void;

  getLabelError: (
    label: string,
    componentId: string,
    componentType: string
  ) => string | undefined;
  updateLabelErrorState: (
    label: string,
    componentId: string,
    componentType: string
  ) => boolean;

  handleComponentLabelChange: (componentId: string, newLabel: string) => void;
  handleRemoveParentalPolicy: () => void; // Specific for parental due to its unique slot
  handleAddParentalPolicy: () => void;
  handleAddOptionalComponent: () => void;
  handleRemoveComponent: (id: string) => void; // Generic remove for optional

  handleSumInsuredModelChange: (
    componentId: string,
    newModel: SumInsuredModel
  ) => void;
  handleSiMultipleLabelChange: (componentId: string, newLabel: string) => void;
  handleSiMultipleMinChange: (componentId: string, value: string) => void;
  handleSiMultipleMaxChange: (componentId: string, value: string) => void;

  // New handlers for the requested fields
  handleShowCompanyContributionChange: (
    componentId: string,
    isChecked: boolean
  ) => void;
  handlePremiumPerLifeChange: (componentId: string, isPerLife: boolean) => void;
  handleSumInsuredPerLifeChange: (componentId: string, isPerLife: boolean) => void;
  handleIsBenefitComponentChange: (componentId: string, isChecked: boolean) => void;
  handleIsOptionalChange: (componentId: string, isChecked: boolean) => void;

  // Functions to set components when loading from API
  initializePolicyComponents: (components: PolicyComponent[]) => void;
}

export function usePolicyComponentsManager(): PolicyComponentsManager {
  const [policyComponents, setPolicyComponents] = useState<PolicyComponent[]>([
    // Initialize with the stable base policy
    STABLE_INITIAL_BASE_POLICY,
  ]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [nextGeneratedOptionalId, setNextGeneratedOptionalId] =
    useState<number>(1);

  const generateNextOptionalComponentId = () => {
    const id = `optional-${nextGeneratedOptionalId}`;
    setNextGeneratedOptionalId((prev) => prev + 1);
    return id;
  };

  const initializePolicyComponents = useCallback(
    (componentsFromApi: PolicyComponent[]) => {
      const processedComponents = componentsFromApi.map((apiComp) => {
        const masterInfo = PolicyComponentTypeMaster.find(
          (m) => m.type === apiComp.type
        );

        // Defaulting for sumInsuredOptions and nextSumInsuredId
        let resolvedSumInsuredOptions = apiComp.sumInsuredOptions;
        let resolvedNextSumInsuredId = apiComp.nextSumInsuredId;

        if (
          !resolvedSumInsuredOptions ||
          resolvedSumInsuredOptions.length === 0
        ) {
          resolvedSumInsuredOptions = [createNewSumInsuredOption(1)]; // Start with ID 1
          resolvedNextSumInsuredId = 2; // Next ID to be used will be 2
        } else {
          // Options exist, ensure nextSumInsuredId is valid if not provided
          if (resolvedNextSumInsuredId === undefined) {
            resolvedNextSumInsuredId =
              Math.max(0, ...resolvedSumInsuredOptions.map((o) => o.id)) + 1;
          }
        }

        return {
          // Ensure all essential fields from PolicyComponent are present with defaults
          id: apiComp.id, // Must come from API if component exists
          type: apiComp.type, // Must come from API
          label:
            apiComp.label === undefined
              ? masterInfo?.label || ""
              : apiComp.label,
          sumInsuredModel:
            apiComp.sumInsuredModel === undefined
              ? SumInsuredModel.FLAT
              : apiComp.sumInsuredModel,
          siMultipleLabel:
            apiComp.siMultipleLabel === undefined
              ? "CTC"
              : apiComp.siMultipleLabel,
          siMultipleMin: apiComp.siMultipleMin, // Allow undefined
          siMultipleMax: apiComp.siMultipleMax, // Allow undefined
          sumInsuredOptions: resolvedSumInsuredOptions,
          nextSumInsuredId: resolvedNextSumInsuredId,
          // Default new flags
          showCompanyContribution:
            apiComp.showCompanyContribution === undefined
              ? false
              : apiComp.showCompanyContribution,
          premiumPerLife:
            apiComp.premiumPerLife === undefined
              ? false
              : apiComp.premiumPerLife,
          sumInsuredPerLife: apiComp.sumInsuredPerLife ?? false,
          proRationEnabled:
            apiComp.proRationEnabled === undefined
              ? true
              : apiComp.proRationEnabled,
          isBenefitComponent: apiComp.isBenefitComponent ?? false,
          acceptRelationsFromParent: apiComp.acceptRelationsFromParent ?? false,
          isOptional: apiComp.isOptional ?? false,
        } as PolicyComponent; // Type assertion
      });

      let baseComponent = processedComponents.find((c) => c.type === "base");
      if (!baseComponent) {
        // If componentsFromApi is empty, it means we're initializing a new set, so use the stable base.
        // If componentsFromApi has items but no base, this is an inconsistent state.
        // For robustness, we ensure a base component is always part of the structure.
        baseComponent = { ...STABLE_INITIAL_BASE_POLICY };
      }

      const parentalComponent =
        processedComponents.find((c) => c.type === "parental") || null;
      const optionalComponents = processedComponents.filter(
        (c) => c.type === "optional"
      );

      // Ensure the base component in processedComponents is updated if it was missing or to ensure it's our stable one if needed.
      // This logic might need refinement based on how strictly `componentsFromApi` should be trusted.
      // If `baseComponent` from `processedComponents` is valid, use it. Otherwise, use `STABLE_INITIAL_BASE_POLICY`.
      const finalBaseComponent = processedComponents.find(
        (c) => c.type === "base"
      ) || { ...STABLE_INITIAL_BASE_POLICY };

      // Update nextGeneratedOptionalId based on loaded optional components
      let maxIdNum = 0;
      optionalComponents.forEach((p) => {
        if (p.id && typeof p.id === "string" && p.id.startsWith("optional-")) {
          const numPart = parseInt(p.id.split("-")[1], 10);
          if (!isNaN(numPart) && numPart > maxIdNum) {
            maxIdNum = numPart;
          }
        }
      });
      setNextGeneratedOptionalId(maxIdNum + 1);

      const newOrderedComponents: PolicyComponent[] = [finalBaseComponent];
      if (parentalComponent) {
        newOrderedComponents.push(parentalComponent);
      }
      newOrderedComponents.push(...optionalComponents);
      setPolicyComponents(newOrderedComponents);
    },
    [
      /* STABLE_INITIAL_BASE_POLICY is from outer scope, not a hook-internal dependency.
          setPolicyComponents and setNextGeneratedOptionalId are stable.
          PolicyComponentTypeMaster and createNewSumInsuredOption are stable imports.
          Thus, this useCallback can have an empty dependency array. */
    ]
  );

  const handleAddSumInsured = (componentId: string) => {
    let newOptionIdToFocus: number | undefined;
    let componentIdOfNewOption: string | undefined;

    setPolicyComponents((prevComponents) =>
      prevComponents.map((comp) => {
        if (comp.id === componentId) {
          const newOption = createNewSumInsuredOption(comp.nextSumInsuredId);
          newOptionIdToFocus = newOption.id;
          componentIdOfNewOption = comp.id;
          return {
            ...comp,
            sumInsuredOptions: [...comp.sumInsuredOptions, newOption],
            nextSumInsuredId: comp.nextSumInsuredId + 1,
          };
        }
        return comp;
      })
    );

    if (
      newOptionIdToFocus !== undefined &&
      componentIdOfNewOption !== undefined
    ) {
      setFocusTargetId(`si-${componentIdOfNewOption}-${newOptionIdToFocus}`);
    }
  };

  const handleRemoveSumInsured = (componentId: string, optionId: number) => {
    setPolicyComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              sumInsuredOptions:
                comp.sumInsuredOptions.filter((opt) => opt.id !== optionId)
                  .length > 0
                  ? comp.sumInsuredOptions.filter((opt) => opt.id !== optionId)
                  : comp.sumInsuredOptions, // Keep at least one option
            }
          : comp
      )
    );
  };

  const handleSumInsuredValueChange = (
    componentId: string,
    optionId: number,
    rawValue: string
  ) => {
    let numericValue = String(rawValue).replace(
      new RegExp(escapeRegExp(COMMA_SEPARATOR), "g"),
      ""
    );
    numericValue = numericValue.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2)
      numericValue = parts[0] + "." + parts.slice(1).join("");

    setPolicyComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              sumInsuredOptions: comp.sumInsuredOptions.map((opt) =>
                opt.id === optionId ? { ...opt, value: numericValue } : opt
              ),
            }
          : comp
      )
    );
  };

  const isLabelUniqueForOptional = (
    labelToCheck: string,
    currentComponentId: string
  ): boolean => {
    if (!labelToCheck.trim()) return true;
    const optionalLabels = policyComponents
      .filter((pc) => pc.type === "optional")
      .map((pc) => ({ id: pc.id, label: pc.label }));

    return !optionalLabels.some(
      (item) =>
        item.id !== currentComponentId &&
        item.label?.trim().toLowerCase() === labelToCheck.trim().toLowerCase()
    );
  };

  const getLabelError = (
    label: string,
    componentId: string,
    componentType: string
  ): string | undefined => {
    if (
      componentType === "optional" &&
      label.trim() &&
      !isLabelUniqueForOptional(label, componentId)
    ) {
      return "Label must be unique among optional components.";
    }
    // Add other generic label checks if needed, e.g., !label.trim() ? "Label is required." : undefined;
    return undefined;
  };

  const updateLabelErrorState = (
    label: string,
    componentId: string,
    componentType: string
  ): boolean => {
    let hasError = false;
    const errorMessage = getLabelError(label, componentId, componentType);

    if (errorMessage) {
      hasError = true;
      setFormErrors((prev) => ({
        ...prev,
        componentLabels: {
          ...prev.componentLabels,
          [componentId]: errorMessage,
        },
      }));
    } else {
      // Clear error if now valid
      setFormErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [componentId]: _, ...restLabels } = prev.componentLabels || {};
        const updatedLabels =
          Object.keys(restLabels).length > 0 ? restLabels : undefined;
        return { ...prev, componentLabels: updatedLabels };
      });
    }
    return hasError;
  };

  const handleComponentLabelChange = (
    componentId: string,
    newLabel: string
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, label: newLabel } : comp
      )
    );
  };

  const handleRemoveParentalPolicy = () => {
    setPolicyComponents((prev) =>
      prev.filter((comp) => comp.type !== "parental")
    );
    setFormErrors((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["parental"]: _, ...restLabels } = prev.componentLabels || {}; // Assuming parental ID is 'parental'
      const updatedLabels =
        Object.keys(restLabels).length > 0 ? restLabels : undefined;
      return { ...prev, componentLabels: updatedLabels };
    });
  };

  const handleAddParentalPolicy = () => {
    if (!policyComponents.find((comp) => comp.type === "parental")) {
      const parentalMaster = PolicyComponentTypeMaster.find(
        (m) => m.type === "parental"
      )!;
      const newParentalPolicy: PolicyComponent = {
        id: "parental",
        label: parentalMaster.label,
        type: "parental",
        sumInsuredModel: SumInsuredModel.FLAT,
        siMultipleLabel: "CTC",
        siMultipleMin: undefined,
        siMultipleMax: undefined,
        sumInsuredOptions: [createNewSumInsuredOption(1)],
        nextSumInsuredId: 2,
        showCompanyContribution: false,
        premiumPerLife: false,
        sumInsuredPerLife: false,
        proRationEnabled: true,
        acceptRelationsFromParent: false,
        isOptional: false,
      };
      setPolicyComponents((prev) => {
        const base =
          prev.find((c) => c.type === "base") || STABLE_INITIAL_BASE_POLICY;
        const optionals = prev.filter((c) => c.type === "optional");
        return [base, newParentalPolicy, ...optionals];
      });
    }
    setFocusTargetId(`parental-label`);
  };

  const handleAddOptionalComponent = () => {
    const newOptionalPolicy: PolicyComponent = {
      id: generateNextOptionalComponentId(),
      label: "", // User will define this
      type: "optional",
      sumInsuredModel: SumInsuredModel.FLAT,
      siMultipleLabel: "CTC",
      siMultipleMin: undefined,
      siMultipleMax: undefined,
      sumInsuredOptions: [createNewSumInsuredOption(1)],
      nextSumInsuredId: 2,
      showCompanyContribution: false,
      premiumPerLife: false,
      sumInsuredPerLife: false,
      proRationEnabled: true,
      acceptRelationsFromParent: false,
      isOptional: false,
    };
    setPolicyComponents((prev) => [...prev, newOptionalPolicy]);
    // Focus the label of the newly added optional component
    setFocusTargetId(`${newOptionalPolicy.id}-label`);
  };

  const handleRemoveComponent = (id: string) => {
    // Base component cannot be removed. Parental is handled by handleRemoveParentalPolicy.
    // This is primarily for optional components.
    const componentToRemove = policyComponents.find((c) => c.id === id);
    if (componentToRemove && componentToRemove.type === "optional") {
      setPolicyComponents((prev) => prev.filter((comp) => comp.id !== id));
      setFormErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...restLabels } = prev.componentLabels || {};
        const updatedLabels =
          Object.keys(restLabels).length > 0 ? restLabels : undefined;
        return { ...prev, componentLabels: updatedLabels };
      });
    }
  };

  const handleSumInsuredModelChange = (
    componentId: string,
    newModel: SumInsuredModel
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, sumInsuredModel: newModel } : comp
      )
    );
  };

  const handleSiMultipleLabelChange = (
    componentId: string,
    newLabel: string
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, siMultipleLabel: newLabel } : comp
      )
    );
  };

  const parseNumericInput = (value: string): number | undefined => {
    const valStr = String(value);
    if (valStr.trim() === "") return undefined;
    let cleanedValue = valStr.replace(
      new RegExp(escapeRegExp(COMMA_SEPARATOR), "g"),
      ""
    );
    cleanedValue = cleanedValue.replace(/[^0-9.]/g, "");
    const parts = cleanedValue.split(".");
    cleanedValue =
      parts.length > 1 ? parts[0] + "." + parts.slice(1).join("") : parts[0];
    if (cleanedValue.trim() === "") return undefined;
    const num = parseFloat(cleanedValue);
    return isNaN(num) ? undefined : num;
  };

  const handleSiMultipleMinChange = (componentId: string, value: string) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, siMultipleMin: parseNumericInput(value) }
          : comp
      )
    );
  };

  const handleSiMultipleMaxChange = (componentId: string, value: string) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, siMultipleMax: parseNumericInput(value) }
          : comp
      )
    );
  };

  const handleShowCompanyContributionChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, showCompanyContribution: isChecked }
          : comp
      )
    );
  };
  const handleProRationEnabledChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, proRationEnabled: isChecked } : comp
      )
    );
  };
  const handleAcceptRelationsFromParentChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, acceptRelationsFromParent: isChecked }
          : comp
      )
    );
  };
  const handlePremiumPerLifeChange = (
    componentId: string,
    isPerLife: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, premiumPerLife: isPerLife } : comp
      )
    );
  };

  const handleSumInsuredPerLifeChange = (
    componentId: string,
    isPerLife: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, sumInsuredPerLife: isPerLife } : comp
      )
    );
  };

  const handleIsBenefitComponentChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, isBenefitComponent: isChecked }
          : comp,
      ),
    );
  };

  const handleIsOptionalChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setPolicyComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, isOptional: isChecked } : comp
      )
    );
  };

  return {
    policyComponents,
    formErrors,
    focusTargetId,
    setFocusTargetId,
    handleAddSumInsured,
    handleRemoveSumInsured,
    handleSumInsuredValueChange,
    getLabelError,
    updateLabelErrorState,
    handleComponentLabelChange,
    handleRemoveParentalPolicy,
    handleAddParentalPolicy,
    handleAddOptionalComponent,
    handleRemoveComponent,
    handleSumInsuredModelChange,
    handleSiMultipleLabelChange,
    handleSiMultipleMinChange,
    handleSiMultipleMaxChange,
    handleShowCompanyContributionChange,
    handleProRationEnabledChange,
    handleAcceptRelationsFromParentChange,
    handlePremiumPerLifeChange,
    handleSumInsuredPerLifeChange,
    handleIsBenefitComponentChange,
    handleIsOptionalChange,
    initializePolicyComponents,
  };
}
