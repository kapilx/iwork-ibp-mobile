import { DynamicObject } from "@ui/ui-lib/constants/types";
import { generatePolicyStructureForSingleEnrollment } from "../../components/PolicyConfiguration/utils";
import { SPOUSE_PARTNERS, SPOUSE_PARTNERS_PAYLOAD } from "../../constants";

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeRelationName = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const hasSelfRelation = (relations: unknown): boolean =>
  Array.isArray(relations) &&
  relations.some((relation) => normalizeRelationName(relation) === "self");

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getActiveComponentIds = (overAllData: any): Set<number> => {
  const activeComponentIds = new Set<number>();
  const dependents = Array.isArray(overAllData?.dependents)
    ? overAllData.dependents
    : [];

  dependents.forEach((dependent: any) => {
    const primaryId = toFiniteNumber(dependent?.policyComponentActionTypeId);
    if (primaryId !== null) {
      activeComponentIds.add(primaryId);
    }
    if (Array.isArray(dependent?.choices)) {
      dependent.choices.forEach((choice: any) => {
        const choiceId = toFiniteNumber(choice?.policyComponentActionTypeId);
        if (choiceId !== null) {
          activeComponentIds.add(choiceId);
        }
      });
    }
  });

  const policyTemplate = overAllData?.policyTemplate || {};
  const includeIfSelfCovered = (componentId: unknown, eligibleRelations: unknown) => {
    const parsedId = toFiniteNumber(componentId);
    if (parsedId === null) {
      return;
    }
    if (hasSelfRelation(eligibleRelations)) {
      activeComponentIds.add(parsedId);
    }
  };

  includeIfSelfCovered(
    policyTemplate?.basePolicy?.mainPolicyId,
    policyTemplate?.basePolicy?.eligibleRelations,
  );
  (policyTemplate?.basePolicy?.addonIds || []).forEach((addon: any) => {
    includeIfSelfCovered(addon?.optionId, addon?.eligibleRelations);
  });
  includeIfSelfCovered(
    policyTemplate?.parentalPolicy?.mainPolicyId,
    policyTemplate?.parentalPolicy?.eligibleRelations,
  );
  (policyTemplate?.parentalPolicy?.addonIds || []).forEach((addon: any) => {
    includeIfSelfCovered(addon?.optionId, addon?.eligibleRelations);
  });

  return activeComponentIds;
};

export function toIsoDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;

  // Check if already in ISO format (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateStr)) {
    return dateStr;
  }

  // Handle slash-separated format (DD/MM/YYYY)
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) {
      console.error("Invalid date format. Expected DD/MM/YYYY");
      return null;
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle hyphen-separated format that might not be ISO (DD-MM-YYYY)
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // Check if it's already ISO (year first)
      if (parts[0].length === 4) {
        return dateStr;
      }
      // Convert DD-MM-YYYY to ISO
      const [day, month, year] = parts;
      if (!day || !month || !year) {
        console.error("Invalid date format. Expected DD-MM-YYYY or YYYY-MM-DD");
        return null;
      }
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  console.error(
    "Invalid date format. Expected DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD"
  );
  return null;
}

export const transformFamilyMembersToArray = (
  familyMemberDetails: DynamicObject
): any[] => {
  const transformedArray: any[] = [];

  Object.entries(familyMemberDetails).forEach(([relationKey, members]) => {
    if (!Array.isArray(members)) {
      return;
    }

    members.forEach((member: any, index: number) => {
      const transformedMember: any = {
        name: member.name,
        relation: member.relationship,
        relationshipType:
          relationKey === SPOUSE_PARTNERS
            ? SPOUSE_PARTNERS_PAYLOAD
            : relationKey,
        dateOfBirth: toIsoDate(member.dateOfBirth),
        gender: member.gender || "",
        // IMPORTANT: Preserve policy-related fields for calculation functions
        parentpolicyComponentActionTypeId: member.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionTypeId: member.policyComponentActionTypeId ?? null,
        policyComponentActionLabel: member.policyComponentActionLabel ?? null,
        policyComponentActionType: member.policyComponentActionType ?? null,
        // CRITICAL: Preserve the choices array for unified dependent structure
        choices: Array.isArray(member.choices) ? member.choices : [],
        // Preserve tempKey for consistent identification
        tempKey: member.tempKey,
      };

      // Only include id if it exists (for existing dependents)
      // New dependents (with tempKey) should not have id in payload
      if (member.id && !member.tempKey) {
        transformedMember.id = Number(member.id);
      }

      transformedArray.push(transformedMember);
    });
  });

  return transformedArray;
};

export const reconstructPolicyConfigurationFromSavedChoices = (
  overAllData: any
) => {
  const { employeeChosenChoices, policyComponentsConfiguration } = overAllData;

  if (!employeeChosenChoices || employeeChosenChoices.length === 0) {
    return [];
  }

  const structuredPolicies = generatePolicyStructureForSingleEnrollment(
    policyComponentsConfiguration
  );
  const activeComponentIds = getActiveComponentIds(overAllData);

  const latestChoicesByLabel = employeeChosenChoices.reduce(
    (acc: any, choice: any) => {
      const key =
        choice.policyComponentActionType === "optional"
          ? `${choice.policyComponentActionType}_${choice.parentpolicyComponentActionTypeId}`
          : `${choice.policyComponentActionType}_${choice.policyComponentActionLabel}`;
      if (!acc[key]) {
        acc[key] = choice;
      }
      return acc;
    },
    {}
  );

  const componentById = new Map(
    Array.isArray(policyComponentsConfiguration?.components)
      ? policyComponentsConfiguration.components.map((component: any) => [
          String(component.id),
          component,
        ])
      : []
  );
  const constraintShowCompany =
    overAllData?.constraints?.showEmployeeContribution !== false;

  const reconstructedChoices = structuredPolicies.map((policy) => {
    const componentId = toFiniteNumber(policy?.id);
    const sourceComponent = componentById.get(String(policy?.id ?? ""));
    const showCompanyContribution =
      constraintShowCompany && sourceComponent?.showCompanyContribution !== false;
    const key =
      policy.type === "optional"
        ? `${policy.type}_${policy.parentpolicyComponentActionTypeId}`
        : `${policy.type}_${policy.label}`;
    const savedChoice = latestChoicesByLabel[key];

    if (
      componentId !== null &&
      !activeComponentIds.has(componentId)
    ) {
      return null;
    }

    if (!savedChoice) {
      const defaultChoice =
        policy?.choices?.find((choice: any) => choice?.isDefault === true) ??
        policy?.choices?.find((choice: any) => choice?.isAvailable !== false) ??
        null;

      if (!defaultChoice) {
        return null;
      }

      const companyContribution = Number(
        defaultChoice.companyContribution ??
          defaultChoice.companyPay ??
          0
      );
      const employeeContribution = Number(
        defaultChoice.employeeContribution ??
          defaultChoice.employeePay ??
          0
      );

      return {
        ...defaultChoice,
        sumInsuredId: defaultChoice?.sumInsuredId ?? null,
        sumInsured: defaultChoice?.sumInsured ?? 0,
        rawSumInsured:
          toOptionalNumber((defaultChoice as any)?.rawSumInsured) ??
          toOptionalNumber(defaultChoice?.sumInsured),
        premium:
          defaultChoice?.premium ??
          companyContribution + employeeContribution,
        rawCompanyContribution:
          toOptionalNumber((defaultChoice as any)?.rawCompanyContribution) ??
          companyContribution,
        rawEmployeeContribution:
          toOptionalNumber((defaultChoice as any)?.rawEmployeeContribution) ??
          employeeContribution,
        rawPremium:
          toOptionalNumber((defaultChoice as any)?.rawPremium) ??
          companyContribution + employeeContribution,
        companyPay: companyContribution,
        employeePay: employeeContribution,
        companyContribution,
        employeeContribution,
        parentpolicyComponentActionTypeId:
          policy?.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionType: policy?.type,
        policyComponentActionTypeId:
          policy?.policyComponentActionTypeId ?? policy?.id,
        policyComponentActionLabel: policy?.label,
        premiumPerLife:
          Boolean(defaultChoice?.premiumPerLife) ||
          Boolean((policy as any)?.premiumPerLife),
        showCompanyContribution,
        id: undefined,
      };
    }

    const savedSumInsuredId =
      savedChoice?.sumInsuredId !== undefined &&
      savedChoice?.sumInsuredId !== null
        ? Number(savedChoice.sumInsuredId)
        : undefined;

    const savedRawSumInsured =
      toOptionalNumber((savedChoice as any)?.rawSumInsured) ??
      toOptionalNumber(savedChoice.sumInsured);

    const matchingOption = policy.choices.find((choice) => {
      if (
        savedSumInsuredId !== undefined &&
        choice.sumInsuredId !== undefined &&
        choice.sumInsuredId !== null
      ) {
        return Number(choice.sumInsuredId) === savedSumInsuredId;
      }

      const choiceRawSumInsured = toOptionalNumber(
        (choice as any)?.rawSumInsured ?? choice.sumInsured
      );

      if (
        savedRawSumInsured !== undefined &&
        choiceRawSumInsured !== undefined
      ) {
        return choiceRawSumInsured === savedRawSumInsured;
      }

      return choice.sumInsured === savedChoice.sumInsured;
    });

    const savedRawCompanyContribution =
      toOptionalNumber((savedChoice as any)?.rawCompanyContribution) ??
      toOptionalNumber(
        savedChoice.companyPay ?? savedChoice.companyContribution
      );

    const savedRawEmployeeContribution =
      toOptionalNumber((savedChoice as any)?.rawEmployeeContribution) ??
      toOptionalNumber(
        savedChoice.employeePay ?? savedChoice.employeeContribution
      );

    // The saved choice is the actual persisted, potentially dependent-aware
    // (Dependent Count/Attribute enhanced) amount for this specific family —
    // it must win over `matchingOption`, which is just the generic static
    // Stage-5 catalog entry for the chosen SI tier (same for every employee
    // regardless of dependents). Previously matchingOption took priority,
    // which silently discarded the enhanced total and showed the flat
    // self-only rate on the view-only/locked summary.
    const companyContribution =
      savedRawCompanyContribution ?? matchingOption?.companyContribution ?? 0;

    const employeeContribution =
      savedRawEmployeeContribution ?? matchingOption?.employeeContribution ?? 0;

    const savedRawPremium =
      toOptionalNumber((savedChoice as any)?.rawPremium) ??
      toOptionalNumber(savedChoice.premium);

    const resolvedRawCompanyContribution =
      savedRawCompanyContribution ??
      matchingOption?.rawCompanyContribution ??
      companyContribution;

    const resolvedRawEmployeeContribution =
      savedRawEmployeeContribution ??
      matchingOption?.rawEmployeeContribution ??
      employeeContribution;

    const resolvedRawPremium =
      savedRawPremium ??
      matchingOption?.rawPremium ??
      (resolvedRawCompanyContribution ?? 0) +
        (resolvedRawEmployeeContribution ?? 0);
    const rawSumInsured = savedRawSumInsured ?? matchingOption?.rawSumInsured;

    return {
      ...matchingOption,
      sumInsuredId: matchingOption?.sumInsuredId ?? savedChoice.sumInsuredId,
      sumInsured: savedChoice.sumInsured ?? matchingOption?.sumInsured,
      rawSumInsured,
      premium:
        toOptionalNumber(savedChoice.premium) ??
        matchingOption?.premium ??
        companyContribution + employeeContribution,
      rawCompanyContribution: resolvedRawCompanyContribution,
      rawEmployeeContribution: resolvedRawEmployeeContribution,
      rawPremium: resolvedRawPremium,
      companyPay: companyContribution,
      employeePay: employeeContribution,
      companyContribution,
      employeeContribution,
      parentpolicyComponentActionTypeId:
        savedChoice.parentpolicyComponentActionTypeId || null,
      policyComponentActionType: savedChoice.policyComponentActionType,
      policyComponentActionTypeId: savedChoice.policyComponentActionTypeId, // Fallback to Number(policy.id)
      policyComponentActionLabel: savedChoice.policyComponentActionLabel,
      premiumPerLife:
        savedChoice.premiumPerLife || matchingOption?.premiumPerLife || false,
      showCompanyContribution,
      id: savedChoice?.id, // <<-- Important for update!
    };
  });

  return reconstructedChoices;
};
