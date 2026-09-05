import {
  formatAmountWithCurrency,
  type LocalizationConfig,
} from "@ui/ui-lib";

export function generatePolicySummaryFromConfig(
  policyConfigurationData: any[],
  dependents: any[],
  localization?: LocalizationConfig
) {
  const plans = [];
  const enrollmentInfo: any = {
    policyConsumers: [],
    premium: formatAmountWithCurrency(0, localization),
    companyContribution: formatAmountWithCurrency(0, localization),
    yourContribution: formatAmountWithCurrency(0, localization),
    showCompanyContribution: true,
  };

  const total = {
    premium: 0,
    company: 0,
    employee: 0,
  };

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

  let shouldShowCompanyContribution = false;

  const memberMap = {
    base: [] as any[],
    parental: [] as any[],
  };

  // --- Determine if a parental plan exists ---
  const hasParentalPlan = policyConfigurationData?.some(
    (item) => item?.policyComponentActionType === "parental"
  );

  // --- Relationships to classify as parental ---
  const parentalRelations = [
    "father",
    "mother",
    "father-in-law",
    "mother-in-law",
  ];

  // --- Distribute dependents ---
  dependents?.forEach((member) => {
    const relType = member.relationshipType?.toLowerCase?.() || "";
    const relation = member.relation || "—";
    const age =
      new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();

    // If parental plan exists and relation is parental -> push to parental plan
    if (hasParentalPlan && parentalRelations.includes(relType)) {
      memberMap["parental"].push({
        id: member.id,
        name: member.name,
        age,
        relation,
      });
    } else {
      // otherwise keep in base
      memberMap["base"].push({
        id: member.id,
        name: member.name,
        age,
        relation,
      });
    }
  });

  // Ensure "Self" exists in base
  if (!memberMap["base"].some((m) => m.relation === "Self")) {
    memberMap["base"].push({
      id: "self",
      name: "You",
      age: "—",
      relation: "Self",
    });
  }

  // --- Step 1: Dynamically find base & parental IDs ---
  const baseIds = new Set<string>();
  const parentalIds = new Set<string>();

  policyConfigurationData
    ?.filter((item) => item !== null)
    ?.forEach((item) => {
      if (item.policyComponentActionType === "base") {
        baseIds.add(String(item.policyComponentActionTypeId));
      } else if (item.policyComponentActionType === "parental") {
        parentalIds.add(String(item.policyComponentActionTypeId));
      }
    });

  const totalMemberCount =
    memberMap["base"].length + memberMap["parental"].length || 1;

  // --- Step 2: Group components ---
  const grouped: Record<string, any[]> = {
    base: [],
    parental: [],
    baseAddons: [],
    parentalAddons: [],
  };

  policyConfigurationData
    ?.filter((item) => item !== null)
    .forEach((item) => {
      const {
        parentpolicyComponentActionTypeId,
        policyComponentActionType,
        policyComponentActionLabel,
        sumInsured,
        premium,
        companyPay,
        employeePay,
        group,
        premiumPerLife,
      } = item;

      const parentIdRaw = String(parentpolicyComponentActionTypeId);

      const isCompanyContributionVisible =
        resolveCompanyContributionVisibility(item);

      const multiplier = totalMemberCount;
      const premiumMultiplier = item?.premiumPerLife ? multiplier : 1;

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
        sumInsured: `${formatAmountWithCurrency(sumInsured, localization)}`,
        premium: `${formatAmountWithCurrency(premiumTotal / premiumMultiplier, localization)}`,
        companyContribution: `${formatAmountWithCurrency(companyTotal / premiumMultiplier, localization)}`,
        yourContribution: `${formatAmountWithCurrency(employeeTotal / premiumMultiplier, localization)}`,
        showCompanyContribution: isCompanyContributionVisible,
        premiumPerLife: premiumPerLife || false,
      };

      total.premium += premiumTotal;
      if (isCompanyContributionVisible) {
        total.company += companyTotal;
      }
      total.employee += employeeTotal;

      shouldShowCompanyContribution =
        shouldShowCompanyContribution || isCompanyContributionVisible;

      if (policyComponentActionType === "base" || group === "base") {
        grouped.base.push(formattedItem);
      } else if (
        policyComponentActionType === "parental" ||
        group === "parental"
      ) {
        grouped.parental.push(formattedItem);
      } else if (policyComponentActionType === "optional") {
        if (baseIds.has(parentIdRaw)) {
          grouped.baseAddons.push(formattedItem);
        } else if (parentalIds.has(parentIdRaw)) {
          grouped.parentalAddons.push(formattedItem);
        }
      }
    });

  // --- Step 3: Build plans ---
  if (grouped.base.length || grouped.baseAddons.length) {
    plans.push({
      id: "basePlan",
      membersCovered: memberMap["base"],
      selectedPlans: [...grouped.base, ...grouped.baseAddons],
    });
  }

  if (grouped.parental.length || grouped.parentalAddons.length) {
    plans.push({
      id: "parentalPlan",
      membersCovered: memberMap["parental"],
      selectedPlans: [...grouped.parental, ...grouped.parentalAddons],
    });
  }

  enrollmentInfo.premium = `${formatAmountWithCurrency(
    total.premium,
    localization
  )}`;
  enrollmentInfo.companyContribution = `${formatAmountWithCurrency(
    total.company,
    localization
  )}`;
  enrollmentInfo.yourContribution = `${formatAmountWithCurrency(
    total.employee,
    localization
  )}`;
  enrollmentInfo.showCompanyContribution = shouldShowCompanyContribution;

  const allMembers = [
    ...(memberMap["base"] || []),
    ...(memberMap["parental"] || []),
  ];

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

  return { plans, enrollmentInfo };
}
