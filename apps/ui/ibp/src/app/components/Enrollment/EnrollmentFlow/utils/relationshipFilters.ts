import {
  SPOUSE_PARTNERS,
  SPOUSE_PARTNERS_PAYLOAD,
} from "../../../../constants";
import {
  ConstraintsConfig,
  DependentDetails,
  RelationshipData,
} from "../types";

export const normalizeRelationship = (relationship: string) => {
  if (!relationship) return relationship;
  return relationship === SPOUSE_PARTNERS_PAYLOAD
    ? SPOUSE_PARTNERS
    : relationship;
};

export const isInLawRelationship = (relationshipName?: string) =>
  typeof relationshipName === "string" &&
  relationshipName.toLowerCase().includes("in-law");

const getRelationshipAliases = (relationshipName?: string) => {
  if (!relationshipName) return [] as string[];

  const normalized = normalizeRelationship(relationshipName)?.toLowerCase().trim();
  if (!normalized) return [] as string[];

  if (
    ["partner", "spouse", "spouse/partner", "wife", "husband"].includes(
      normalized
    )
  ) {
    return ["partner", "spouse", "spouse/partner", "wife", "husband"];
  }

  if (["parent", "parents", "father", "mother"].includes(normalized)) {
    return ["parent", "parents", "father", "mother"];
  }

  if (["child", "children", "son", "daughter"].includes(normalized)) {
    return ["child", "children", "son", "daughter"];
  }

  return [normalized];
};

export const getParentRole = (relationshipName?: string) => {
  if (!relationshipName) return null;

  const normalized = relationshipName.toLowerCase();

  if (normalized.includes("father")) {
    return "father" as const;
  }

  if (normalized.includes("mother")) {
    return "mother" as const;
  }

  return null;
};

const getConfiguredOptions = (relation?: {
  configuredOptions: { name: string; enabled?: boolean }[];
}) => {
  if (!relation || !Array.isArray(relation.configuredOptions)) {
    return [] as {
      name: string;
      enabled?: boolean;
      maxAge?: string;
      minAge?: string;
    }[];
  }

  return relation.configuredOptions.filter((option) => option && option.name);
};

const matchesRelationshipName = (
  configuredName?: string,
  relationshipName?: string
) => {
  if (!configuredName || !relationshipName) return false;

  const configuredAliases = getRelationshipAliases(configuredName);
  const relationshipAliases = getRelationshipAliases(relationshipName);

  return configuredAliases.some((alias) => relationshipAliases.includes(alias));
};

export const getRelationTypeForRelationship = (
  policyData: RelationshipData | undefined,
  relationshipName: string
) => {
  if (!relationshipName || !policyData?.enabledPolicyRelations) return null;

  const normalizedRelationshipName = normalizeRelationship(relationshipName);

  for (const relation of policyData.enabledPolicyRelations) {
    if (!relation?.type) continue;

    const normalizedRelationType = normalizeRelationship(relation.type);
    if (
      normalizedRelationType &&
      normalizedRelationshipName &&
      normalizedRelationType.toLowerCase() ===
        normalizedRelationshipName.toLowerCase()
    ) {
      return relation.type;
    }

    const configuredOptions = getConfiguredOptions(relation);
    const configOption = configuredOptions.find(
      (cfg) => matchesRelationshipName(cfg.name, relationshipName)
    );

    if (configOption) {
      return relation.type;
    }
  }

  return null;
};

export const getAgeConstraintsForRelationship = (
  policyData: RelationshipData | undefined,
  relationshipName: string,
  studyingSonAgeExtension: number,
  unmarriedDaughterAgeExtension = 0
) => {
  if (!relationshipName || !policyData?.enabledPolicyRelations)
    return { minAge: null, maxAge: null, relationType: null } as const;

  for (const relation of policyData.enabledPolicyRelations) {
    if (!relation?.type) continue;

    const configuredOptions = getConfiguredOptions(relation);
    const configOption = configuredOptions.find(
      (cfg) =>
        matchesRelationshipName(cfg.name, relationshipName) &&
        cfg.enabled !== false
    );
    if (configOption) {
      const minAge = configOption.minAge
        ? parseInt(configOption.minAge, 10)
        : null;
      let maxAge = configOption.maxAge
        ? parseInt(configOption.maxAge, 10)
        : null;

      if (
        relation.type?.toLowerCase() === "children" &&
        relationshipName.toLowerCase() === "son" &&
        maxAge !== null
      ) {
        maxAge += studyingSonAgeExtension;
      }

      if (
        relation.type?.toLowerCase() === "children" &&
        relationshipName.toLowerCase() === "daughter" &&
        maxAge !== null
      ) {
        maxAge += unmarriedDaughterAgeExtension;
      }

      return {
        minAge,
        maxAge,
        relationType: relation.type,
      } as const;
    }
  }

  return { minAge: null, maxAge: null, relationType: null } as const;
};

interface ParentSelectionConfig {
  relationshipName: string;
  policyData: RelationshipData | undefined;
  dependents: DependentDetails[];
  constraints: Pick<
    ConstraintsConfig,
    | "crossParentsAllowed"
    | "sameGenderParentsAllowed"
    | "maleEmployeesCoverInLaws"
    | "maleEmployeesCoverParents"
    | "femaleEmployeesCoverInLaws"
    | "femaleEmployeesCoverParents"
  >;
  employeeGender?: string;
}

export const canSelectRelationship = ({
  relationshipName,
  policyData,
  dependents,
  constraints,
  employeeGender,
}: ParentSelectionConfig) => {
  if (!relationshipName) {
    return { allowed: true } as const;
  }

  const relationType = getRelationTypeForRelationship(
    policyData,
    relationshipName
  );
  const relationTypeLower = relationType?.toLowerCase();

  if (relationTypeLower !== "parents") {
    return { allowed: true } as const;
  }

  // A generic "Parent" relation has no Father/Mother/in-law role, so the name-based
  // rules below (duplicate-name, same-gender, cross-parents, cover) can't be evaluated
  // for it. It is allowed by name and gated only by the parents maxCount; the
  // gender-based combination rules are enforced via the Gender dropdown instead.
  if (relationshipName.toLowerCase().trim() === "parent") {
    return { allowed: true } as const;
  }

  const isInLaw = isInLawRelationship(relationshipName);
  const parentRole = getParentRole(relationshipName);
  const sameGenderParentsAllowed =
    constraints.sameGenderParentsAllowed !== false;
  const existingParents = dependents.filter((dependent) => {
    const dependentType =
      dependent.relationship || dependent.relationshipType || "";
    if (!dependentType) return false;
    const dependentRelationType = getRelationTypeForRelationship(
      policyData,
      dependentType
    );
    return dependentRelationType?.toLowerCase() === "parents";
  });

  const hasInLawParent = existingParents.some((parent) =>
    isInLawRelationship(parent.relationship || parent.relationshipType || "")
  );
  const hasOwnParent = existingParents.some(
    (parent) =>
      !isInLawRelationship(parent.relationship || parent.relationshipType || "")
  );

  const existingOwnParentRoles = existingParents
    .filter(
      (parent) =>
        !isInLawRelationship(
          parent.relationship || parent.relationshipType || ""
        )
    )
    .map((parent) =>
      getParentRole(parent.relationship || parent.relationshipType || "")
    )
    .filter((role): role is "father" | "mother" => role !== null);

  const existingInLawParentRoles = existingParents
    .filter((parent) =>
      isInLawRelationship(parent.relationship || parent.relationshipType || "")
    )
    .map((parent) =>
      getParentRole(parent.relationship || parent.relationshipType || "")
    )
    .filter((role): role is "father" | "mother" => role !== null);

  const sameRelationshipAlreadySelected = existingParents.some((parent) => {
    const parentRelationship = parent.relationship || parent.relationshipType;
    if (!parentRelationship) return false;
    return parentRelationship.toLowerCase() === relationshipName.toLowerCase();
  });

  if (sameRelationshipAlreadySelected) {
    return {
      allowed: false,
      message: "This parent relationship has already been added.",
    } as const;
  }
  if (!sameGenderParentsAllowed && parentRole) {
    if (
      (isInLaw && existingOwnParentRoles.includes(parentRole)) ||
      (!isInLaw && existingInLawParentRoles.includes(parentRole))
    ) {
      return {
        allowed: false,
        message: "Same-gender parent combinations are not allowed.",
      } as const;
    }
  }

  if (employeeGender === "male") {
    if (isInLaw && constraints.maleEmployeesCoverInLaws === false) {
      return {
        allowed: false,
        message: "Male employees cannot cover parents-in-law.",
      } as const;
    }

    if (!isInLaw && constraints.maleEmployeesCoverParents === false) {
      return {
        allowed: false,
        message: "Male employees cannot cover their own parents.",
      } as const;
    }
  }

  if (employeeGender === "female") {
    if (isInLaw && constraints.femaleEmployeesCoverInLaws === false) {
      return {
        allowed: false,
        message: "Female employees cannot cover parents-in-law.",
      } as const;
    }

    if (!isInLaw && constraints.femaleEmployeesCoverParents === false) {
      return {
        allowed: false,
        message: "Female employees cannot cover their own parents.",
      } as const;
    }
  }

  if (constraints.crossParentsAllowed === false) {
    if (isInLaw && hasOwnParent) {
      const canPairWithSameRole =
        sameGenderParentsAllowed &&
        parentRole !== null &&
        existingOwnParentRoles.length > 0 &&
        existingOwnParentRoles.every((role) => role === parentRole);

      if (!canPairWithSameRole) {
        return {
          allowed: false,
          message:
            "Cross selection of parents is not allowed. Remove existing parents to add parents-in-law.",
        } as const;
      }
    }

    if (!isInLaw && hasInLawParent) {
      const canPairWithSameRole =
        sameGenderParentsAllowed &&
        parentRole !== null &&
        existingInLawParentRoles.length > 0 &&
        existingInLawParentRoles.every((role) => role === parentRole);

      if (!canPairWithSameRole) {
        return {
          allowed: false,
          message:
            "Cross selection of parents is not allowed. Remove existing parents-in-law to add parents.",
        } as const;
      }
    }
  }

  return { allowed: true } as const;
};

interface AvailableOptionsConfig {
  policyData: RelationshipData;
  dependents: DependentDetails[];
  canSelectRelationship: (relationshipName: string) =>
    | { allowed: boolean }
    | {
        allowed: boolean;
        message?: string;
      };
}

export const getEligibleRelationsFromTemplate = (
  policyData: any,
  parentpolicyComponentActionTypeId?: number | string,
  policyComponentActionTypeId?: number | string
): string[] => {
  if (!policyData?.policyTemplate) return [];

  const rawParentId = Number(parentpolicyComponentActionTypeId);
  // null → 0, undefined → NaN. Treat NaN as 0 (means "no parent" = main/base policy level).
  const parentId = Number.isFinite(rawParentId) ? rawParentId : 0;
  const optionId = policyComponentActionTypeId
    ? Number(policyComponentActionTypeId)
    : undefined;

  const templatePolicies = Object.values(policyData.policyTemplate) as any[];

  // Find selected main policy
  const matchedPolicy = templatePolicies.find(
    (policy) => {
      // Logic:
      // - If parentId === 0: Main policy (base/parental), match mainPolicyId with optionId
      // - If parentId !== 0: Addon policy, match mainPolicyId with parentId
      const isMainPolicy = parentId === 0;
      const matchByPolicyId = isMainPolicy 
        ? Number(policy.mainPolicyId) === Number(optionId)   // Main: match with current policy ID
        : Number(policy.mainPolicyId) === Number(parentId);  // Addon: match with parent policy ID
      
      return matchByPolicyId;
    }
  );


  if (!matchedPolicy) {
    return [];
  }

  // If addon selected → addon eligibility overrides
  if (optionId && matchedPolicy.addonIds?.length) {
    const matchedAddon = matchedPolicy.addonIds.find(
      (addon: any) => Number(addon.optionId) === optionId
    );

    if (matchedAddon?.eligibleRelations?.length) {
      return matchedAddon.eligibleRelations;
    }
  }

  return matchedPolicy.eligibleRelations || [];
};

export const getAvailableRelationshipOptions = ({
  policyData,
  dependents,
  canSelectRelationship,
  parentpolicyComponentActionTypeId,
  policyComponentActionTypeId,
}: AvailableOptionsConfig & {
  parentpolicyComponentActionTypeId?: number;
  policyComponentActionTypeId?: number;
}) => {

  // Commented to get only eligibleRelations from policy template
  // Fetch eligibility from policyTemplate
  const eligibleRelations = getEligibleRelationsFromTemplate(
    policyData,
    parentpolicyComponentActionTypeId,
    policyComponentActionTypeId
  );
  // If no eligible relations found, return empty array
  if (!eligibleRelations.length) {
    return [];
  }

  // Convert eligible relations to options format, excluding "Self" from dropdown
  const allOptions = eligibleRelations
    .filter(relation => relation.toLowerCase() !== "self")
    .map(relation => ({
      value: relation,
      label: normalizeRelationship(relation)
    }));


  // Count already used relationship types for THIS specific policy component only
  const usedTypeCounts: Record<string, number> = {};
  const usedParentRelationshipNames: Set<string> = new Set();

  // Define parent relationships that can only be selected once
  const singleSelectParentRelationships = ['father', 'mother', 'father-in-law', 'mother-in-law'];

  dependents.forEach((dependent: any, index) => {

    // Handle choices array if present (new structure)
    let belongsToThisPolicyComponent = false;

    if (Array.isArray(dependent.choices) && dependent.choices.length > 0) {
      // Check if any choice matches the current policy component
      belongsToThisPolicyComponent = dependent.choices.some((choice: any) => {
        const choiceParentId = choice.parentpolicyComponentActionTypeId ?? 0;
        const currentParentId = parentpolicyComponentActionTypeId ?? 0;
        
        const matches = 
          Number(choice.policyComponentActionTypeId) === Number(policyComponentActionTypeId) &&
          Number(choiceParentId) === Number(currentParentId);
        
        return matches;
      });
    } else {
      // Fallback to old structure (direct properties)
      const depParentId = dependent.parentpolicyComponentActionTypeId ?? 0;
      const currentParentId = parentpolicyComponentActionTypeId ?? 0;
      
      belongsToThisPolicyComponent = 
        Number(dependent.policyComponentActionTypeId) === Number(policyComponentActionTypeId) &&
        Number(depParentId) === Number(currentParentId);
    }

    if (!belongsToThisPolicyComponent) return;

    const dependentRelationshipName =
      dependent.relationship || dependent.relationshipType;

    if (!dependentRelationshipName) return;

    // Track specific parent relationship names that have been used (case-insensitive)
    const normalizedRelationship = dependentRelationshipName.toLowerCase().trim();
    
    if (singleSelectParentRelationships.includes(normalizedRelationship)) {
      usedParentRelationshipNames.add(normalizedRelationship);
    }

    const relationType =
      getRelationTypeForRelationship(policyData, dependentRelationshipName) ||
      getRelationTypeForRelationship(policyData, dependent.relationship || "");

    if (!relationType) return;

    usedTypeCounts[relationType] = (usedTypeCounts[relationType] || 0) + 1;
  });

  // Apply maxCount and canSelectRelationship filtering logic to the eligible relations
  const availableOptions = allOptions.filter((option) => {
    // Check if this is a parent relationship that can only be selected once
    const normalizedOptionValue = option.value.toLowerCase().trim();
    if (singleSelectParentRelationships.includes(normalizedOptionValue)) {
      // Prevent selecting the same parent relationship again
      if (usedParentRelationshipNames.has(normalizedOptionValue)) {
        return false;
      }
    }
    
    // Check if this relationship type has reached maxCount limit
    const relationType = getRelationTypeForRelationship(policyData, option.value);
    if (!relationType) return false;

    const usedCountForThisType = usedTypeCounts[relationType] || 0;

    const relation = policyData.enabledPolicyRelations?.find(
      (rel: any) => rel?.type === relationType
    );

    if (!relation?.type) return false;

    const parsedMax = relation.maxCount ? parseInt(relation.maxCount, 10) : NaN;
    const maxCount = Number.isNaN(parsedMax)
      ? Number.POSITIVE_INFINITY
      : parsedMax;


    const relationTypeLower = relation.type.toLowerCase();

    // Special handling for parents - apply both maxCount and canSelectRelationship logic
    if (relationTypeLower === "parents") {
      if (usedCountForThisType >= maxCount) return false;

      const selectionCheck = canSelectRelationship(option.value);
      return selectionCheck.allowed;
    }

    // For non-parent relationships, only apply maxCount logic
    return usedCountForThisType < maxCount;
  });


  return availableOptions;

};
