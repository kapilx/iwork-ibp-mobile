/**
 * Utility functions for LIVE edit mode
 * These helpers identify existing vs new items when editing LIVE configurations
 */

import {
  PolicyComponent,
  ConfiguredPolicyOption,
  PolicyOptionChoice,
  GroupPolicyTemplateConfig,
} from "../PolicyConfigurator/policytypes";

/**
 * Check if a component exists in the snapshot (is an existing item)
 */
export const isExistingComponent = (
  componentId: string,
  snapshotComponents?: PolicyComponent[]
): boolean => {
  if (!snapshotComponents) return false;
  return snapshotComponents.some((comp) => comp.id === componentId);
};

/**
 * Check if a sum insured option exists in the snapshot for a given component
 */
export const isExistingSumInsured = (
  componentId: string,
  sumInsuredId: string,
  snapshotComponents?: PolicyComponent[]
): boolean => {
  if (!snapshotComponents) return false;

  const component = snapshotComponents.find((comp) => comp.id === componentId);
  if (!component?.sumInsuredOptions) return false;

  // Convert sumInsuredId to number for comparison since SumInsuredOption.id is number
  const numericId = parseInt(sumInsuredId, 10);
  return component.sumInsuredOptions.some((si) => si.id === numericId);
};

/**
 * Check if an addon is checked in the snapshot template
 */
export const isExistingAddonSelection = (
  addonId: string,
  snapshotTemplate?: GroupPolicyTemplateConfig,
  policyType?: "base" | "parental"
): boolean => {
  if (!snapshotTemplate) return false;

  const template =
    policyType === "parental"
      ? snapshotTemplate.parentalPolicy
      : snapshotTemplate.basePolicy;

  if (!template?.addonIds) return false;

  return template.addonIds.some((addon) => addon.optionId === addonId);
};

/**
 * Check if a main policy selection exists in snapshot
 */
export const isExistingMainPolicySelection = (
  policyId: string,
  snapshotTemplate?: GroupPolicyTemplateConfig,
  policyType?: "base" | "parental"
): boolean => {
  if (!snapshotTemplate) return false;

  const template =
    policyType === "parental"
      ? snapshotTemplate.parentalPolicy
      : snapshotTemplate.basePolicy;

  return template?.mainPolicyId === policyId;
};

/**
 * Check if a policy choice is configured in the snapshot
 * Returns true if the choice exists AND was configured (not just generated)
 */
export const isExistingPolicyChoice = (
  sumInsuredId: number,
  optionId: string,
  policyBranch: "base" | "parental",
  choiceType: "main" | "addon",
  addonPolicyId?: string,
  snapshotOptions?: ConfiguredPolicyOption[]
): boolean => {
  if (!snapshotOptions) return false;

  const option = snapshotOptions.find((opt) => opt.optionId === optionId);
  if (!option) return false;

  const choices =
    policyBranch === "base"
      ? option.basePolicyChoices
      : option.parentalPolicyChoices;

  if (!choices) return false;

  if (choiceType === "main") {
    // Check if main policy choices are configured
    if (!choices.mainPolicyChoices.configured) return false;

    return choices.mainPolicyChoices.choices.some(
      (choice) => choice.sumInsuredId === sumInsuredId
    );
  } else {
    // Check addon choices
    if (!addonPolicyId) return false;

    const addonChoice = choices.addonChoices.find(
      (addon) => addon.policyId === addonPolicyId
    );

    if (!addonChoice?.configured) return false;

    return addonChoice.choices.some(
      (choice) => choice.sumInsuredId === sumInsuredId
    );
  }
};

/**
 * Get the snapshot value for a policy choice
 * Used to preserve existing values when rebuilding choices
 */
export const getSnapshotChoiceValue = (
  sumInsuredId: number,
  optionId: string,
  policyBranch: "base" | "parental",
  choiceType: "main" | "addon",
  addonPolicyId: string | undefined,
  snapshotOptions?: ConfiguredPolicyOption[]
): PolicyOptionChoice | undefined => {
  if (!snapshotOptions) return undefined;

  const option = snapshotOptions.find((opt) => opt.optionId === optionId);
  if (!option) return undefined;

  const choices =
    policyBranch === "base"
      ? option.basePolicyChoices
      : option.parentalPolicyChoices;

  if (!choices) return undefined;

  if (choiceType === "main") {
    return choices.mainPolicyChoices.choices.find(
      (choice) => choice.sumInsuredId === sumInsuredId
    );
  } else {
    if (!addonPolicyId) return undefined;

    const addonChoice = choices.addonChoices.find(
      (addon) => addon.policyId === addonPolicyId
    );

    return addonChoice?.choices.find(
      (choice) => choice.sumInsuredId === sumInsuredId
    );
  }
};

/**
 * Check if entire policy option configuration is from snapshot
 */
export const isExistingPolicyOption = (
  optionId: string,
  snapshotOptions?: ConfiguredPolicyOption[]
): boolean => {
  if (!snapshotOptions) return false;
  return snapshotOptions.some((opt) => opt.optionId === optionId);
};

/**
 * Check if a default choice already exists in the snapshot for a given policy choice section
 * Used to prevent setting new choices as default when a default already exists
 */
export const hasExistingDefaultChoice = (
  optionId: string,
  policyBranch: "base" | "parental",
  choiceTarget: "main" | "addon",
  addonPolicyId?: string,
  snapshotOptions?: ConfiguredPolicyOption[]
): boolean => {
  if (!snapshotOptions) return false;

  const option = snapshotOptions.find((opt) => opt.optionId === optionId);
  if (!option) return false;

  const choices =
    policyBranch === "base"
      ? option.basePolicyChoices
      : option.parentalPolicyChoices;

  if (!choices) return false;

  if (choiceTarget === "main") {
    // Check if main policy has a configured default choice
    if (!choices.mainPolicyChoices.configured) return false;

    return choices.mainPolicyChoices.choices.some((choice) => choice.isDefault);
  } else {
    // Check addon choices
    if (!addonPolicyId) return false;

    const addonChoice = choices.addonChoices.find(
      (addon) => addon.policyId === addonPolicyId
    );

    if (!addonChoice?.configured) return false;

    return addonChoice.choices.some((choice) => choice.isDefault);
  }
};
