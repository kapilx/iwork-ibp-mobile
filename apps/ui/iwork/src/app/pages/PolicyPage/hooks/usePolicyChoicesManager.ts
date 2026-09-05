import { useState, useEffect, useRef } from "react";
import {
  ConfiguredPolicyParameter,
  ConfiguredPolicyOption,
  PolicyConfiguration,
  PolicyOptionChoice,
  PolicyOptionChoiceMeta,
} from "../PolicyConfigurator/policytypes";

// This function was previously in page.tsx, moving it here.
export function buildPolicyChoicesStructure(
  config: PolicyConfiguration["configuration"],
  existingPolicyOptions?: ConfiguredPolicyOption[]
): ConfiguredPolicyOption[] {
  if (!config) {
    console.log("No configuration found, returning empty policy options.");
    return [];
  }

  // Prepare parameter options for combination
  const parameterOptionsList: {
    parameterId: string;
    parameterDisplayName: string;
    options: { optionId: string; optionLabel: string }[];
  }[] = config.parameters
    .map((param: ConfiguredPolicyParameter) => {
      let options: { optionId: string; optionLabel: string }[] = [];
      if (param.type === "range" && param.rangeDetails) {
        options = param.rangeDetails.map((rd) => ({
          optionId: rd.id,
          optionLabel: rd.rangeDisplayName || `Range (${rd.min}-${rd.max})`,
        }));
      } else if (param.type === "list" && param.lovDetails) {
        options = param.lovDetails.map((ld) => ({
          optionId: ld.id,
          optionLabel: ld.value || `List ${ld.id.split("-")[1]}`,
        }));
      } else if (param.type === "relation" && param.relationGroupDetails) {
        options = param.relationGroupDetails.map((rgd) => ({
          optionId: rgd.id,
          optionLabel: rgd.groupDisplayName || `RelGrp ${rgd.id.split("-")[1]}`,
        }));
      } else if (param.type === "dependent-count" && param.dependentCountConfig?.countBands) {
        options = param.dependentCountConfig.countBands.map((band) => ({
          optionId: band.id,
          optionLabel: band.displayName || `Count Band ${band.id}`,
        }));
      } else if (param.type === "dependent-attribute") {
        // Dependent Attribute parameters do NOT participate in the Cartesian product (FR-057 / BR-032).
        // options stays [] so this param is filtered out below.
      }
      return {
        parameterId: param.id,
        parameterDisplayName: param.displayName,
        options: options,
      };
    })
    .filter((paramList) => paramList.options.length > 0); // Only consider parameters that have options

  const generatedPolicyOptions: ConfiguredPolicyOption[] = [];

  if (parameterOptionsList.length === 0) {
    console.log(
      "Parameters found, but none have configurable options. Building universal policy option."
    );
    generatedPolicyOptions.push({
      optionId: `universal`,
      optionLabel: "Universal Option", // Concatenate labels
      optionMeta: [],
      basePolicyChoices: {
        mainPolicyChoices: { policyId: "", configured: false, choices: [] }, // Initialize with placeholder policyId and empty choices
        addonChoices: [], // Initialize as an empty array of PolicyOptionChoiceMeta
      },
      // parentalPolicyChoices will be conditionally initialized and populated later
    });
  } else {
    let optionIdCounter = 1;

    // Recursive function to generate combinations
    const generateCombinations = (
      currentIndex: number,
      currentCombinationMeta: ConfiguredPolicyOption["optionMeta"],
      currentCombinationLabels: string[]
    ) => {
      if (currentIndex === parameterOptionsList.length) {
        // Base case: a full combination is formed
        generatedPolicyOptions.push({
          optionId: `opt-${optionIdCounter++}`,
          optionLabel: currentCombinationLabels.join(" | "), // Concatenate labels
          optionMeta: [...currentCombinationMeta],
          basePolicyChoices: {
            mainPolicyChoices: { policyId: "", configured: false, choices: [] }, // Initialize with placeholder policyId and empty choices
            addonChoices: [], // Initialize as an empty array of PolicyOptionChoiceMeta
          },
          // parentalPolicyChoices will be conditionally initialized and populated later
        });
        return;
      }

      const currentParameter = parameterOptionsList[currentIndex];
      for (const option of currentParameter.options) {
        currentCombinationMeta.push({
          parameterId: currentParameter.parameterId,
          parameterOptionId: option.optionId,
        });
        currentCombinationLabels.push(
          `${currentParameter.parameterDisplayName}: ${option.optionLabel}`
        );
        generateCombinations(
          currentIndex + 1,
          currentCombinationMeta,
          currentCombinationLabels
        );
        currentCombinationMeta.pop(); // Backtrack
        currentCombinationLabels.pop(); // Backtrack
      }
    };

    generateCombinations(0, [], []);
  }
  console.log(
    "Generated policy options:",
    JSON.parse(JSON.stringify(generatedPolicyOptions))
  );

  // Now, populate basePolicyChoices and parentalPolicyChoices for each generated option
  generatedPolicyOptions.forEach((policyOption) => {
    const basePolicyTemplate = config.policyTemplate?.basePolicy;
    const parentalPolicyTemplate = config.policyTemplate?.parentalPolicy;
    // --- Populate Base Policy Choices ---
    if (basePolicyTemplate?.mainPolicyId) {
      const mainBaseComponent = config.components.find(
        (c) => c.id === basePolicyTemplate.mainPolicyId
      );
      if (mainBaseComponent?.sumInsuredOptions) {
        policyOption.basePolicyChoices.mainPolicyChoices = {
          policyId: mainBaseComponent.id, // Assuming policyId should be the string component ID
          configured: false,
          choices: mainBaseComponent.sumInsuredOptions.map((siOpt) => ({
            sumInsuredId: siOpt.id,
            isAvailable: false,
            isDefault: false,
            companyContribution: 0,
            employeeContribution: 0,
          })),
        };
      } else {
        // Handle case where main base component or its sumInsuredOptions are not found
        policyOption.basePolicyChoices.mainPolicyChoices = {
          policyId: basePolicyTemplate.mainPolicyId, // Use the ID from template
          configured: false,
          choices: [],
        };
      }

      if (basePolicyTemplate.addonIds?.length > 0) {
        policyOption.basePolicyChoices.addonChoices =
          basePolicyTemplate.addonIds.map((addonRef) => {
            const addonComponent = config.components.find(
              (c) => c.id === addonRef.optionId
            );
            if (addonComponent?.sumInsuredOptions) {
              return {
                policyId: addonComponent.id, // Assuming policyId should be the string component ID
                configured: false,
                choices: addonComponent.sumInsuredOptions.map((siOpt) => ({
                  sumInsuredId: siOpt.id,
                  isAvailable: false,
                  isDefault: false,
                  companyContribution: 0,
                  employeeContribution: 0,
                })),
              };
            }
            // If addon component or its sumInsuredOptions not found, return with empty choices
            return {
              policyId: addonRef.optionId,
              configured: false,
              choices: [],
            };
          });
      }
    }

    // --- Populate Parental Policy Choices (if applicable) ---
    if (parentalPolicyTemplate?.mainPolicyId) {
      policyOption.parentalPolicyChoices = {
        mainPolicyChoices: {
          policyId: parentalPolicyTemplate.mainPolicyId,
          configured: false,
          choices: [],
        },
        addonChoices: [],
      }; // Initialize

      const mainParentalComponent = config.components.find(
        (c) => c.id === parentalPolicyTemplate.mainPolicyId
      );
      if (mainParentalComponent?.sumInsuredOptions) {
        policyOption.parentalPolicyChoices.mainPolicyChoices = {
          policyId: mainParentalComponent.id, // Assuming policyId should be the string component ID
          configured: false,
          choices: mainParentalComponent.sumInsuredOptions.map((siOpt) => ({
            sumInsuredId: siOpt.id,
            isAvailable: false,
            isDefault: false,
            companyContribution: 0,
            employeeContribution: 0,
          })),
        };
      }

      if (parentalPolicyTemplate.addonIds?.length > 0) {
        policyOption.parentalPolicyChoices.addonChoices =
          parentalPolicyTemplate.addonIds.map((addonRef) => {
            const addonComponent = config.components.find(
              (c) => c.id === addonRef.optionId
            );
            if (addonComponent?.sumInsuredOptions) {
              return {
                policyId: addonComponent.id, // Assuming policyId should be the string component ID
                configured: false,
                choices: addonComponent.sumInsuredOptions.map((siOpt) => ({
                  sumInsuredId: siOpt.id,
                  isAvailable: false,
                  isDefault: false,
                  companyContribution: 0,
                  employeeContribution: 0,
                })),
              };
            }
            return {
              policyId: addonRef.optionId,
              configured: false,
              choices: [],
            };
          });
      }
    }
  });

  // Merge with existing data if provided (for LIVE edit mode)
  if (existingPolicyOptions && existingPolicyOptions.length > 0) {
    generatedPolicyOptions.forEach((newOption) => {
      // Find matching existing option by optionMeta
      const existingOption = existingPolicyOptions.find((existing) => {
        // Match based on optionMeta (parameter combinations)
        if (existing.optionMeta.length !== newOption.optionMeta.length) {
          return false;
        }
        return existing.optionMeta.every((existingMeta) =>
          newOption.optionMeta.some(
            (newMeta) =>
              newMeta.parameterId === existingMeta.parameterId &&
              newMeta.parameterOptionId === existingMeta.parameterOptionId
          )
        );
      });

      if (existingOption) {
        // Merge base policy choices - main
        const existingMainChoices =
          existingOption.basePolicyChoices.mainPolicyChoices.choices;
        newOption.basePolicyChoices.mainPolicyChoices.choices =
          newOption.basePolicyChoices.mainPolicyChoices.choices.map(
            (newChoice) => {
              const existingChoice = existingMainChoices.find(
                (ec) => ec.sumInsuredId === newChoice.sumInsuredId
              );
              return existingChoice || newChoice; // Keep existing data if found
            }
          );
        newOption.basePolicyChoices.mainPolicyChoices.configured =
          existingOption.basePolicyChoices.mainPolicyChoices.configured;

        // Merge base policy choices - addons
        newOption.basePolicyChoices.addonChoices.forEach((newAddon) => {
          const existingAddon =
            existingOption.basePolicyChoices.addonChoices.find(
              (ea) => ea.policyId === newAddon.policyId
            );
          if (existingAddon) {
            newAddon.choices = newAddon.choices.map((newChoice) => {
              const existingChoice = existingAddon.choices.find(
                (ec) => ec.sumInsuredId === newChoice.sumInsuredId
              );
              return existingChoice || newChoice; // Keep existing data if found
            });
            newAddon.configured = existingAddon.configured;
          }
        });

        // Merge parental policy choices if exists
        if (
          newOption.parentalPolicyChoices &&
          existingOption.parentalPolicyChoices
        ) {
          const existingParentalMainChoices =
            existingOption.parentalPolicyChoices.mainPolicyChoices.choices;
          newOption.parentalPolicyChoices.mainPolicyChoices.choices =
            newOption.parentalPolicyChoices.mainPolicyChoices.choices.map(
              (newChoice) => {
                const existingChoice = existingParentalMainChoices.find(
                  (ec) => ec.sumInsuredId === newChoice.sumInsuredId
                );
                return existingChoice || newChoice;
              }
            );
          newOption.parentalPolicyChoices.mainPolicyChoices.configured =
            existingOption.parentalPolicyChoices.mainPolicyChoices.configured;

          // Merge parental addons
          newOption.parentalPolicyChoices.addonChoices.forEach((newAddon) => {
            const existingAddon =
              existingOption.parentalPolicyChoices!.addonChoices.find(
                (ea) => ea.policyId === newAddon.policyId
              );
            if (existingAddon) {
              newAddon.choices = newAddon.choices.map((newChoice) => {
                const existingChoice = existingAddon.choices.find(
                  (ec) => ec.sumInsuredId === newChoice.sumInsuredId
                );
                return existingChoice || newChoice;
              });
              newAddon.configured = existingAddon.configured;
            }
          });
        }
      }
    });
  }

  return generatedPolicyOptions;
}

export interface PolicyChoicesFormErrors {
  general?: string; // For overall errors like "No choices available"
  // Specific errors per option can be added: [optionId: string]: { ... }
}

export interface PolicyChoicesManager {
  policyOptions: ConfiguredPolicyOption[];
  formErrors: PolicyChoicesFormErrors;
  // initializeData is now internal
  validateChoices: (
    fullConfig?: PolicyConfiguration["configuration"]
  ) => boolean;
  updateConfiguredPolicyOptionChoiceDetails: (
    configOptionId: string, // ID of the ConfiguredPolicyOption
    policyBranch: "base" | "parental",
    choiceTarget: "main" | "addon",
    addonPolicyIdToUpdate: string | undefined, // The policyId of the specific addon if choiceTarget is 'addon'
    newChoices: PolicyOptionChoice[]
  ) => void;
  // Add handlers for choice interactions later
}

export function usePolicyChoicesManager(
  initialDataProp?: ConfiguredPolicyOption[],
  fullConfigProp?: PolicyConfiguration["configuration"]
): PolicyChoicesManager {
  const [policyOptions, setPolicyOptions] = useState<ConfiguredPolicyOption[]>(
    []
  );
  const [formErrors, setFormErrors] = useState<PolicyChoicesFormErrors>({});
  const isInitialized = useRef(false);

  // Effect to initialize state from props
  useEffect(
    () => {
      if (!isInitialized.current) {
        console.log("usePolicyChoicesManager: Initializing state from props.");
        if (initialDataProp && initialDataProp.length > 0) {
          setPolicyOptions(initialDataProp);
        } else if (fullConfigProp) {
          // If no initial data but full config is available, try to build choices
          const generatedOptions = buildPolicyChoicesStructure(fullConfigProp);
          setPolicyOptions(generatedOptions);
        } else {
          // Default to empty if no data or config
          setPolicyOptions([]);
        }
        setFormErrors({});
        isInitialized.current = true;
      }
    },
    [initialDataProp, fullConfigProp] // Depend on the props
  );
  // Correction: Dependency array should include props to react to changes if needed,
  // but the `isInitialized` ref prevents re-running the *initialization* logic.
  // Let's keep the dependencies to initialDataProp and fullConfigProp so it *could*
  // theoretically re-run if those change *before* initialization, but the ref prevents
  // re-initialization *after* the first time. This seems the safest pattern.

  const validateChoices = (): boolean => {
    let allConfigured = true;
    const unconfiguredLabels: string[] = [];

    if (!policyOptions || policyOptions.length === 0) {
      // If there are no policy options generated (e.g., no parameters),
      // this might be valid depending on overall config logic.
      // For now, assume if policyOptions exist, they must be configured.
      setFormErrors({});
      return true;
    }

    for (const option of policyOptions) {
      if (!option.basePolicyChoices.mainPolicyChoices.configured) {
        allConfigured = false;
        unconfiguredLabels.push(
          `Option '${option.optionLabel}': Base Policy - Main`
        );
      }
      option.basePolicyChoices.addonChoices.forEach((addon) => {
        if (!addon.configured) {
          allConfigured = false;
          unconfiguredLabels.push(
            `Option '${option.optionLabel}': Base Policy Addon - ${addon.policyId}`
          );
        }
      });
      if (option.parentalPolicyChoices) {
        if (!option.parentalPolicyChoices.mainPolicyChoices.configured) {
          allConfigured = false;
          unconfiguredLabels.push(
            `Option '${option.optionLabel}': Parental Policy - Main`
          );
        }
        option.parentalPolicyChoices.addonChoices.forEach((addon) => {
          if (!addon.configured) {
            allConfigured = false;
            unconfiguredLabels.push(
              `Option '${option.optionLabel}': Parental Policy Addon - ${addon.policyId}`
            );
          }
        });
      }
    }

    if (!allConfigured) {
      setFormErrors({
        general: `All policy choices must be configured. Unconfigured items: ${unconfiguredLabels.join(
          ", "
        )}`,
      });
      return false;
    }
    setFormErrors({}); // Clear errors if validation passes or is trivial
    return true;
  };

  const updateConfiguredPolicyOptionChoiceDetails = (
    configOptionId: string,
    policyBranch: "base" | "parental",
    choiceTarget: "main" | "addon",
    addonPolicyIdToUpdate: string | undefined, // The policyId of the specific addon if choiceTarget is 'addon'
    newChoices: PolicyOptionChoice[]
  ) => {
    setPolicyOptions((prevOptions) =>
      prevOptions.map((option) => {
        if (option.optionId === configOptionId) {
          const updatedOption = { ...option };

          let targetChoiceMetaArray:
            | {
                mainPolicyChoices: PolicyOptionChoiceMeta;
                addonChoices: PolicyOptionChoiceMeta[];
              }
            | undefined;
          if (policyBranch === "base") {
            targetChoiceMetaArray = updatedOption.basePolicyChoices;
          } else if (
            policyBranch === "parental" &&
            updatedOption.parentalPolicyChoices
          ) {
            targetChoiceMetaArray = updatedOption.parentalPolicyChoices;
          }

          if (targetChoiceMetaArray) {
            if (choiceTarget === "main") {
              targetChoiceMetaArray.mainPolicyChoices = {
                ...targetChoiceMetaArray.mainPolicyChoices,
                choices: newChoices,
                configured: true, // Mark as configured
              };
            } else if (choiceTarget === "addon" && addonPolicyIdToUpdate) {
              targetChoiceMetaArray.addonChoices =
                targetChoiceMetaArray.addonChoices.map((addonMeta) => {
                  if (addonMeta.policyId === addonPolicyIdToUpdate) {
                    return {
                      ...addonMeta,
                      choices: newChoices,
                      configured: true,
                    }; // Update specific addon
                  }
                  return addonMeta;
                });
            }
          }
          return updatedOption;
        }
        return option;
      })
    );
    // Optionally, trigger a re-validation or other side effects here
    // For now, just log the update
    console.log(
      `Choices updated for ${configOptionId}, branch: ${policyBranch}, target: ${choiceTarget}, addonId: ${addonPolicyIdToUpdate}`
    );
  };

  return {
    policyOptions,
    formErrors,
    validateChoices,
    updateConfiguredPolicyOptionChoiceDetails,
  };
}
