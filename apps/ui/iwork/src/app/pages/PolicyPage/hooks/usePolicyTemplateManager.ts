import { useState, useCallback } from "react";

import { POLICY_TEMPLATE } from "../../../constants";
import {
  PolicyTemplateConfigTypeMaster,
  GroupPolicyTemplateConfig,
  PolicyBranch,
  PolicyComponent,
} from "../PolicyConfigurator/policytypes";

export interface PolicyTemplateFormErrors {
  basePolicy?: {
    mainPolicyId?: string; // Error if base component not found
    addonIds?: string; // General error for addon selection
    addonRelations?: Record<string, string>; // Error per addon optionId for missing relations
    sequenceDuplicate?: string; // Group-level error if duplicate sequence values exist
    sequenceDuplicateRows?: Record<string, true>; // "main" or addon optionId for rows participating in a duplicate
  };
  parentalPolicy?: {
    mainPolicyId?: string; // Error if parental component not found (when template expects it)
    addonIds?: string; // General error for addon selection
    addonRelations?: Record<string, string>; // Error per addon optionId for missing relations
    sequenceDuplicate?: string; // Group-level error if duplicate sequence values exist
    sequenceDuplicateRows?: Record<string, true>; // "main" or addon optionId for rows participating in a duplicate
  };
  general?: string; // For errors like "No policy components available"
}

export interface PolicyTemplateManager {
  templateConfig: GroupPolicyTemplateConfig;
  formErrors: PolicyTemplateFormErrors;
  initializeData: (
    data?: GroupPolicyTemplateConfig,
    policyComponents?: PolicyComponent[],
    allowParental?: boolean
  ) => void;
  handleBaseAddonChange: (componentId: string, isChecked: boolean) => void;
  handleParentalAddonChange: (componentId: string, isChecked: boolean) => void;
  handleMainPolicyNumberChange: (
    policyType: PolicyBranch,
    field: "provisionPolicyNumber" | "insurerPolicyNumber" | "iirmPolicyNumber",
    value: string
  ) => void;
  handleAddonPolicyNumberChange: (
    policyType: PolicyBranch,
    addonOptionId: string,
    field: "provisionPolicyNumber" | "insurerPolicyNumber" | "iirmPolicyNumber",
    value: string
  ) => void;
  handleMainPolicyRelationToggle: (
    policyType: PolicyBranch,
    relationType: string
  ) => void;
  handleAddonPolicyRelationToggle: (
    policyType: PolicyBranch,
    addonOptionId: string,
    relationType: string
  ) => void;
  handleClubSumInsuredToggle: (policyType: PolicyBranch) => void;
  handleAddonSequenceChange: (
    policyType: PolicyBranch,
    addonOptionId: string,
    sequenceStr: string
  ) => void;
  validateTemplate: (
    policyComponents: PolicyComponent[],
    isParentsRelationEnabled?: boolean
  ) => boolean;
}

const getDefaultTemplate = (
  policyComponents?: PolicyComponent[],
  allowParental: boolean = true
): GroupPolicyTemplateConfig => {
  const baseComp = policyComponents?.find((c) => c.type === "base");
  const parentalComp = policyComponents?.find((c) => c.type === "parental");

  const template: GroupPolicyTemplateConfig = {
    basePolicy: {
      mainPolicyId: baseComp?.id || "", // Should always find a base component
      provisionPolicyNumber:
        PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue,
      insurerPolicyNumber:
        PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue,
      iirmPolicyNumber:
        PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
      eligibleRelations: ["Self"], // Self is checked by default for base policy
      clubSumInsured: false, // Default to false
      addonIds: [],
    },
  };

  if (parentalComp && allowParental) {
    template.parentalPolicy = {
      mainPolicyId: parentalComp.id,
      provisionPolicyNumber:
        PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue,
      insurerPolicyNumber:
        PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue,
      iirmPolicyNumber:
        PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
      eligibleRelations: [], // Empty array - all unchecked for parental policy
      clubSumInsured: false, // Default to false
      addonIds: [],
    };
  }
  return template;
};

export function usePolicyTemplateManager(): PolicyTemplateManager {
  const [templateConfig, setTemplateConfig] =
    useState<GroupPolicyTemplateConfig>(getDefaultTemplate());
  const [formErrors, setFormErrors] = useState<PolicyTemplateFormErrors>({});

  const initializeData = useCallback(
    (
      data?: GroupPolicyTemplateConfig,
      currentPolicyComponents?: PolicyComponent[],
      allowParental: boolean = true
    ) => {
      const baseComp = currentPolicyComponents?.find((c) => c.type === "base");
      const parentalComp = currentPolicyComponents?.find(
        (c) => c.type === "parental"
      );

      const newTemplate = getDefaultTemplate(
        currentPolicyComponents,
        allowParental
      );

      if (data) {
        // Merge initial data carefully
        if (baseComp) {
          newTemplate.basePolicy.mainPolicyId = baseComp.id; // Main policy ID is fixed
          newTemplate.basePolicy.provisionPolicyNumber =
            data.basePolicy?.provisionPolicyNumber ??
            PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue;
          newTemplate.basePolicy.insurerPolicyNumber =
            data.basePolicy?.insurerPolicyNumber ??
            PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue;
          newTemplate.basePolicy.iirmPolicyNumber =
            data.basePolicy?.iirmPolicyNumber ??
            PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue;
          newTemplate.basePolicy.eligibleRelations = data.basePolicy
            ?.eligibleRelations ?? ["Self"]; // Default to Self checked
          newTemplate.basePolicy.clubSumInsured =
            data.basePolicy?.clubSumInsured ?? false; // Default to false
          const baseAddons = data.basePolicy?.addonIds || [];
          if (baseAddons.length > 0 && typeof baseAddons[0] === "string") {
            // Old format: array of strings. We know it's a string but TS doesn't
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newTemplate.basePolicy.addonIds = (baseAddons as any[])
              .map((id, index) => ({
                optionId: id,
                sequence: index + 1,
                provisionPolicyNumber:
                  PolicyTemplateConfigTypeMaster.provisionPolicyNumber
                    .defaultValue,
                insurerPolicyNumber:
                  PolicyTemplateConfigTypeMaster.insurerPolicyNumber
                    .defaultValue,
                iirmPolicyNumber:
                  PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
                eligibleRelations: [], // Empty array - all unchecked for base addons
              }))
              .filter((addon) =>
                currentPolicyComponents?.some(
                  (c) => c.id === addon.optionId && c.type === "optional"
                )
              );
          } else {
            // New format or empty: array of objects
            newTemplate.basePolicy.addonIds = (
              baseAddons as {
                optionId: string;
                sequence?: number;
                provisionPolicyNumber?: string;
                insurerPolicyNumber?: string;
                iirmPolicyNumber?: string;
                eligibleRelations?: string[];
              }[]
            )
              .map((addon, index) => ({
                optionId: addon.optionId,
                sequence: addon.sequence ?? index + 1,
                provisionPolicyNumber:
                  addon.provisionPolicyNumber ??
                  PolicyTemplateConfigTypeMaster.provisionPolicyNumber
                    .defaultValue,
                insurerPolicyNumber:
                  addon.insurerPolicyNumber ??
                  PolicyTemplateConfigTypeMaster.insurerPolicyNumber
                    .defaultValue,
                iirmPolicyNumber:
                  addon.iirmPolicyNumber ??
                  PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
                eligibleRelations: addon.eligibleRelations ?? [], // Empty array - all unchecked for base addons
              }))
              .filter((addon) =>
                currentPolicyComponents?.some(
                  (c) => c.id === addon.optionId && c.type === "optional"
                )
              );
          }
        }

        if (parentalComp && allowParental) {
          if (!newTemplate.parentalPolicy) {
            newTemplate.parentalPolicy = {
              mainPolicyId: parentalComp.id,
              provisionPolicyNumber:
                PolicyTemplateConfigTypeMaster.provisionPolicyNumber
                  .defaultValue,
              insurerPolicyNumber:
                PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue,
              iirmPolicyNumber:
                PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
              eligibleRelations: [], // Empty array - all unchecked for parental policy
              clubSumInsured: false, // Default to false
              addonIds: [],
            };
          } else {
            newTemplate.parentalPolicy.mainPolicyId = parentalComp.id;
          }
          newTemplate.parentalPolicy.provisionPolicyNumber =
            data.parentalPolicy?.provisionPolicyNumber ??
            PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue;
          newTemplate.parentalPolicy.insurerPolicyNumber =
            data.parentalPolicy?.insurerPolicyNumber ??
            PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue;
          newTemplate.parentalPolicy.iirmPolicyNumber =
            data.parentalPolicy?.iirmPolicyNumber ??
            PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue;
          // Use existing parental relations or default to empty array
          newTemplate.parentalPolicy.eligibleRelations =
            data.parentalPolicy?.eligibleRelations ?? [];
          newTemplate.parentalPolicy.clubSumInsured =
            data.parentalPolicy?.clubSumInsured ?? false; // Default to false

          const parentalAddons = data.parentalPolicy?.addonIds || [];
          if (
            parentalAddons.length > 0 &&
            typeof parentalAddons[0] === "string"
          ) {
            // Old format: array of strings - how do you escape the lint error here. We know
            // it's a string but TS doesn't
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newTemplate.parentalPolicy.addonIds = (parentalAddons as any[])
              .map((id, index) => ({
                optionId: id,
                sequence: index + 1,
                provisionPolicyNumber:
                  PolicyTemplateConfigTypeMaster.provisionPolicyNumber
                    .defaultValue,
                insurerPolicyNumber:
                  PolicyTemplateConfigTypeMaster.insurerPolicyNumber
                    .defaultValue,
                iirmPolicyNumber:
                  PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
                eligibleRelations: [], // Empty array - all unchecked for parental addons
              }))
              .filter((addon) =>
                currentPolicyComponents?.some(
                  (c) => c.id === addon.optionId && c.type === "optional"
                )
              );
          } else {
            // New format or empty: array of objects
            newTemplate.parentalPolicy.addonIds = (
              parentalAddons as {
                optionId: string;
                sequence?: number;
                provisionPolicyNumber?: string;
                insurerPolicyNumber?: string;
                iirmPolicyNumber?: string;
                eligibleRelations?: string[];
              }[]
            )
              .map((addon, index) => {
                // Use existing addon relations or default to empty array
                return {
                  optionId: addon.optionId,
                  sequence: addon.sequence ?? index + 1,
                  provisionPolicyNumber:
                    addon.provisionPolicyNumber ??
                    PolicyTemplateConfigTypeMaster.provisionPolicyNumber
                      .defaultValue,
                  insurerPolicyNumber:
                    addon.insurerPolicyNumber ??
                    PolicyTemplateConfigTypeMaster.insurerPolicyNumber
                      .defaultValue,
                  iirmPolicyNumber:
                    addon.iirmPolicyNumber ??
                    PolicyTemplateConfigTypeMaster.iirmPolicyNumber
                      .defaultValue,
                  eligibleRelations: addon.eligibleRelations ?? [], // Empty array - all unchecked for parental addons
                };
              })
              .filter((addon) =>
                currentPolicyComponents?.some(
                  (c) => c.id === addon.optionId && c.type === "optional"
                )
              );
          }
        } else {
          delete newTemplate.parentalPolicy;
        }
      }
      if (!allowParental) {
        delete newTemplate.parentalPolicy;
      }
      setTemplateConfig(newTemplate);
      setFormErrors({});
    },
    []
  );
  const handleBaseAddonChange = (componentId: string, isChecked: boolean) => {
    setTemplateConfig((prev) => {
      let updatedAddonIds;
      if (isChecked) {
        const usedSequences = [
          ...prev.basePolicy.addonIds.map((a) => a.sequence),
          ...(prev.parentalPolicy?.addonIds.map((a) => a.sequence) ?? []),
        ];
        const nextSequence =
          usedSequences.length > 0 ? Math.max(...usedSequences) + 1 : 1;
        updatedAddonIds = [
          ...prev.basePolicy.addonIds,
          {
            optionId: componentId,
            sequence: nextSequence,
            provisionPolicyNumber:
              PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue,
            insurerPolicyNumber:
              PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue,
            iirmPolicyNumber:
              PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
            eligibleRelations: [], // Empty array - all unchecked for new addons
          },
        ];
      } else {
        updatedAddonIds = prev.basePolicy.addonIds.filter(
          (addon) => addon.optionId !== componentId
        );
      }

      return {
        ...prev,
        basePolicy: {
          ...prev.basePolicy,
          addonIds: updatedAddonIds,
          // Reset clubSumInsured to false if no addons are left
          clubSumInsured:
            updatedAddonIds.length > 0 ? prev.basePolicy.clubSumInsured : false,
        },
      };
    });

    // Clear error for this addon when it's unchecked
    if (!isChecked) {
      setFormErrors((prev) => {
        const updatedErrors = { ...prev };
        if (updatedErrors.basePolicy?.addonRelations) {
          const { [componentId]: removed, ...remaining } =
            updatedErrors.basePolicy.addonRelations;
          if (Object.keys(remaining).length === 0) {
            delete updatedErrors.basePolicy.addonRelations;
          } else {
            updatedErrors.basePolicy.addonRelations = remaining;
          }
        }
        return updatedErrors;
      });
    }
  };

  const handleParentalAddonChange = (
    componentId: string,
    isChecked: boolean
  ) => {
    setTemplateConfig((prev) => {
      if (!prev.parentalPolicy) return prev; // Should not happen if UI is correct

      let updatedAddonIds;
      if (isChecked) {
        const usedSequences = [
          ...prev.basePolicy.addonIds.map((a) => a.sequence),
          ...prev.parentalPolicy.addonIds.map((a) => a.sequence),
        ];
        const nextSequence =
          usedSequences.length > 0 ? Math.max(...usedSequences) + 1 : 1;
        updatedAddonIds = [
          ...prev.parentalPolicy.addonIds,
          {
            optionId: componentId,
            sequence: nextSequence,
            provisionPolicyNumber:
              PolicyTemplateConfigTypeMaster.provisionPolicyNumber.defaultValue,
            insurerPolicyNumber:
              PolicyTemplateConfigTypeMaster.insurerPolicyNumber.defaultValue,
            iirmPolicyNumber:
              PolicyTemplateConfigTypeMaster.iirmPolicyNumber.defaultValue,
            eligibleRelations: [], // Empty array - all unchecked for parental addons
          },
        ];
      } else {
        updatedAddonIds = prev.parentalPolicy.addonIds.filter(
          (addon) => addon.optionId !== componentId
        );
      }

      return {
        ...prev,
        parentalPolicy: {
          ...prev.parentalPolicy,
          addonIds: updatedAddonIds,
          // Reset clubSumInsured to false if no addons are left
          clubSumInsured:
            updatedAddonIds.length > 0
              ? prev.parentalPolicy.clubSumInsured
              : false,
        },
      };
    });

    // Clear error for this addon when it's unchecked
    if (!isChecked) {
      setFormErrors((prev) => {
        const updatedErrors = { ...prev };
        if (updatedErrors.parentalPolicy?.addonRelations) {
          const { [componentId]: removed, ...remaining } =
            updatedErrors.parentalPolicy.addonRelations;
          if (Object.keys(remaining).length === 0) {
            delete updatedErrors.parentalPolicy.addonRelations;
          } else {
            updatedErrors.parentalPolicy.addonRelations = remaining;
          }
        }
        return updatedErrors;
      });
    }
  };

  const handleMainPolicyNumberChange = useCallback(
    (
      policyType: PolicyBranch,
      field:
        | "provisionPolicyNumber"
        | "insurerPolicyNumber"
        | "iirmPolicyNumber",
      value: string
    ) => {
      setTemplateConfig((prev) => {
        if (policyType === PolicyBranch.BASE) {
          return {
            ...prev,
            basePolicy: { ...prev.basePolicy, [field]: value },
          };
        }
        if (policyType === PolicyBranch.PARENTAL && prev.parentalPolicy) {
          return {
            ...prev,
            parentalPolicy: { ...prev.parentalPolicy, [field]: value },
          };
        }
        return prev;
      });
    },
    []
  );

  const handleAddonPolicyNumberChange = useCallback(
    (
      policyType: PolicyBranch,
      addonOptionId: string,
      field:
        | "provisionPolicyNumber"
        | "insurerPolicyNumber"
        | "iirmPolicyNumber",
      value: string
    ) => {
      setTemplateConfig((prev) => {
        const targetPolicy =
          policyType === PolicyBranch.BASE ? prev.basePolicy : prev.parentalPolicy;
        if (!targetPolicy) return prev;

        const updatedAddonIds = targetPolicy.addonIds.map((addon) =>
          addon.optionId === addonOptionId
            ? { ...addon, [field]: value }
            : addon
        );

        if (policyType === PolicyBranch.BASE) {
          return {
            ...prev,
            basePolicy: { ...prev.basePolicy, addonIds: updatedAddonIds },
          };
        }
        if (policyType === PolicyBranch.PARENTAL) {
          return {
            ...prev,
            parentalPolicy: {
              ...prev.parentalPolicy!,
              addonIds: updatedAddonIds,
            },
          };
        }
        return prev;
      });
    },
    []
  );
  const handleMainPolicyRelationToggle = useCallback(
    (policyType: PolicyBranch, relationType: string) => {
      setTemplateConfig((prev) => {
        if (policyType === PolicyBranch.BASE) {
          const currentRelations = prev.basePolicy.eligibleRelations || [];
          const updatedRelations = currentRelations.includes(relationType)
            ? currentRelations.filter((r) => r !== relationType)
            : [...currentRelations, relationType];

          return {
            ...prev,
            basePolicy: {
              ...prev.basePolicy,
              eligibleRelations: updatedRelations,
            },
          };
        }

        if (policyType === PolicyBranch.PARENTAL && prev.parentalPolicy) {
          const currentRelations = prev.parentalPolicy.eligibleRelations || [];
          const updatedRelations = currentRelations.includes(relationType)
            ? currentRelations.filter((r) => r !== relationType)
            : [...currentRelations, relationType];

          return {
            ...prev,
            parentalPolicy: {
              ...prev.parentalPolicy,
              eligibleRelations: updatedRelations,
            },
          };
        }

        return prev;
      });
    },
    []
  );

  const handleAddonPolicyRelationToggle = useCallback(
    (
      policyType: PolicyBranch,
      addonOptionId: string,
      relationType: string
    ) => {
      setTemplateConfig((prev) => {
        const targetPolicy =
          policyType === PolicyBranch.BASE ? prev.basePolicy : prev.parentalPolicy;
        if (!targetPolicy) return prev;

        const updatedAddonIds = targetPolicy.addonIds.map((addon) => {
          if (addon.optionId === addonOptionId) {
            const currentRelations = addon.eligibleRelations || [];
            const updatedRelations = currentRelations.includes(relationType)
              ? currentRelations.filter((r) => r !== relationType)
              : [...currentRelations, relationType];

            return { ...addon, eligibleRelations: updatedRelations };
          }
          return addon;
        });

        if (policyType === PolicyBranch.BASE) {
          return {
            ...prev,
            basePolicy: { ...prev.basePolicy, addonIds: updatedAddonIds },
          };
        }

        if (policyType === PolicyBranch.PARENTAL) {
          return {
            ...prev,
            parentalPolicy: {
              ...prev.parentalPolicy!,
              addonIds: updatedAddonIds,
            },
          };
        }

        return prev;
      });

      // Clear error for this addon if at least one relation is now selected
      setFormErrors((prev) => {
        const updatedErrors = { ...prev };
        const targetPolicy =
          policyType === PolicyBranch.BASE ? "basePolicy" : "parentalPolicy";
        const addonRelations = updatedErrors[targetPolicy]?.addonRelations;

        if (addonRelations && addonRelations[addonOptionId]) {
          // Check if addon now has relations after this toggle
          setTemplateConfig((config) => {
            const policy =
              policyType === PolicyBranch.BASE ? config.basePolicy : config.parentalPolicy;
            if (policy) {
              const addon = policy.addonIds.find(
                (a) => a.optionId === addonOptionId
              );
              if (
                addon &&
                addon.eligibleRelations &&
                addon.eligibleRelations.length > 0
              ) {
                // Clear the error
                const { [addonOptionId]: removed, ...remaining } =
                  addonRelations;
                if (Object.keys(remaining).length === 0) {
                  delete updatedErrors[targetPolicy]!.addonRelations;
                } else {
                  updatedErrors[targetPolicy]!.addonRelations = remaining;
                }
              }
            }
            return config;
          });
        }

        return updatedErrors;
      });
    },
    []
  );

  const handleClubSumInsuredToggle = useCallback(
    (policyType: PolicyBranch) => {
      setTemplateConfig((prev) => {
        if (policyType === PolicyBranch.BASE) {
          return {
            ...prev,
            basePolicy: {
              ...prev.basePolicy,
              clubSumInsured: !prev.basePolicy.clubSumInsured,
            },
          };
        }

        if (policyType === PolicyBranch.PARENTAL && prev.parentalPolicy) {
          return {
            ...prev,
            parentalPolicy: {
              ...prev.parentalPolicy,
              clubSumInsured: !prev.parentalPolicy.clubSumInsured,
            },
          };
        }

        return prev;
      });
    },
    []
  );

  const clearSequenceErrors = useCallback(() => {
    setFormErrors((prev) => {
      const hasBase =
        prev.basePolicy?.sequenceDuplicate ||
        prev.basePolicy?.sequenceDuplicateRows;
      const hasParental =
        prev.parentalPolicy?.sequenceDuplicate ||
        prev.parentalPolicy?.sequenceDuplicateRows;
      if (!hasBase && !hasParental) return prev;
      const next = { ...prev };
      if (hasBase) {
        const baseGroup = { ...(next.basePolicy || {}) };
        delete baseGroup.sequenceDuplicate;
        delete baseGroup.sequenceDuplicateRows;
        next.basePolicy = baseGroup;
      }
      if (hasParental) {
        const parentalGroup = { ...(next.parentalPolicy || {}) };
        delete parentalGroup.sequenceDuplicate;
        delete parentalGroup.sequenceDuplicateRows;
        next.parentalPolicy = parentalGroup;
      }
      return next;
    });
  }, []);

  const handleAddonSequenceChange = useCallback(
    (
      policyType: PolicyBranch,
      addonOptionId: string,
      sequenceStr: string
    ) => {
      const parsed = parseInt(sequenceStr, 10);
      if (isNaN(parsed) && sequenceStr !== "") return;
      const nextSequence = isNaN(parsed) ? 0 : parsed;

      setTemplateConfig((prev) => {
        const targetPolicy =
          policyType === PolicyBranch.BASE ? prev.basePolicy : prev.parentalPolicy;
        if (!targetPolicy) return prev;

        const updatedAddonIds = targetPolicy.addonIds.map((addon) =>
          addon.optionId === addonOptionId
            ? { ...addon, sequence: nextSequence }
            : addon
        );

        if (policyType === PolicyBranch.BASE) {
          return {
            ...prev,
            basePolicy: { ...prev.basePolicy, addonIds: updatedAddonIds },
          };
        }
        return {
          ...prev,
          parentalPolicy: {
            ...prev.parentalPolicy!,
            addonIds: updatedAddonIds,
          },
        };
      });
      clearSequenceErrors();
    },
    [clearSequenceErrors]
  );

  const validateTemplate = (
    policyComponents: PolicyComponent[],
    isParentsRelationEnabled: boolean = true
  ): boolean => {
    const errors: PolicyTemplateFormErrors = {};
    let isValid = true;

    const baseComp = policyComponents.find((c) => c.type === "base");
    if (!baseComp || !templateConfig.basePolicy.mainPolicyId) {
      errors.basePolicy = {
        ...(errors.basePolicy || {}),
        mainPolicyId: "Base policy component is missing or not selected.",
      };
      isValid = false;
    }

    // Collect sequence rows across base and parental (parental only when allowed)
    // for a single cross-group duplicate check. Each branch's duplicate rows
    // are tracked separately so the per-row error styling stays scoped.
    const allSeqRows: {
      branch: PolicyBranch;
      key: string;
      value: number;
    }[] = [];
    templateConfig.basePolicy.addonIds.forEach((addon) => {
      allSeqRows.push({
        branch: PolicyBranch.BASE,
        key: addon.optionId,
        value: addon.sequence,
      });
    });
    if (isParentsRelationEnabled && templateConfig.parentalPolicy) {
      templateConfig.parentalPolicy.addonIds.forEach((addon) => {
        allSeqRows.push({
          branch: PolicyBranch.PARENTAL,
          key: addon.optionId,
          value: addon.sequence,
        });
      });
    }
    const seqCounts = allSeqRows.reduce<Record<number, number>>((acc, row) => {
      acc[row.value] = (acc[row.value] || 0) + 1;
      return acc;
    }, {});
    const baseDupRows: Record<string, true> = {};
    const parentalDupRows: Record<string, true> = {};
    allSeqRows.forEach((row) => {
      if (seqCounts[row.value] > 1) {
        if (row.branch === PolicyBranch.BASE) {
          baseDupRows[row.key] = true;
        } else {
          parentalDupRows[row.key] = true;
        }
      }
    });
    if (Object.keys(baseDupRows).length > 0) {
      errors.basePolicy = {
        ...(errors.basePolicy || {}),
        sequenceDuplicate: POLICY_TEMPLATE.SEQUENCE_DUPLICATE_ERROR,
        sequenceDuplicateRows: baseDupRows,
      };
      isValid = false;
    }
    if (Object.keys(parentalDupRows).length > 0) {
      errors.parentalPolicy = {
        ...(errors.parentalPolicy || {}),
        sequenceDuplicate: POLICY_TEMPLATE.SEQUENCE_DUPLICATE_ERROR,
        sequenceDuplicateRows: parentalDupRows,
      };
      isValid = false;
    }

    // Validate base policy addons - each checked addon must have at least one relation
    const baseAddonRelationErrors: Record<string, string> = {};
    templateConfig.basePolicy.addonIds.forEach((addon) => {
      if (!addon.eligibleRelations || addon.eligibleRelations.length === 0) {
        baseAddonRelationErrors[addon.optionId] =
          "Please select at least one eligible relation for this addon.";
        isValid = false;
      }
    });
    if (Object.keys(baseAddonRelationErrors).length > 0) {
      errors.basePolicy = {
        ...(errors.basePolicy || {}),
        addonRelations: baseAddonRelationErrors,
      };
    }

    // Only validate parental policy if parents relation is enabled
    if (isParentsRelationEnabled) {
      const parentalComp = policyComponents.find((c) => c.type === "parental");
      if (
        parentalComp &&
        (!templateConfig.parentalPolicy ||
          !templateConfig.parentalPolicy.mainPolicyId)
      ) {
        errors.parentalPolicy = {
          ...(errors.parentalPolicy || {}),
          mainPolicyId:
            "Parental policy component is configured but not selected in template.",
        };
        isValid = false;
      }

      // Validate parental policy addons - each checked addon must have at least one relation
      if (templateConfig.parentalPolicy) {
        const parentalAddonRelationErrors: Record<string, string> = {};
        templateConfig.parentalPolicy.addonIds.forEach((addon) => {
          if (
            !addon.eligibleRelations ||
            addon.eligibleRelations.length === 0
          ) {
            parentalAddonRelationErrors[addon.optionId] =
              "Please select at least one eligible relation for this addon.";
            isValid = false;
          }
        });
        if (Object.keys(parentalAddonRelationErrors).length > 0) {
          errors.parentalPolicy = {
            ...(errors.parentalPolicy || {}),
            addonRelations: parentalAddonRelationErrors,
          };
        }
      }
    }
    // Addon ID validation can be more complex if needed (e.g., ensuring they are not main IDs)
    // but current filtering in handlers and initializeData helps.

    setFormErrors(errors);
    return isValid;
  };

  return {
    templateConfig,
    formErrors,
    initializeData,
    handleBaseAddonChange,
    handleParentalAddonChange,
    handleMainPolicyNumberChange,
    handleAddonPolicyNumberChange,
    handleMainPolicyRelationToggle,
    handleAddonPolicyRelationToggle,
    handleClubSumInsuredToggle,
    handleAddonSequenceChange,
    validateTemplate,
  };
}
