import { DATE_FORMATS, DECLARATION_DATA } from "../../../constants";
import {
  formatDate,
  formatAmountWithCurrency,
  type LocalizationConfig,
} from "@ui/ui-lib";

type PolicyItem = {
  policyId: number;
  policyComponentActionType: string;
  [key: string]: any;
} | null;

const POLICY_PRIORITY: Record<string, number> = {
  POLICY_TYPE_GMC: 1,
  POLICY_TYPE_GPA: 2,
  POLICY_TYPE_GTL: 3,
};

/**
 * Utility function to normalize policies array to find matching policy configuration
 * @param summaryData - The summary data object or array
 * @returns Array of policies
 */
export function normalizeSummaryDataToPoliciesArray(summaryData: any): any[] {
  return Array.isArray(summaryData)
    ? summaryData
    : Object.values(summaryData || {}).filter(
        (item) => item && typeof item === "object" && "policyId" in item
      );
}

/**
 * Utility function to find policy configuration by policy ID
 * @param summaryData - The summary data
 * @param policyId - The policy ID to search for
 * @returns Policy configuration object or undefined
 */
export function findPolicyConfigByPolicyId(
  summaryData: any,
  policyId: number
): any {
  const policiesArray = normalizeSummaryDataToPoliciesArray(summaryData);
  return policiesArray.find((p: any) => p.policyId === policyId);
}

/**
 * Utility function to check if enrollment confirmation is required for a policy
 * @param summaryData - The summary data
 * @param policyId - The policy ID to check
 * @returns Boolean indicating if enrollment confirmation is required
 */
export function shouldShowDeclarations(
  summaryData: any,
  policyId: number
): boolean {
  const policyConfig = findPolicyConfigByPolicyId(summaryData, policyId);
  const constraints = policyConfig?.configuration?.constraints;
  return Boolean(
    constraints?.enrollmentConfirmationRequired ||
    constraints?.customDisclaimerBeforeSubmission?.trim()
  );
}

/**
 * Utility function to format date from YYYY-MM-DD to DD MMM YY format
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns Formatted date string or empty string if invalid
 */
export function formatPolicyDate(dateString: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);

    return `${day} ${month} '${year}`;
  } catch (_error) {
    return "";
  }
}

/**
 * Utility function to get policy period text from available policy data
 * Gets the earliest start date and latest end date from all policies
 * @param plans - The plans array containing policy information
 * @param flattenedPolicies - The flattened policies data
 * @returns Formatted policy period text or default text
 */
export function getPolicyPeriodText(
  plans: any[],
  flattenedPolicies: any[], 
  isViewOnly: boolean
): string {
  if (
    plans &&
    plans.length > 0 &&
    flattenedPolicies &&
    flattenedPolicies.length > 0
  ) {
    const validDates: { startDate: Date; endDate: Date }[] = [];

    // Collect all valid start and end dates from all policies
    plans.forEach((plan) => {
      const policyDetails = flattenedPolicies.find(
        (p) => p.policyId === plan.policyId
      );

      if (policyDetails && policyDetails.startDate) {
        const startDate = new Date(policyDetails.startDate);
        let endDate: Date;

        if (policyDetails.dueDate) {
          endDate = new Date(policyDetails.dueDate);
        } else {
          // Calculate end date by adding 1 year minus 1 day
          endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          endDate.setDate(endDate.getDate() - 1);
        }

        validDates.push({ startDate, endDate });
      }
    });

    // Find earliest start date and latest end date
    if (validDates.length > 0) {
      const earliestStart = new Date(
        Math.min(...validDates.map((d) => d.startDate.getTime()))
      );
      const latestEnd = new Date(
        Math.max(...validDates.map((d) => d.endDate.getTime()))
      );

      const formattedStartDate = formatDate(
        earliestStart.toISOString().split("T")[0],
        DATE_FORMATS.DAY_SHORT_MONTH_YEAR
      );
      const formattedEndDate = formatDate(
        latestEnd.toISOString().split("T")[0],
        DATE_FORMATS.DAY_SHORT_MONTH_YEAR
      );

      if (formattedStartDate && formattedEndDate) {
        if(isViewOnly){
        return `Here's the Enrolment Completion summary for current policy year ${formattedStartDate} to ${formattedEndDate}`;
        }
        else {
        return `Here's the Enrolment summary for current policy year ${formattedStartDate} to ${formattedEndDate}`; 
        }
      }
    }
  }

  // Default fallback text
  return "View Enrolment Summary for the current policy year 15 Jan '26 to 14 Jan '27";
}

export function normalizePoliciesByBase(data: PolicyItem[]): PolicyItem[] {
  // Collect policyIds that have at least one "base"
  const policyIdsWithBase = new Set<number>();

  data.forEach((item) => {
    if (item && item.policyComponentActionType === "base") {
      policyIdsWithBase.add(item.policyId);
    }
  });

  // Normalize the array
  return data.map((item) => {
    if (!item) return null;

    // If this policyId has a base → keep all items
    if (policyIdsWithBase.has(item.policyId)) {
      return item;
    }

    // If no base exists for this policyId → nullify
    return null;
  });
}

export function generatePolicySummaryFromConfig(
  policyConfigurationData: any[],
  dependents: any[],
  flattenedPolicies: any[],
  localization?: LocalizationConfig,
  summaryData?: any,
  policyTemplatesById?: Record<string, any>
): { plans: any[]; enrollmentInfo: any } {
  const policyGroups = new Map<string, any[]>();
  const enrollmentInfo: any = {
    policyConsumers: [],
    premium: formatAmountWithCurrency(0, localization),
    companyContribution: formatAmountWithCurrency(0, localization),
    yourContribution: formatAmountWithCurrency(0, localization),
    showCompanyContribution: true,
  };
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const total = {
    premium: 0,
    company: 0,
    employee: 0,
  };

  let shouldShowCompanyContribution = false;

  const resolveCompanyContributionVisibility = (item: any): boolean => {
    const policyShowEmployeeContribution =
      item?.showEmployeeContribution ??
      item?.constraints?.showEmployeeContribution ??
      item?.configuration?.constraints?.showEmployeeContribution;

    const componentShowCompanyContribution = item?.showCompanyContribution;

    if (typeof policyShowEmployeeContribution === "boolean") {
      return (
        policyShowEmployeeContribution === true &&
        componentShowCompanyContribution === true
      );
    }

    return componentShowCompanyContribution === true;
  };

  // Create member distribution function
  const createMemberMap = (policyName: string, policyItems: any[]) => {
    const memberMap = {
      base: [] as any[],
      parental: [] as any[],
    };

    // Create maps to track members by their specific policy component assignments
    const membersByComponent = new Map<string, any[]>();

    // --- Determine if a parental plan exists ---
    const hasParentalPlan = policyItems?.some(
      (item) => item?.policyComponentActionType === "parental"
    );

    // --- Relationships to classify as parental ---
    const parentalRelations = [
      "father",
      "mother",
      "father-in-law",
      "mother-in-law",
    ];

    // --- Distribute dependents based on their specific policy component assignments ---
    // Build a set of component IDs belonging to this policy from the selected items.
    // This works for any policy type (GMC, GPA, GTL, etc.) — not just GMC.
    const policyComponentIdSet = new Set<number>(
      policyItems
        .map((item: any) => Number(item?.policyComponentActionTypeId))
        .filter((id: number) => Number.isFinite(id))
    );

    dependents?.forEach((member) => {
      const memberComponentId = Number(member.policyComponentActionTypeId);
      // Only include this dependent if their component belongs to this policy
      if (!Number.isFinite(memberComponentId) || !policyComponentIdSet.has(memberComponentId)) return;

      const {
        name,
        relation,
        policyComponentActionTypeId,
        policyComponentActionType,
      } = member;

      const relType = member.relationshipType?.toLowerCase?.() || "";
      const relationLower = relation?.toLowerCase() || "";
      const age =
        new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();

      const memberData = {
        id: member.id,
        name,
        age,
        relation,
      };

      // Create component key for tracking
      const componentKey = `${policyComponentActionTypeId}-${policyComponentActionType}`;

      if (!membersByComponent.has(componentKey)) {
        membersByComponent.set(componentKey, []);
      }
      membersByComponent.get(componentKey)!.push(memberData);

      // Add to general memberMap for backward compatibility (base/parental)
      if (policyComponentActionType === "base") {
        memberMap["base"].push(memberData);
      } else if (
        policyComponentActionType === "parental" ||
        (hasParentalPlan &&
          (parentalRelations.includes(relType) ||
            parentalRelations.includes(relationLower)))
      ) {
        memberMap["parental"].push(memberData);
      }
    });

    // Ensure "Self" exists in base and is always FIRST
    const hasSelf = memberMap["base"].some((m) => m.relation === "Self");
    if (!hasSelf) {
      memberMap["base"].unshift({
        id: "self",
        name: user.employeeName || "You",
        age: "—",
        relation: "Self",
      });
    } else {
      // Move "Self" to the beginning if it already exists
      const selfIndex = memberMap["base"].findIndex(
        (m) => m.relation === "Self"
      );
      if (selfIndex > 0) {
        const selfMember = memberMap["base"].splice(selfIndex, 1)[0];
        memberMap["base"].unshift(selfMember);
      }
    }

    return { memberMap, membersByComponent };
  };

  // --- Step 1: Group by policyId ---
  policyConfigurationData?.forEach((item) => {
    if (!item || !item.policyId) return;

    const policyId = String(item.policyId);
    if (!policyGroups.has(policyId)) {
      policyGroups.set(policyId, []);
    }
    policyGroups.get(policyId)!.push(item);
  });

  const plans: any[] = [];

  // --- Step 2: Process each policy group ---
  policyGroups.forEach((policyItems, policyId) => {
    const policyName = policyItems[0]?.policyName || "Unknown Policy";

    // Find corresponding policy details from flattenedPolicies
    const policyDetails = flattenedPolicies?.find(
      (policy) => policy.policyId === Number(policyId)
    );

    // Create member map specific to this policy
    const { memberMap, membersByComponent } = createMemberMap(
      policyName,
      policyItems
    );

    // Check if this is GMC policy (still needed for getMembersForComponent display logic)
    const isGMCPolicy =
      policyName?.toLowerCase().includes("mediclaim") ||
      policyName?.toLowerCase().includes("gmc");

    // Find base & parental IDs for this policy
    const baseIds = new Set<string>();
    const parentalIds = new Set<string>();

    policyItems
      ?.filter((item) => item !== null)
      ?.forEach((item) => {
        if (item.policyComponentActionType === "base") {
          baseIds.add(String(item.policyComponentActionTypeId));
        } else if (item.policyComponentActionType === "parental") {
          parentalIds.add(String(item.policyComponentActionTypeId));
        }
        
        // Also collect parent IDs that are referenced but don't exist as direct components
        if (item.parentpolicyComponentActionTypeId) {
          const parentId = String(item.parentpolicyComponentActionTypeId);
          // If parent ID is not in baseIds, it should be in parentalIds
          if (!baseIds.has(parentId)) {
            parentalIds.add(parentId);
          }
        }
      });


    const getEligibleRelationsForComponent = (
      componentId: number,
      parentComponentId?: number | null,
      componentType?: string,
    ): string[] => {
      const policyTemplate =
        policyTemplatesById?.[policyId]?.config?.policyTemplate;
      if (!policyTemplate || !Number.isFinite(componentId)) return [];

      const normalizedComponentId = Number(componentId);
      const normalizedParentComponentId =
        parentComponentId != null ? Number(parentComponentId) : null;

      const baseMainId = Number(policyTemplate?.basePolicy?.mainPolicyId);
      if (baseMainId === normalizedComponentId) {
        return policyTemplate?.basePolicy?.eligibleRelations || [];
      }

      const shouldSearchBaseAddons =
        componentType === "baseAddon" ||
        normalizedParentComponentId === baseMainId ||
        normalizedParentComponentId == null;
      const baseAddon = shouldSearchBaseAddons
        ? (policyTemplate?.basePolicy?.addonIds || []).find(
        (addon: any) => Number(addon?.optionId) === normalizedComponentId
          )
        : null;
      if (baseAddon) {
        return baseAddon?.eligibleRelations || [];
      }

      const parentalMainId = Number(
        policyTemplate?.parentalPolicy?.mainPolicyId
      );
      if (parentalMainId === normalizedComponentId) {
        return policyTemplate?.parentalPolicy?.eligibleRelations || [];
      }

      const shouldSearchParentalAddons =
        componentType === "parentalAddon" ||
        normalizedParentComponentId === parentalMainId ||
        normalizedParentComponentId == null;
      const parentalAddon = shouldSearchParentalAddons
        ? (policyTemplate?.parentalPolicy?.addonIds || []).find(
            (addon: any) => Number(addon?.optionId) === normalizedComponentId,
          )
        : null;
      if (parentalAddon) {
        return parentalAddon?.eligibleRelations || [];
      }

      return [];
    };

    const getComponentMultiplier = (item: any): number => {
      if (!item?.premiumPerLife) return 1;
      // For any policy type: if the component has premiumPerLife, multiply by the number
      // of dependents assigned to it (plus Self when Self is eligible).

      const componentId = Number(item?.policyComponentActionTypeId);
      const hasComponentId = Number.isFinite(componentId);
      const parentComponentId = Number(item?.parentpolicyComponentActionTypeId);
      const hasParentComponentId = Number.isFinite(parentComponentId);
      const actionType = String(item?.policyComponentActionType ?? "").toLowerCase();

      const matchingDependents = (
        Array.isArray(dependents) ? dependents : []
      ).filter((dependent) => {
        const dependentComponentId = Number(
          dependent?.policyComponentActionTypeId,
        );
        const dependentParentComponentId = Number(
          dependent?.parentpolicyComponentActionTypeId,
        );

        if (!hasComponentId || dependentComponentId !== componentId) {
          return false;
        }

        if (actionType === "optional") {
          return (
            hasParentComponentId &&
            dependentParentComponentId === parentComponentId
          );
        }

        return true;
      });

      const uniqueDependentCount = new Set(
        matchingDependents.map((dependent) =>
          String(
            dependent?.id ??
              `${dependent?.name ?? ""}|${dependent?.relation ?? ""}|${
                dependent?.dateOfBirth ?? ""
              }`
          )
        )
      ).size;

      const eligibleRelations = hasComponentId
        ? getEligibleRelationsForComponent(
            componentId,
            hasParentComponentId ? parentComponentId : null,
            actionType,
          )
        : [];
      const isParentalComponent =
        item?.policyComponentActionType === "parental" ||
        parentalIds.has(String(item?.parentpolicyComponentActionTypeId));

      const includeSelf =
        eligibleRelations.length > 0
          ? eligibleRelations.some(
              (relation: string) => relation?.toLowerCase?.() === "self"
            )
          : !isParentalComponent;

      return uniqueDependentCount + (includeSelf ? 1 : 0);
    };

    // Group components for this policy - keep as arrays with simple deduplication
    const grouped: Record<string, any[]> = {
      base: [],
      parental: [],
      baseAddons: [],
      parentalAddons: [],
    };

    // Track processed items to avoid duplicates
    const processedItems = new Set<string>();

    policyItems
      ?.filter((item) => item !== null)
      .forEach((item) => {
        const {
          parentpolicyComponentActionTypeId,
          policyComponentActionType,
          policyComponentActionTypeId,
          policyComponentActionLabel,
          sumInsured,
          companyPay,
          employeePay,
          premiumPerLife,
        } = item;

        // Create deduplication key
        const deduplicationKey = [
          policyComponentActionTypeId ?? "null",
          parentpolicyComponentActionTypeId ?? "null",
          policyComponentActionType ?? "",
          policyComponentActionLabel ?? "",
        ].join("-");

        // Skip if already processed
        if (processedItems.has(deduplicationKey)) {
          console.log(
            `Summary UI: Skipping duplicate item with key: ${deduplicationKey}`
          );
          return;
        }

        processedItems.add(deduplicationKey);

        const parentIdRaw = String(parentpolicyComponentActionTypeId);
        const isCompanyContributionVisible =
          resolveCompanyContributionVisibility(item);

        const premiumMultiplier = getComponentMultiplier(item);

        const baseCompany =
          Number(companyPay ?? item.companyContribution ?? 0) || 0;
        const baseEmployee =
          Number(employeePay ?? item.employeeContribution ?? 0) || 0;
        const basePremiumValue =
          Number(item.premium ?? baseCompany + baseEmployee) ||
          baseCompany + baseEmployee;

        const companyTotal = baseCompany * premiumMultiplier;
        const employeeTotal = baseEmployee * premiumMultiplier;
        let premiumTotal = basePremiumValue * premiumMultiplier;

        if (!Number.isFinite(premiumTotal)) {
          premiumTotal = companyTotal + employeeTotal;
        }

        const formattedItem = {
          name: policyComponentActionLabel,
          // `isOptional` lets a base component sit in the Optional bucket. Folded
          // into `type` here because every downstream filter reads this field.
          type:
            policyComponentActionType === "optional" ||
            item.isOptional === true
              ? "optional"
              : "compulsory",
          isBenefitComponent: item.isBenefitComponent === true,
          sumInsured: `${formatAmountWithCurrency(sumInsured, localization)}`,
          premium: `${formatAmountWithCurrency(premiumTotal, localization, 2)}`,
          companyContribution: `${formatAmountWithCurrency(companyTotal, localization, 2)}`,
          yourContribution: `${formatAmountWithCurrency(employeeTotal, localization, 2)}`,
          showCompanyContribution: isCompanyContributionVisible,
          premiumPerLife: premiumPerLife || false,
          policyComponentActionTypeId,
          parentpolicyComponentActionTypeId,
        };

        // Add to totals (use calculated totals with multipliers)
        total.premium += premiumTotal;
        if (isCompanyContributionVisible) {
          total.company += companyTotal;
        }
        total.employee += employeeTotal;

        shouldShowCompanyContribution =
          shouldShowCompanyContribution || isCompanyContributionVisible;

        if (policyComponentActionType === "base") {
          grouped.base.push(formattedItem);
        } else if (policyComponentActionType === "parental") {
          grouped.parental.push(formattedItem);
        } else if (policyComponentActionType === "optional") {
          if (baseIds.has(parentIdRaw)) {
            grouped.baseAddons.push(formattedItem);
          } else if (parentalIds.has(parentIdRaw)) {
            grouped.parentalAddons.push(formattedItem);
          } else {
            console.log(`${policyComponentActionLabel} parentId ${parentIdRaw} not found in baseIds or parentalIds`);
          }
        }
      });

    // Build policy plans structure with correct member segregation
    const policyPlans: any[] = [];

    // Helper function to get members for specific component type and id
    const getMembersForComponent = (
      componentType: string,
      componentId?: number,
      parentComponentId?: number | null,
    ) => {
      const members = [];
      const seenMembers = new Set<string>();

      // Check if "Self" should be included based on eligibleRelations using ID-based matching
      const shouldIncludeSelf = () => {
        // Get the policy template for this policy ID
        const policyTemplate = policyTemplatesById?.[policyId];
        
        if (!policyTemplate?.config?.policyTemplate) {
          // Fallback: if no policyTemplate found, use old behavior (base only)
          return componentType === "base";
        }

        const template = policyTemplate.config.policyTemplate;
        let eligibleRelations: string[] = [];

        // Convert componentId to number for comparison (handle null properly)
        const searchId = componentId ? Number(componentId) : null;
        const searchParentId =
          parentComponentId != null ? Number(parentComponentId) : null;

        // Try to match based on policy template structure using IDs
        // Check basePolicy main policy ID
        if (template.basePolicy?.mainPolicyId) {
          const basePolicyId = Number(template.basePolicy.mainPolicyId);
          if (
            (componentType === "base" && !componentId) ||
            (searchId !== null && searchId === basePolicyId)
          ) {
            eligibleRelations = template.basePolicy.eligibleRelations || [];
          }
        }

        // Check parentalPolicy main policy ID
        if (
          template.parentalPolicy?.mainPolicyId &&
          eligibleRelations.length === 0
        ) {
          const parentalPolicyId = Number(template.parentalPolicy.mainPolicyId);
          if (
            (componentType === "parental" && !componentId) ||
            (searchId !== null && searchId === parentalPolicyId)
          ) {
            eligibleRelations = template.parentalPolicy.eligibleRelations || [];
          }
        }

        // Check basePolicy addons by ID
        if (
          template.basePolicy?.addonIds &&
          eligibleRelations.length === 0 &&
          (componentType === "baseAddon" ||
            searchParentId === Number(template.basePolicy?.mainPolicyId))
        ) {
          const matchingAddon = template.basePolicy.addonIds.find(
            (addon: any) => {
              const addonId = addon.optionId ? Number(addon.optionId) : null;
              return (
                searchId !== null && addonId !== null && searchId === addonId
              );
            }
          );
          if (matchingAddon) {
            eligibleRelations = matchingAddon.eligibleRelations || [];
          }
        }

        // Check parentalPolicy addons by ID
        if (
          template.parentalPolicy?.addonIds &&
          eligibleRelations.length === 0 &&
          (componentType === "parentalAddon" ||
            searchParentId === Number(template.parentalPolicy?.mainPolicyId))
        ) {
          const matchingAddon = template.parentalPolicy.addonIds.find(
            (addon: any) => {
              const addonId = addon.optionId ? Number(addon.optionId) : null;
              return (
                searchId !== null && addonId !== null && searchId === addonId
              );
            }
          );
          if (matchingAddon) {
            eligibleRelations = matchingAddon.eligibleRelations || [];
          }
        }

        // Check if "Self" is in eligibleRelations (case-insensitive)
        return eligibleRelations.some(
          (relation) => relation.toLowerCase() === "self"
        );
      };

      // Include Self only if it's in eligibleRelations for this component
      if (shouldIncludeSelf()) {
        members.push({
          id: "self",
          name: user.employeeName || "You",
          age: "—",
          relation: "Self",
          dateOfBirth: user?.dateOfBirth ?? null,
        });
      }

      const getAssignments = (dependent: any) => {
        const rawChoices = Array.isArray(dependent?.choices)
          ? dependent.choices
          : [];

        const mapped = rawChoices
          .map((choice: any) => ({
            policyComponentActionType: choice?.policyComponentActionType ?? null,
            policyComponentActionTypeId: choice?.policyComponentActionTypeId,
            parentpolicyComponentActionTypeId:
              choice?.parentpolicyComponentActionTypeId ?? null,
          }))
          .filter((choice: any) => choice?.policyComponentActionTypeId != null);

        if (mapped.length > 0) {
          return mapped;
        }

        return [
          {
            policyComponentActionType: dependent?.policyComponentActionType ?? null,
            policyComponentActionTypeId: dependent?.policyComponentActionTypeId,
            parentpolicyComponentActionTypeId:
              dependent?.parentpolicyComponentActionTypeId ?? null,
          },
        ];
      };

    dependents?.forEach((dependent) => {
      const dependentChoices = Array.isArray(dependent?.choices)
        ? dependent.choices.filter(
            (choice: any) => choice?.policyComponentActionTypeId != null,
          )
        : [];
      const hasActiveChoiceAssignment = dependentChoices.length > 0;
      const hasDirectAssignment = Number.isFinite(
        Number(dependent?.policyComponentActionTypeId),
      );

      if (!hasActiveChoiceAssignment && !hasDirectAssignment) {
        return;
      }

      let shouldInclude = false;
      const assignments = getAssignments(dependent);

          // Direct ID matching - optionals also need parent component context.
              for (const assignment of assignments) {
                const depId = assignment?.policyComponentActionTypeId;
                const depParentId = assignment?.parentpolicyComponentActionTypeId;

            if (shouldInclude) break;

            // Base/parental plans include dependents whose chosen component belongs to this policy.
            if (componentType === "base" && !componentId) {
              const actionId = depId != null ? String(depId) : "";
              if (baseIds.has(actionId)) {
                shouldInclude = true;
                break;
              }
            }

            if (componentType === "parental" && !componentId) {
              const actionId = depId != null ? String(depId) : "";
              if (parentalIds.has(actionId)) {
                shouldInclude = true;
                break;
              }
            }

            if (
              !shouldInclude &&
              componentId &&
              depId &&
              Number(depId) === Number(componentId)
            ) {
              const dependentParentId =
                depParentId != null ? Number(depParentId) : null;
              const normalizedParentComponentId =
                parentComponentId != null ? Number(parentComponentId) : null;

              if (
                componentType === "baseAddon" ||
                componentType === "parentalAddon"
              ) {
                if (
                  normalizedParentComponentId != null &&
                  dependentParentId === normalizedParentComponentId
                ) {
                  shouldInclude = true;
                  console.log(
                    `Including ${dependent.name} in ${componentType} ${componentId} (direct ID + parent match: dep=${depId}|${depParentId})`
                  );
                  break;
                }
              } else {
                shouldInclude = true;
                console.log(
                  `Including ${dependent.name} in component ${componentId} (direct ID match: dep=${depId})`
                );
                break;
              }
            }
          }

          // If not already included, try policy template matching
          if (!shouldInclude) {
            // Get the policy template for this policy ID
            const policyTemplate = policyTemplatesById?.[policyId];
            if (policyTemplate?.config?.policyTemplate) {
              const template = policyTemplate.config.policyTemplate;

              const searchId = componentId ? Number(componentId) : null;

              for (const assignment of assignments) {
                const depId = assignment?.policyComponentActionTypeId;
                const depParentId = assignment?.parentpolicyComponentActionTypeId;

                // Convert IDs to numbers for comparison (handle null properly)
                const depActionId = depId ? Number(depId) : null;
                const depParentActionId = depParentId ? Number(depParentId) : null;

                if (shouldInclude) break;

                // Check basePolicy main policy ID match
                if (template.basePolicy?.mainPolicyId) {
                  const basePolicyId = Number(template.basePolicy.mainPolicyId);
                  if (
                    (componentType === "base" && !componentId) ||
                    (searchId !== null && searchId === basePolicyId)
                  ) {
                    // Include if dependent's ID matches base policy ID
                    if (depActionId !== null && depActionId === basePolicyId) {
                      shouldInclude = true;
                      console.log(
                        `Including ${dependent.name} in base policy (ID match: dep=${depActionId}|${depParentActionId}, base=${basePolicyId})`
                      );
                      break;
                    }
                  }
                }

                // Check parentalPolicy main policy ID match
                if (template.parentalPolicy?.mainPolicyId && !shouldInclude) {
                  const parentalPolicyId = Number(
                    template.parentalPolicy.mainPolicyId
                  );
                  if (
                    (componentType === "parental" && !componentId) ||
                    (searchId !== null && searchId === parentalPolicyId)
                  ) {
                    // Include if dependent's ID matches parental policy ID
                    if (
                      depActionId !== null &&
                      depActionId === parentalPolicyId
                    ) {
                      shouldInclude = true;
                      console.log(
                        `Including ${dependent.name} in parental policy (ID match: dep=${depActionId}|${depParentActionId}, parental=${parentalPolicyId})`
                      );
                      break;
                    }
                  }
                }

                // Check basePolicy addons by ID
                if (
                  template.basePolicy?.addonIds &&
                  !shouldInclude &&
                  searchId !== null
                ) {
                  const matchingAddon = template.basePolicy.addonIds.find(
                    (addon: any) => {
                      const addonId = addon.optionId
                        ? Number(addon.optionId)
                        : null;
                      return addonId !== null && searchId === addonId;
                    }
                  );
                  if (matchingAddon) {
                    const addonId = Number(matchingAddon.optionId);
                    // Include if dependent's ID matches this addon ID
                    if (
                      depActionId !== null &&
                      depActionId === addonId &&
                      depParentActionId !== null &&
                      depParentActionId === Number(parentComponentId)
                    ) {
                      shouldInclude = true;
                      console.log(
                        `Including ${dependent.name} in baseAddon ${searchId} (ID match: dep=${depActionId}|${depParentActionId}, addon=${addonId})`
                      );
                      break;
                    }
                  }
                }

                // Check parentalPolicy addons by ID
                if (
                  template.parentalPolicy?.addonIds &&
                  !shouldInclude &&
                  searchId !== null
                ) {
                  const matchingAddon = template.parentalPolicy.addonIds.find(
                    (addon: any) => {
                      const addonId = addon.optionId
                        ? Number(addon.optionId)
                        : null;
                      return addonId !== null && searchId === addonId;
                    }
                  );
                  if (matchingAddon) {
                    const addonId = Number(matchingAddon.optionId);
                    // Include if dependent's ID matches this addon ID
                    if (
                      depActionId !== null &&
                      depActionId === addonId &&
                      depParentActionId !== null &&
                      depParentActionId === Number(parentComponentId)
                    ) {
                      shouldInclude = true;
                      console.log(
                        `Including ${dependent.name} in parentalAddon ${searchId} (ID match: dep=${depActionId}|${depParentActionId}, addon=${addonId})`
                      );
                      break;
                    }
                  }
                }
              }
            } else {
              // Fallback to old string-based matching if no policy template
              for (const assignment of assignments) {
                const depId = assignment?.policyComponentActionTypeId;
                const depParentId = assignment?.parentpolicyComponentActionTypeId;

                if (shouldInclude) break;

                if (componentType === "base" && depType === "base") {
                  shouldInclude = true;
                  console.log(
                    `Including ${dependent.name} in base policy (fallback string match)`
                  );
                  break;
                } else if (
                  componentType === "parental" &&
                  depType === "parental"
                ) {
                  shouldInclude = true;
                  console.log(
                    `Including ${dependent.name} in parental policy (fallback string match)`
                  );
                  break;
                } else if (
                  (componentType === "baseAddon" ||
                    componentType === "parentalAddon") &&
                  depType === "optional" &&
                  componentId &&
                  Number(depId) === Number(componentId) &&
                  Number(depParentId) === Number(parentComponentId)
                ) {
                  shouldInclude = true;
                  console.log(
                    `Including ${dependent.name} in addon ${componentId} (fallback string + ID match)`
                  );
                  break;
                }
              }
            }
          }

          if (!shouldInclude) {
            console.log(
              `Excluding ${dependent.name} from ${componentType} ${
                componentId || ""
              } (no ID match found)`
            );
          }

          if (shouldInclude) {
            const age =
              dependent.age || dependent.dateOfBirth
                ? new Date().getFullYear() -
                  new Date(dependent.dateOfBirth).getFullYear()
                : "—";
            const memberKey = String(
              dependent.id ??
                `${dependent.name ?? ""}|${dependent.relation ?? ""}|${
                  dependent.dateOfBirth ?? ""
                }`,
            );

            if (seenMembers.has(memberKey)) {
              return;
            }

            seenMembers.add(memberKey);

            members.push({
              id: dependent.id,
              name: dependent.name,
              age,
              relation: dependent.relation,
              dateOfBirth: dependent.dateOfBirth ?? null,
            });
          }
        });

      return members;
    };

    // Create base plan if base policies exist
    if (grouped.base.length > 0) {
      policyPlans.push({
        id: "basePlan",
        membersCovered: getMembersForComponent("base"),
        selectedPlans: grouped.base,
      });
    }

    // Create individual addon plans for each addon
    if (grouped.baseAddons.length > 0) {
      // Group addons by their component ID
      const addonGroups = new Map<string, any[]>();

      grouped.baseAddons.forEach((addon) => {
        const componentId = Number(addon?.policyComponentActionTypeId);
        const parentId = String(addon?.parentpolicyComponentActionTypeId ?? "null");
        const addonGroupKey = `${parentId}-${componentId}`;

        if (Number.isFinite(componentId)) {
          if (!addonGroups.has(addonGroupKey)) {
            addonGroups.set(addonGroupKey, []);
          }
          addonGroups.get(addonGroupKey)!.push(addon);
        }
      });

      // Create separate plan for each addon
      addonGroups.forEach((addons, addonGroupKey) => {
        const [parentIdRaw, componentIdRaw] = addonGroupKey.split("-");
        const componentId = Number(componentIdRaw);
        const parentComponentId = Number(parentIdRaw);
        policyPlans.push({
          id: `baseAddonPlan-${addonGroupKey}`,
          membersCovered: getMembersForComponent(
            "baseAddon",
            componentId,
            parentComponentId,
          ),
          selectedPlans: addons,
        });
      });
    }

    // Create parental plan if parental policies exist
    if (grouped.parental.length > 0) {
      policyPlans.push({
        id: "parentalPlan",
        membersCovered: getMembersForComponent("parental"),
        selectedPlans: grouped.parental,
      });
    }

    // Create individual parental addon plans
    if (grouped.parentalAddons.length > 0) {
      const parentalAddonGroups = new Map<string, any[]>();

      grouped.parentalAddons.forEach((addon) => {
        const componentId = Number(addon?.policyComponentActionTypeId);
        const parentId = String(addon?.parentpolicyComponentActionTypeId ?? "null");
        const addonGroupKey = `${parentId}-${componentId}`;

        if (Number.isFinite(componentId)) {
          if (!parentalAddonGroups.has(addonGroupKey)) {
            parentalAddonGroups.set(addonGroupKey, []);
          }
          parentalAddonGroups.get(addonGroupKey)!.push(addon);
        } else {
          console.log(`No valid component id found for parental addon ${addon.name}`);
        }
      });

      parentalAddonGroups.forEach((addons, addonGroupKey) => {
        const [parentIdRaw, componentIdRaw] = addonGroupKey.split("-");
        const componentId = Number(componentIdRaw);
        const parentComponentId = Number(parentIdRaw);
        policyPlans.push({
          id: `parentalAddonPlan-${addonGroupKey}`,
          membersCovered: getMembersForComponent(
            "parentalAddon",
            componentId,
            parentComponentId,
          ),
          selectedPlans: addons,
        });
      });
    } else {
      console.log('No parental addons found in grouped.parentalAddons');
    }

    // Sort addon plan cards by globally unique sequence (covers both base and parental)
    const template =
      policyTemplatesById?.[policyId]?.config?.policyTemplate;
    const combinedSeqForSort = new Map<string, number>();
    const baseMainId = template?.basePolicy?.mainPolicyId;
    const parentalMainId = template?.parentalPolicy?.mainPolicyId;
    (template?.basePolicy?.addonIds ?? []).forEach((addon: any) =>
      combinedSeqForSort.set(`${addon.optionId}|${baseMainId}`, addon.sequence),
    );
    (template?.parentalPolicy?.addonIds ?? []).forEach((addon: any) =>
      combinedSeqForSort.set(
        `${addon.optionId}|${parentalMainId}`,
        addon.sequence,
      ),
    );

    const planSortKey = (plan: any): [number, number] => {
      if (plan.id === "basePlan" || plan.id === "parentalPlan") return [0, 0];
      // id format: "baseAddonPlan-{parentId}-{componentId}" or "parentalAddonPlan-..."
      const parts = String(plan.id).split("-");
      const componentId = parts[parts.length - 1];
      const parentId = parts[parts.length - 2];
      const seq = combinedSeqForSort.get(`${componentId}|${parentId}`) ?? 999;
      return [1, seq];
    };

    policyPlans.sort((a: any, b: any) => {
      const [oA, sA] = planSortKey(a);
      const [oB, sB] = planSortKey(b);
      if (oA !== oB) return oA - oB;
      return sA - sB;
    });

    // Add this policy to plans
    plans.push({
      policyId: Number(policyId),
      policyName: policyName,
      policyPlans: policyPlans,
      // Include additional policy details from flattenedPolicies
      policyTypeKey: policyDetails?.policyTypeKey || null,
      startDate: policyDetails?.startDate || null,
      dueDate: policyDetails?.dueDate || null,
      enrollmentStartDate: policyDetails?.enrollmentStartDate || null,
      enrollmentEndDate: policyDetails?.enrollmentEndDate || null,
      status: policyDetails?.status || null,
      policyStage: policyDetails?.policyStage || null,
      // Add showDeclarations flag based on enrollment confirmation requirement
      showDeclarations: summaryData
        ? shouldShowDeclarations(summaryData, Number(policyId))
        : false,
    });
  });

  enrollmentInfo.premium = `${formatAmountWithCurrency(
    total.premium,
    localization,
    2
  )}`;
  enrollmentInfo.companyContribution = `${formatAmountWithCurrency(
    total.company,
    localization,
    2
  )}`;
  enrollmentInfo.yourContribution = `${formatAmountWithCurrency(
    total.employee,
    localization,
    2
  )}`;
  enrollmentInfo.showCompanyContribution = shouldShowCompanyContribution;

  // Collect all unique members from all policies for policyConsumers calculation
  const allUniqueMembers = new Map<string, any>();

  plans.forEach((policy) => {
    policy.policyPlans.forEach((plan: any) => {
      plan.membersCovered.forEach((member: any) => {
        allUniqueMembers.set(member.id, member);
      });
    });
  });

  const allMembers = Array.from(allUniqueMembers.values());

  const relationCounts: Record<string, number> = {};
  allMembers.forEach((member) => {
    const relation = member.relation;
    if (relation) {
      relationCounts[relation] = (relationCounts[relation] || 0) + 1;
    }
  });

  enrollmentInfo.policyConsumers = Object.entries(relationCounts).map(
    ([relation, count]) => ({
      info:
        relation === "Self"
          ? "You"
          : `${count} ${relation?.toLowerCase()}${count > 1 ? "s" : ""}`,
    })
  );

  plans.sort((a: any, b: any) => {
    const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
    const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
    return priorityA - priorityB;
  });

  return { plans, enrollmentInfo };
}

export interface DeclarationPoints {
  title: string;
  points: { content: string }[];
}

export const generateMultiPolicyDeclarations = (
  summaryData: any
): Record<string, DeclarationPoints> => {
  const declarations: Record<string, DeclarationPoints> = {};

  // Convert summaryData object to array if it's not already
  const policiesArray = Array.isArray(summaryData)
    ? summaryData
    : Object.values(summaryData).filter(
        (item) => item && typeof item === "object" && "policyId" in item
      );

  policiesArray?.forEach((policy: any) => {
    const points: { content: string }[] = [];

    // Add payroll installments declaration if it exists in configuration.constraints
    if (policy?.configuration?.constraints?.payrollInstallments) {
      const installments = policy.configuration.constraints.payrollInstallments;
      const installmentText =
        installments === 1 ? "installment" : "installments";
      points.push({
        content: `I consent to premium deductions from my salary in ${installments} ${installmentText}. I have read and understood the above declaration and accept the terms and conditions of the selected insurance plans.`,
      });
    }

    // Add custom disclaimer if it exists in configuration.constraints
    if (policy?.configuration?.constraints?.customDisclaimerBeforeSubmission) {
      points.push({
        content:
          policy.configuration.constraints.customDisclaimerBeforeSubmission,
      });
    }

    declarations[policy.policyId] = {
      title: DECLARATION_DATA.title,
      points,
    };
  });

  return declarations;
};
