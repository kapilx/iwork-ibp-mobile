import { DynamicObject } from "@ui/ui-lib/constants/types";
import { SPOUSE_PARTNERS, SPOUSE_PARTNERS_PAYLOAD } from "../../constants";
import { generatePolicyStructure } from "../../components/PolicyConfiguration/utils";

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

const matchesChoiceIdentity = (left: any, right: any): boolean => {
  const leftSumInsured = toOptionalNumber(left?.sumInsured);
  const rightSumInsured = toOptionalNumber(right?.sumInsured);
  const leftPremium = toOptionalNumber(left?.premium);
  const rightPremium = toOptionalNumber(right?.premium);

  return (
    leftSumInsured !== undefined &&
    rightSumInsured !== undefined &&
    leftPremium !== undefined &&
    rightPremium !== undefined &&
    leftSumInsured === rightSumInsured &&
    leftPremium === rightPremium
  );
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

const getActiveComponentIds = (configuration: any): Set<number> => {
  const activeComponentIds = new Set<number>();
  const dependents = Array.isArray(configuration?.dependents)
    ? configuration.dependents
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

  const policyTemplate = configuration?.policyTemplate || {};
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
  familyMemberDetails: DynamicObject,
): any[] => {
  const transformedArray: any[] = [];
  
  Object.entries(familyMemberDetails).forEach(([relationKey, members]) => {
    if (!Array.isArray(members)) {
      return;
    }

    members.forEach((member: any, index: number) => {
      const transformedMember: any = {
        name: member.name,
        relation: member.relationship || member.relation || relationKey,
        relationshipType:
          relationKey === SPOUSE_PARTNERS
            ? SPOUSE_PARTNERS_PAYLOAD
            : relationKey,
        dateOfBirth: toIsoDate(member.dateOfBirth),
        gender: member.gender || "",
        parentpolicyComponentActionTypeId: member.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionTypeId: member.policyComponentActionTypeId ?? null,
        policyComponentActionLabel: member.policyComponentActionLabel ?? null,
        policyComponentActionType: member.policyComponentActionType ?? null,
        // 🔥 CRITICAL: Preserve the choices array for unified dependent structure
        choices: Array.isArray(member.choices) ? member.choices : [],
        // Preserve tempKey for consistent identification
        tempKey: member.tempKey,
        // Preserve isManuallyAdded so the submit payload can include new deps
        // that have no backend id yet (e.g. added via form but not yet saved).
        isManuallyAdded: member.isManuallyAdded ?? false,
      };

      // Always preserve id when it exists (for existing/API-loaded dependents).
      // A tempKey alongside an id just means the dependent came from the API and
      // was indexed locally — it is still a server-persisted record.
      if (member.id) {
        transformedMember.id = Number(member.id);
      }

      transformedArray.push(transformedMember);
    });
  });

  return transformedArray;
};

export const reconstructPolicyConfigurationFromSavedChoices = (
  overAllData: any[]
) => {
  if (!Array.isArray(overAllData) || overAllData.length === 0) {
    return [];
  }

  const reconstructedAll: any[] = [];

  overAllData.forEach((policyItem) => {
    const { policyId, policyName, configuration } = policyItem;
    const { employeeChosenChoices, policyComponentsConfiguration } =
      configuration || {};
    const savedChoices = Array.isArray(employeeChosenChoices)
      ? employeeChosenChoices
      : [];

    // Generate structure (same as single)
    const structuredPolicies = generatePolicyStructure([policyItem]);
    const componentById = new Map(
      Array.isArray(policyComponentsConfiguration?.components)
        ? policyComponentsConfiguration.components.map((component: any) => [
            String(component.id),
            component,
          ])
        : []
    );
    const activeComponentIds = getActiveComponentIds(configuration);
    // Get latest choices by unique key
    const latestChoicesByLabel = savedChoices.reduce(
      (acc: any, choice: any) => {
        const key =
          choice.policyComponentActionType === "optional"
            ? `${choice.policyComponentActionType}_${choice.policyComponentActionTypeId}_${choice.parentpolicyComponentActionTypeId ?? ""}`
            : `${choice.policyComponentActionType}_${choice.policyComponentActionLabel}`;
        const existing = acc[key];

        if (!existing) {
          acc[key] = choice;
          return acc;
        }

        const existingUpdatedAt = Number(
          existing.updatedAt ?? existing.id ?? 0
        );
        const currentUpdatedAt = Number(choice.updatedAt ?? choice.id ?? 0);

        // Keep the newest choice so edited selections are reconstructed correctly.
        acc[key] = currentUpdatedAt >= existingUpdatedAt ? choice : existing;
        return acc;
      },
      {}
    );

    // Resolve showCompanyContribution for the entire policy upfront:
    // constraint-level flag (showEmployeeContribution) AND any-component-level flag.
    const constraintShowCompany =
      configuration?.constraints?.showEmployeeContribution !== false;

    const reconstructedChoices = structuredPolicies.map((policy) => {
      const sourceComponent = componentById.get(String(policy?.id ?? ""));
      // Component-level flag: AND with constraint-level.
      const showCompanyContribution =
        constraintShowCompany &&
        sourceComponent?.showCompanyContribution !== false;
      const isMultipleModel =
        String(sourceComponent?.sumInsuredModel ?? "").toUpperCase() ===
        "MULTIPLE";
      const componentId = toFiniteNumber(policy?.id);
      const key =
        policy.type === "optional"
          ? `${policy.type}_${policy.id ?? policy.policyComponentActionTypeId}_${policy.parentpolicyComponentActionTypeId ?? ""}`
          : `${policy.type}_${policy.label}`;
      const savedChoice = latestChoicesByLabel[key];

      if (
        componentId !== null &&
        !activeComponentIds.has(componentId)
      ) {
        return null;
      }

      if (!savedChoice) {
        // No saved choices at all means the user has never enrolled this policy.
        // Return null so the button stays "Select" and the calculator stays empty.
        if (savedChoices.length === 0) {
          return null;
        }

        // Optional components the user deliberately skipped must remain unselected.
        if (policy?.type === "optional") {
          return null;
        }

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
            0,
        );
        const employeeContribution = Number(
          defaultChoice.employeeContribution ??
            defaultChoice.employeePay ??
            0,
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
          // Prefer the choice's own premiumPerLife when explicitly set (e.g. the
          // backend resolves it to false once a per-life sum has already been
          // computed for a dependent-aware parameter) — only fall back to the
          // static component default when the choice doesn't specify it at all.
          premiumPerLife:
            defaultChoice?.premiumPerLife !== undefined &&
            defaultChoice?.premiumPerLife !== null
              ? Boolean(defaultChoice.premiumPerLife)
              : Boolean(sourceComponent?.premiumPerLife),
          showCompanyContribution,
          id: undefined,
          policyId,
          policyName,
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

      // Try matching by sumInsured + premium for MULTIPLE model,
      // then use the existing sumInsuredId/raw fallback for everything else.
      const matchingOption = policy.choices.find((choice) => {
        if (isMultipleModel && matchesChoiceIdentity(choice, savedChoice)) {
          return true;
        }

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

      const companyContribution =
        matchingOption?.companyContribution ?? Number(savedChoice.companyPay);
      const employeeContribution =
        matchingOption?.employeeContribution ?? Number(savedChoice.employeePay);
      const rawSumInsured = savedRawSumInsured ?? matchingOption?.rawSumInsured;

      return {
        ...matchingOption,
        sumInsuredId: matchingOption?.sumInsuredId ?? savedChoice.sumInsuredId,
        sumInsured: matchingOption?.sumInsured ?? savedChoice.sumInsured,
        rawSumInsured,
        premium:
          matchingOption?.premium ??
          Number(
            savedChoice.premium ?? companyContribution + employeeContribution
          ),
        companyPay: companyContribution,
        employeePay: employeeContribution,
        companyContribution,
        employeeContribution,
        parentpolicyComponentActionTypeId:
          savedChoice.parentpolicyComponentActionTypeId || null,
        policyComponentActionType: savedChoice.policyComponentActionType,
        policyComponentActionTypeId: savedChoice.policyComponentActionTypeId,
        policyComponentActionLabel: savedChoice.policyComponentActionLabel,
        // Prefer the saved choice's own premiumPerLife when explicitly set —
        // same reasoning as the fresh-default-choice path above.
        premiumPerLife:
          savedChoice.premiumPerLife !== undefined &&
          savedChoice.premiumPerLife !== null
            ? Boolean(savedChoice.premiumPerLife)
            : Boolean(matchingOption?.premiumPerLife),
        showCompanyContribution,
        id: savedChoice?.id,
        //  Include metadata for multi-policy
        policyId,
        policyName,
      };
    });

    reconstructedAll.push(...reconstructedChoices);
  });

  return reconstructedAll;
};
