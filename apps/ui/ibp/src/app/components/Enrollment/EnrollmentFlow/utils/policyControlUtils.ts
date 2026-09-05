/**
 * Utility functions for policy control logic
 * Handles policy type detection and UI control rules
 */

export interface PolicyControlsResult {
  isParentalPolicySelection: boolean;
  isOptionalPolicy: boolean;
  hasNoDependents: boolean;
  showDeleteOption: boolean;
  disableSubmit: boolean;
}

const normalizeChoiceKey = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? null : String(value);

const matchesPolicySelection = (
  dependent: any,
  parentpolicyComponentActionTypeId?: string | null,
  policyComponentActionTypeId?: string | null,
): boolean => {
  const currentParentId = normalizeChoiceKey(parentpolicyComponentActionTypeId);
  const currentAddonId = normalizeChoiceKey(policyComponentActionTypeId);

  const matchesIds = (
    depParentId: number | string | null | undefined,
    depAddonId: number | string | null | undefined,
  ) =>
    normalizeChoiceKey(depParentId) === currentParentId &&
    normalizeChoiceKey(depAddonId) === currentAddonId;

  if (Array.isArray(dependent?.choices) && dependent.choices.length > 0) {
    if (
      dependent.choices.some((choice: any) =>
        matchesIds(
          choice?.parentpolicyComponentActionTypeId,
          choice?.policyComponentActionTypeId,
        ),
      )
    ) {
      return true;
    }
  }

  return matchesIds(
    dependent?.parentpolicyComponentActionTypeId,
    dependent?.policyComponentActionTypeId,
  );
};

/**
 * Determines UI controls for a policy based on its type and current state
 * @param policyComponentActionType - The action type of the policy component
 * @param policyComponentActionLabel - The action label of the policy component
 * @param policyGroup - The policy group (optional, compulsory, etc.)
 * @param familyMemberDetails - Current family member details
 * @param parentpolicyComponentActionTypeId - Parent policy component ID
 * @param policyComponentActionTypeId - Policy component ID
 * @param hasSelection - Whether there's a pending or committed selection
 * @param isEmployeeExcluded - Whether the employee (self) is excluded from the policy
 */
export const getPolicyUIControls = (
  policyComponentActionType: string | null,
  policyComponentActionLabel: string | null,
  policyGroup?: string,
  familyMemberDetails?: Record<string, any[]>,
  parentpolicyComponentActionTypeId?: string | null,
  policyComponentActionTypeId?: string | null,
  hasSelection?: boolean,
  isEmployeeExcluded?: boolean
): PolicyControlsResult => {
  const actionType = (policyComponentActionType ?? "").toLowerCase();
  const actionLabel = (policyComponentActionLabel ?? "").toLowerCase();
  const groupType = (policyGroup ?? "").toLowerCase();

  // Check if this is a parental policy
  const isParentalPolicySelection = (() => {
    const hasParentalKeywords =
      actionType.includes("parent") ||
      actionLabel.includes("parental") ||
      actionLabel.includes("parent");

    // Optional addons can belong to either base or parental tracks.
    // Use group context to classify parental optional addons correctly.
    const isParentalOptionalAddon =
      actionType.includes("optional") && groupType === "parental";

    return hasParentalKeywords || isParentalOptionalAddon;
  })();
  
  // Check if this is an optional policy (base-optional or parental-optional)
  const isOptionalPolicy = (() => {
    return (
      actionType.includes("optional") ||
      actionLabel.includes("optional") ||
      actionLabel.includes("addon") ||
      groupType === "optional"
    );
  })();
  
  let hasNoDependents = false;
  let showDeleteOption = false;
  
  // For parental policies, check if there are no dependents
  if (isParentalPolicySelection && familyMemberDetails) {
    const parentId = parentpolicyComponentActionTypeId;
    const typeId = policyComponentActionTypeId;
    
    const visibleDependents = Object.values(familyMemberDetails || {})
      .flat()
      .filter((dependent: any) =>
        matchesPolicySelection(dependent, parentId, typeId),
      );
    
    hasNoDependents = visibleDependents.length === 0;
  }
  
  // For optional policies, also consider if employee is excluded
  if (isOptionalPolicy && isEmployeeExcluded && familyMemberDetails) {
    const parentId = parentpolicyComponentActionTypeId;
    const typeId = policyComponentActionTypeId;
    
    const visibleDependents = Object.values(familyMemberDetails || {})
      .flat()
      .filter((dependent: any) =>
        matchesPolicySelection(dependent, parentId, typeId),
      );
    
    // If employee is excluded and no dependents, treat as no dependents scenario
    if (visibleDependents.length === 0) {
      hasNoDependents = true;
    }
  }
  
  // For optional policies, allow delete option if there's a selection
  if (isOptionalPolicy) {
    showDeleteOption = Boolean(hasSelection);
  }
  
  return {
    isParentalPolicySelection,
    isOptionalPolicy,
    hasNoDependents,
    showDeleteOption,
    disableSubmit: hasNoDependents
  };
};

/**
 * Checks if a dependent can be deleted based on policy rules
 * @param policyComponentActionType - The action type of the policy component
 * @param policyComponentActionLabel - The action label of the policy component
 * @param policyGroup - The policy group
 * @param dependent - The dependent to check
 * @param isReadOnly - Whether the form is in read-only mode
 */
export const canDeleteDependent = (
  policyComponentActionType: string | null,
  policyComponentActionLabel: string | null,
  policyGroup?: string,
  dependent?: any,
  isReadOnly?: boolean
): boolean => {
  if (isReadOnly) return false;
  
  // For employee/self, be extra restrictive - only allow for explicitly optional policies
  if (dependent?.relationship === "Self") {
    const actionType = (policyComponentActionType ?? "").toLowerCase();
    const actionLabel = (policyComponentActionLabel ?? "").toLowerCase();
    const groupType = (policyGroup ?? "").toLowerCase();
    
    // Check if it's explicitly a base policy (should NOT allow deletion)
    const isBasePolicy = (
      actionType.includes("base") ||
      actionLabel.includes("base") ||
      actionType === "base" ||
      actionLabel === "base policy" ||
      groupType === "compulsory" ||
      groupType === "mandatory"
    );
    
    if (isBasePolicy) return false;
    
    // Only allow deletion if it's explicitly optional
    const isExplicitlyOptional = (
      actionType.includes("optional") ||
      actionLabel.includes("optional") ||
      actionLabel.includes("addon") ||
      actionType.includes("addon") ||
      groupType === "optional"
    );
    
    return isExplicitlyOptional;
  }
  
  // For regular dependents, always allow delete.
  // The delete confirmation modal now communicates impacted choices and
  // removal is scoped in FamilyMembersManagement before syncing payload.
  return true;
};
