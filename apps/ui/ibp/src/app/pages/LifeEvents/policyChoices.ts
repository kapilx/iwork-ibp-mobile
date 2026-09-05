import { generatePolicyStructureForSingleEnrollment } from "../../components/PolicyConfiguration/utils";
import { getRelationTypeForRelationship } from "../../components/Enrollment/EnrollmentFlow/utils/relationshipFilters";

export interface LifeEventPolicyChoice {
  id: string;
  selectionGroupKey: string;
  policyComponentActionTypeId: number;
  parentpolicyComponentActionTypeId: number | null;
  policyComponentActionType: string;
  policyComponentActionLabel: string;
  policyName: string;
  sumInsured: string | number;
  premium: number;
  companyContribution: number;
  companyPay: number;
  employeeContribution: number;
  employeePay: number;
  sumInsuredId: number | null;
  isDefault: boolean;
  section: "compulsory" | "optional";
  isBenefitComponent?: boolean;
  isOptional?: boolean;
  premiumPerLife?: boolean;
  showCompanyContribution?: boolean;
  policyId?: string | number;
  policyTypeKey?: string | null;
  isRelationshipGroup?: boolean;
  bucketChanged?: boolean;
}

export interface LifeEventPolicySource {
  policyId?: string | number | null;
  policyName?: string | null;
  policyTypeKey?: string | null;
  isEditable?: boolean | null;
  configuration?: {
    policyComponentsConfiguration?: any;
    employeeChosenChoices?: any[];
    policyTemplate?: any;
    relationships?: any;
    dependents?: any[];
    isRelationshipGroup?: boolean;
    bucketChangedSelectionGroupKeys?: string[];
    constraints?: any;
  } | null;
}

export const getLifeEventDependentKey = (dependent: any): string =>
  String(
    dependent?.tempKey ??
      dependent?.id ??
      dependent?.dependentId ??
      dependent?.memberId ??
      [
        dependent?.name || "",
        dependent?.relationship || dependent?.relation || "",
        dependent?.gender || "",
        dependent?.dateOfBirth || dependent?.dob || "",
      ].join("|")
  )
    .trim()
    .toLowerCase();

const normalizeRelation = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getRelationAliases = (value: unknown): string[] => {
  const normalized = normalizeRelation(value);
  if (!normalized) return [];

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

const getPolicyEnabledRelations = (policy: LifeEventPolicySource) =>
  policy?.configuration?.relationships?.enabledPolicyRelations || [];

const resolvePolicyRelationForRelationshipName = (
  policy: LifeEventPolicySource,
  relationshipName: string
) => {
  if (!relationshipName) return null;

  const enabledPolicyRelations = getPolicyEnabledRelations(policy);
  const relationType = getRelationTypeForRelationship(
    policy as any,
    relationshipName
  );
  if (relationType) {
    const resolvedRelation = enabledPolicyRelations.find(
      (relation: any) =>
        typeof relation?.type === "string" &&
        relation.type.toLowerCase().trim() === relationType.toLowerCase().trim()
    );
    if (resolvedRelation) {
      return resolvedRelation;
    }
  }

  const requestedAliases = getRelationAliases(relationshipName);
  return (
    enabledPolicyRelations.find((relation: any) => {
      if (!relation?.enabled) return false;

      const relationAliases = getRelationAliases(relation?.type || "");
      if (relationAliases.some((alias) => requestedAliases.includes(alias))) {
        return true;
      }

      const configuredOptions = Array.isArray(relation?.configuredOptions)
        ? relation.configuredOptions
        : [];

      return configuredOptions.some((option: any) =>
        getRelationAliases(option?.name || "").some((alias) =>
          requestedAliases.includes(alias)
        )
      );
    }) || null
  );
};

const getPolicyUsedCountForRelation = (
  policy: LifeEventPolicySource,
  relationshipName: string
) => {
  const relation = resolvePolicyRelationForRelationshipName(
    policy,
    relationshipName
  );
  if (!relation?.type) return 0;

  const relationAliases = getRelationAliases(relation.type);
  if (!relationAliases.length) return 0;

  const existingDependents = policy?.configuration?.dependents || [];
  if (!Array.isArray(existingDependents)) {
    return 0;
  }

  return existingDependents.reduce((count: number, dependent: any) => {
    const dependentRelationName =
      dependent?.relationshipType ||
      dependent?.relationship ||
      dependent?.relation ||
      "";
    if (!dependentRelationName) return count;

    const dependentRelation = resolvePolicyRelationForRelationshipName(
      policy,
      dependentRelationName
    );
    const dependentAliases = getRelationAliases(
      dependentRelation?.type || dependentRelationName
    );

    const matches = dependentAliases.some((alias) =>
      relationAliases.includes(alias)
    );
    return matches ? count + 1 : count;
  }, 0);
};

export const policyHasCapacityForRelations = (
  policy: LifeEventPolicySource,
  relationNames: string | string[] | null | undefined
) => {
  const normalizedRelations = (
    Array.isArray(relationNames) ? relationNames : [relationNames]
  )
    .map((relation) => normalizeRelation(relation))
    .filter(Boolean);

  if (normalizedRelations.length === 0) {
    return true;
  }

  return normalizedRelations.some((relationshipName) => {
    const relation = resolvePolicyRelationForRelationshipName(
      policy,
      relationshipName
    );
    if (!relation?.type) {
      return false;
    }

    const parsedMax = relation.maxCount ? parseInt(relation.maxCount, 10) : NaN;
    const maxCount = Number.isNaN(parsedMax)
      ? Number.POSITIVE_INFINITY
      : parsedMax;
    const usedCount = getPolicyUsedCountForRelation(policy, relationshipName);

    return usedCount < maxCount;
  });
};

export const filterLifeEventPolicySourcesByRelations = (
  policies: LifeEventPolicySource[] = [],
  relationNames: string | string[] | null | undefined
) =>
  policies.filter((policy) =>
    policyHasCapacityForRelations(policy, relationNames)
  );

export const relationMatchesEligibleRelation = (
  relationName: unknown,
  eligibleRelation: unknown
) => {
  const relationAliases = getRelationAliases(relationName);
  const eligibleAliases = getRelationAliases(eligibleRelation);

  return relationAliases.some((alias) => eligibleAliases.includes(alias));
};

const getChoiceId = (choice: any, index: number) =>
  [
    String(choice.policyComponentActionTypeId ?? "0"),
    String(choice.parentpolicyComponentActionTypeId ?? "root"),
    String(choice.sumInsuredId ?? index),
  ].join("|");

const getSelectionGroupKey = (choice: any) =>
  [
    String(choice.parentpolicyComponentActionTypeId ?? "root"),
    String(choice.policyComponentActionTypeId ?? "0"),
  ].join("|");

export const buildLifeEventAvailableChoices = (
  policyComponentsConfiguration: any,
  employeeChosenChoices: any[] = [],
  policyTemplate: any = null,
  relationName?: string | string[] | null,
  showEmployeeContribution?: boolean,
  isRelationshipGroup: boolean = false
): LifeEventPolicyChoice[] => {
  const componentPremiumPerLifeMap = new Map<number, boolean>();
  const componentShowCompanyMap = new Map<number, boolean>();
  const componentIsOptionalMap = new Map<number, boolean>();
  (policyComponentsConfiguration?.components || []).forEach(
    (component: any) => {
      const componentId = Number(component?.id);
      if (Number.isNaN(componentId) || componentId <= 0) return;
      componentPremiumPerLifeMap.set(
        componentId,
        Boolean(component?.premiumPerLife)
      );
      componentShowCompanyMap.set(
        componentId,
        component?.showCompanyContribution === true
      );
      componentIsOptionalMap.set(componentId, component?.isOptional === true);
    }
  );

  const allAvailableChoices =
    generatePolicyStructureForSingleEnrollment(policyComponentsConfiguration) ||
    [];

  const flattenedChoices: LifeEventPolicyChoice[] = allAvailableChoices.flatMap(
    (policy: any) =>
      (policy?.choices || [])
        .filter((choice: any) => choice?.isAvailable !== false)
        .map((choice: any, index: number) => ({
          id: getChoiceId(choice, index),
          selectionGroupKey: getSelectionGroupKey(choice),
          policyComponentActionTypeId: Number(
            choice.policyComponentActionTypeId ?? 0
          ),
          parentpolicyComponentActionTypeId:
            choice.parentpolicyComponentActionTypeId !== undefined &&
            choice.parentpolicyComponentActionTypeId !== null
              ? Number(choice.parentpolicyComponentActionTypeId)
              : null,
          policyComponentActionType:
            choice.policyComponentActionType ?? policy?.type ?? "",
          policyComponentActionLabel:
            choice.policyComponentActionLabel ?? policy?.label ?? "",
          policyName: policy?.label ?? choice.policyComponentActionLabel ?? "",
          sumInsured: choice.sumInsured ?? "--",
          premium: Number(choice.premium ?? 0),
          companyContribution: Number(
            choice.companyContribution ?? choice.companyPay ?? 0
          ),
          companyPay: Number(
            choice.companyPay ?? choice.companyContribution ?? 0
          ),
          employeeContribution: Number(
            choice.employeeContribution ?? choice.employeePay ?? 0
          ),
          employeePay: Number(
            choice.employeePay ?? choice.employeeContribution ?? 0
          ),
          sumInsuredId:
            choice.sumInsuredId !== undefined && choice.sumInsuredId !== null
              ? Number(choice.sumInsuredId)
              : null,
          isDefault: Boolean(choice.isDefault),
          premiumPerLife:
            choice?.premiumPerLife !== undefined
              ? Boolean(choice.premiumPerLife)
              : policy?.premiumPerLife !== undefined
              ? Boolean(policy.premiumPerLife)
              : Boolean(
                  componentPremiumPerLifeMap.get(
                    Number(choice.policyComponentActionTypeId ?? 0)
                  )
                ),
          section:
            choice.policyComponentActionType === "optional" ||
            componentIsOptionalMap.get(
              Number(choice.policyComponentActionTypeId ?? 0)
            ) === true
              ? "optional"
              : "compulsory",
          isBenefitComponent: choice.isBenefitComponent === true,
          isOptional:
            componentIsOptionalMap.get(
              Number(choice.policyComponentActionTypeId ?? 0)
            ) === true,
          isRelationshipGroup,
          showCompanyContribution:
            showEmployeeContribution === true &&
            (typeof choice?.showCompanyContribution === "boolean"
              ? choice.showCompanyContribution === true
              : componentShowCompanyMap.get(
                  Number(choice.policyComponentActionTypeId ?? 0)
                ) === true),
        }))
  );

  const normalizedRelations = (
    Array.isArray(relationName) ? relationName : [relationName]
  )
    .map((relation) => normalizeRelation(relation))
    .filter(Boolean);

  const eligibleComponentIds = new Set<number>();
  const addIfEligible = (
    componentId: unknown,
    eligibleRelations: unknown[] | undefined
  ) => {
    const matches =
      normalizedRelations.length === 0 ||
      (eligibleRelations || []).some((relation) =>
        normalizedRelations.some((normalizedRelation) =>
          relationMatchesEligibleRelation(normalizedRelation, relation)
        )
      );

    if (!matches) {
      return;
    }

    const parsedId = Number(componentId);
    if (!Number.isNaN(parsedId) && parsedId > 0) {
      eligibleComponentIds.add(parsedId);
    }
  };

  addIfEligible(
    policyTemplate?.basePolicy?.mainPolicyId,
    policyTemplate?.basePolicy?.eligibleRelations
  );
  (policyTemplate?.basePolicy?.addonIds || []).forEach((addon: any) => {
    addIfEligible(addon?.optionId, addon?.eligibleRelations);
  });

  addIfEligible(
    policyTemplate?.parentalPolicy?.mainPolicyId,
    policyTemplate?.parentalPolicy?.eligibleRelations
  );
  (policyTemplate?.parentalPolicy?.addonIds || []).forEach((addon: any) => {
    addIfEligible(addon?.optionId, addon?.eligibleRelations);
  });

  const eligibleChoices = flattenedChoices.filter((choice) =>
    normalizedRelations.length === 0
      ? true
      : eligibleComponentIds.size === 0
      ? false
      : eligibleComponentIds.has(choice.policyComponentActionTypeId)
  );

  if (isRelationshipGroup) {
    const defaultChoiceKeys = new Set<string>();

    (employeeChosenChoices || []).forEach((employeeChoice: any) => {
      const actionTypeId = Number(
        employeeChoice?.policyComponentActionTypeId ?? 0
      );
      if (Number.isNaN(actionTypeId) || actionTypeId <= 0) {
        return;
      }

      if (
        eligibleComponentIds.size > 0 &&
        !eligibleComponentIds.has(actionTypeId)
      ) {
        return;
      }

      const matchingEligibleChoice = eligibleChoices.find((choice) => {
        const isSameComponent =
          Number(choice.policyComponentActionTypeId) === actionTypeId;
        const isSameParent =
          Number(choice.parentpolicyComponentActionTypeId ?? 0) ===
          Number(employeeChoice?.parentpolicyComponentActionTypeId ?? 0);
        const isSameSumInsured =
          String(choice.sumInsured ?? "") ===
          String(employeeChoice?.sumInsured ?? "");

        return isSameComponent && isSameParent && isSameSumInsured;
      });

      if (!matchingEligibleChoice) {
        return;
      }

      defaultChoiceKeys.add(
        [
          String(matchingEligibleChoice.policyComponentActionTypeId ?? "0"),
          String(
            matchingEligibleChoice.parentpolicyComponentActionTypeId ?? "root"
          ),
          String(matchingEligibleChoice.sumInsuredId ?? "none"),
          String(matchingEligibleChoice.sumInsured ?? "none"),
        ].join("|")
      );
    });

    return eligibleChoices.map((choice) => {
      const choiceKey = [
        String(choice.policyComponentActionTypeId ?? "0"),
        String(choice.parentpolicyComponentActionTypeId ?? "root"),
        String(choice.sumInsuredId ?? "none"),
        String(choice.sumInsured ?? "none"),
      ].join("|");

      return {
        ...choice,
        isDefault: defaultChoiceKeys.has(choiceKey),
      };
    });
  }

  const chosenChoiceMap = new Map<number, LifeEventPolicyChoice>();

  (employeeChosenChoices || []).forEach((employeeChoice: any) => {
    const actionTypeId = Number(
      employeeChoice?.policyComponentActionTypeId ?? 0
    );
    if (Number.isNaN(actionTypeId) || actionTypeId <= 0) {
      return;
    }

    if (
      eligibleComponentIds.size > 0 &&
      !eligibleComponentIds.has(actionTypeId)
    ) {
      return;
    }

    const matchingEligibleChoice = eligibleChoices.find((choice) => {
      const isSameComponent =
        Number(choice.policyComponentActionTypeId) === actionTypeId;
      const isSameParent =
        Number(choice.parentpolicyComponentActionTypeId ?? 0) ===
        Number(employeeChoice?.parentpolicyComponentActionTypeId ?? 0);
      const isSameSumInsured =
        String(choice.sumInsured ?? "") ===
        String(employeeChoice?.sumInsured ?? "");

      return isSameComponent && isSameParent && isSameSumInsured;
    });

    const fallbackChoice = eligibleChoices.find(
      (choice) =>
        Number(choice.policyComponentActionTypeId) === actionTypeId &&
        Number(choice.parentpolicyComponentActionTypeId ?? 0) ===
          Number(employeeChoice?.parentpolicyComponentActionTypeId ?? 0)
    );

    const sourceChoice = matchingEligibleChoice ?? fallbackChoice;

    if (!sourceChoice) {
      return;
    }

    chosenChoiceMap.set(actionTypeId, {
      ...sourceChoice,
      id: String(employeeChoice?.id ?? sourceChoice.id),
      sumInsured: employeeChoice?.sumInsured ?? sourceChoice.sumInsured,
      premium: Number(employeeChoice?.premium ?? sourceChoice.premium ?? 0),
      companyContribution: Number(
        employeeChoice?.companyPay ??
          employeeChoice?.companyContribution ??
          sourceChoice.companyContribution ??
          0
      ),
      companyPay: Number(
        employeeChoice?.companyPay ??
          employeeChoice?.companyContribution ??
          sourceChoice.companyPay ??
          0
      ),
      employeeContribution: Number(
        employeeChoice?.employeePay ??
          employeeChoice?.employeeContribution ??
          sourceChoice.employeeContribution ??
          0
      ),
      employeePay: Number(
        employeeChoice?.employeePay ??
          employeeChoice?.employeeContribution ??
          sourceChoice.employeePay ??
          0
      ),
      sumInsuredId:
        sourceChoice.sumInsuredId ??
        (employeeChoice?.sumInsuredId !== undefined &&
        employeeChoice?.sumInsuredId !== null
          ? Number(employeeChoice.sumInsuredId)
          : null),
      isDefault: true,
      premiumPerLife:
        employeeChoice?.premiumPerLife !== undefined
          ? Boolean(employeeChoice.premiumPerLife)
          : sourceChoice.premiumPerLife,
    });
  });

  const otherEligibleChoices = eligibleChoices.filter(
    (choice) => !chosenChoiceMap.has(choice.policyComponentActionTypeId)
  );

  return [...Array.from(chosenChoiceMap.values()), ...otherEligibleChoices];
};

export const getDefaultSelectedChoiceIds = (
  availableChoices: LifeEventPolicyChoice[]
): string[] => {
  const groupedChoices = availableChoices.reduce<
    Record<string, LifeEventPolicyChoice[]>
  >((accumulator, choice) => {
    if (!accumulator[choice.selectionGroupKey]) {
      accumulator[choice.selectionGroupKey] = [];
    }

    accumulator[choice.selectionGroupKey].push(choice);
    return accumulator;
  }, {});

  return Object.values(groupedChoices)
    .filter((choices) =>
      choices.some((choice) => choice.section === "compulsory")
    )
    .map((choices) => {
      const defaultChoice = choices.find((choice) => choice.isDefault);
      return (defaultChoice ?? choices[0])?.id;
    })
    .filter((choiceId): choiceId is string => Boolean(choiceId));
};

export const buildLifeEventAvailableChoicesForPolicies = (
  policies: LifeEventPolicySource[] = [],
  relationName?: string | string[] | null,
  _showEmployeeContribution?: boolean
): LifeEventPolicyChoice[] => {
  return policies.flatMap((policy, index) => {
    const policyConstraints = policy?.configuration?.constraints;
    const policyShowEmployeeContribution =
      typeof policyConstraints?.showEmployeeContribution === 'boolean'
        ? policyConstraints.showEmployeeContribution
        : _showEmployeeContribution;

    const policyChoices = buildLifeEventAvailableChoices(
      policy?.configuration?.policyComponentsConfiguration,
      policy?.configuration?.employeeChosenChoices || [],
      policy?.configuration?.policyTemplate || null,
      relationName,
      policyShowEmployeeContribution,
      policy?.configuration?.isRelationshipGroup === true
    );

    const policyKey = String(
      policy?.policyId ??
        policy?.policyTypeKey ??
        policy?.policyName ??
        `policy-${index}`
    );

    return policyChoices.map((choice) => ({
      ...choice,
      id: `${policyKey}::${choice.id}`,
      selectionGroupKey: `${policyKey}::${choice.selectionGroupKey}`,
      policyId: policy?.policyId ?? policyKey,
      policyName: policy?.policyName ?? choice.policyName,
      policyTypeKey: policy?.policyTypeKey ?? null,
      bucketChanged: (
        policy?.configuration?.bucketChangedSelectionGroupKeys || []
      ).includes(choice.selectionGroupKey),
    }));
  });
};
