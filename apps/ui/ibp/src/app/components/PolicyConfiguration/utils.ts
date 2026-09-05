import { FinalPolicy, ResponseType } from "../../types";

const getAdditionalDetailsFromStorage = (): Record<string, unknown> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedUser = window.sessionStorage.getItem("user");
    if (!storedUser) {
      return {};
    }

    const parsed = JSON.parse(storedUser);
    return parsed?.additionalDetails ?? {};
  } catch (error) {
    return {};
  }
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9.]/g, "");
    if (!sanitized) {
      return Number.NaN;
    }

    const parsed = Number(sanitized);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  return Number.NaN;
};

const roundToTwoDecimals = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = toNumber(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function generatePolicyStructureForSingleEnrollment(
  config: ResponseType,
  additionalDetails: Record<string, unknown> = getAdditionalDetailsFromStorage()
): FinalPolicy[] {
  const policyOptions = config?.availablePolicyChoices;

  const componentsMap = new Map<
    string,
    {
      label: string;
      type: string;
      premiumPerLife: boolean;
      showCompanyContribution: boolean;
      proRationEnabled?: boolean;
      isBenefitComponent?: boolean;
      acceptRelationsFromParent?: boolean;
      isOptional?: boolean;
      sumInsuredModel?: string;
      siMultipleLabel?: string;
      siMultipleMin?: number;
      siMultipleMax?: number;
    }
  >();

  config?.components?.forEach((component) => {
    componentsMap.set(component.id, {
      label: component.label,
      type: component.type,
      premiumPerLife: component.premiumPerLife,
      showCompanyContribution: component.showCompanyContribution,
      proRationEnabled: component.proRationEnabled,
      isBenefitComponent: component.isBenefitComponent,
      acceptRelationsFromParent: component.acceptRelationsFromParent,
      isOptional: component.isOptional,
      sumInsuredModel: component.sumInsuredModel,
      siMultipleLabel: component.siMultipleLabel,
      siMultipleMin: toOptionalNumber(component.siMultipleMin),
      siMultipleMax: toOptionalNumber(component.siMultipleMax),
    });
  });

  const finalPolicies: FinalPolicy[] = [];

  if (!policyOptions) return finalPolicies;

  const getSumInsuredValue = (
    policyId: string,
    sumInsuredId?: number
  ): string => {
    return sumInsuredId
      ? config?.components
          ?.find((comp) => comp.id === policyId)
          ?.sumInsuredOptions?.find((opt) => opt.id === sumInsuredId)?.value ??
          "00"
      : "00";
  };

  const transformChoices = (
    policyId: string,
    choices: any[],
    parentpolicyComponentActionTypeId?: number
  ) => {
    const componentData = componentsMap.get(policyId);
    const label = componentData?.label || "";
    const type = componentData?.type || "";
    const showCompanyContribution = componentData?.showCompanyContribution;
    const isBenefitComponent = componentData?.isBenefitComponent;
    const isOptional = componentData?.isOptional;
    const sumInsuredModel = componentData?.sumInsuredModel?.toUpperCase();
    const siMultipleLabel = componentData?.siMultipleLabel;
    const siMultipleMin = componentData?.siMultipleMin;
    const siMultipleMax = componentData?.siMultipleMax;

    const multipleFactorValue = siMultipleLabel
      ? toNumber(additionalDetails?.[siMultipleLabel])
      : Number.NaN;

    return choices.map((choice) => {
      // Prefer the choice's own sumInsured/premiumPerLife when explicitly present —
      // the backend overrides these per-choice for dependent-count-aware policies
      // (base SI + count-band enhancement, and premiumPerLife=false once a per-life
      // sum has already been computed) — only fall back to the static lookup/component
      // default when the choice doesn't specify them at all.
      const choiceSumInsuredNumeric = toOptionalNumber(choice.sumInsured);
      const sumInsuredValue =
        choiceSumInsuredNumeric !== undefined && choiceSumInsuredNumeric > 0
          ? String(choiceSumInsuredNumeric)
          : getSumInsuredValue(policyId, choice.sumInsuredId);
      const sumInsuredNumeric = toNumber(sumInsuredValue);
      const rawSumInsured = Number.isNaN(sumInsuredNumeric)
        ? undefined
        : sumInsuredNumeric;
      const premiumPerLife =
        choice.premiumPerLife !== undefined && choice.premiumPerLife !== null
          ? Boolean(choice.premiumPerLife)
          : Boolean(componentData?.premiumPerLife);

      const baseCompanyContribution = Number(choice.companyContribution ?? 0);
      const baseEmployeeContribution = Number(choice.employeeContribution ?? 0);

      const rawCompanyContribution = roundToTwoDecimals(
        baseCompanyContribution
      );
      const rawEmployeeContribution = roundToTwoDecimals(
        baseEmployeeContribution
      );

      let adjustedCompanyContribution = rawCompanyContribution;
      let adjustedEmployeeContribution = rawEmployeeContribution;
      let adjustedSumInsuredValue = sumInsuredValue;

      const shouldApplyMultiple =
        sumInsuredModel === "MULTIPLE" &&
        !Number.isNaN(multipleFactorValue) &&
        multipleFactorValue > 0 &&
        !Number.isNaN(sumInsuredNumeric) &&
        sumInsuredNumeric > 0;

      if (shouldApplyMultiple) {
        const scaledSumInsured = sumInsuredNumeric * multipleFactorValue;

        let boundedSumInsured = scaledSumInsured;

        if (
          typeof siMultipleMin === "number" &&
          !Number.isNaN(siMultipleMin) &&
          boundedSumInsured < siMultipleMin
        ) {
          boundedSumInsured = siMultipleMin;
        }

        if (
          typeof siMultipleMax === "number" &&
          !Number.isNaN(siMultipleMax) &&
          boundedSumInsured > siMultipleMax
        ) {
          boundedSumInsured = siMultipleMax;
        }

        if (!Number.isNaN(boundedSumInsured) && boundedSumInsured > 0) {
          const multiplier = boundedSumInsured / 1000;
          adjustedCompanyContribution = roundToTwoDecimals(
            baseCompanyContribution * multiplier
          );
          adjustedEmployeeContribution = roundToTwoDecimals(
            baseEmployeeContribution * multiplier
          );
          adjustedSumInsuredValue = String(
            roundToTwoDecimals(boundedSumInsured)
          );
        }
      }

      const premium = roundToTwoDecimals(
        adjustedCompanyContribution + adjustedEmployeeContribution
      );
      const rawPremium = roundToTwoDecimals(
        rawCompanyContribution + rawEmployeeContribution
      );

      return {
        ...choice,
        companyContribution: adjustedCompanyContribution,
        companyPay: adjustedCompanyContribution,
        employeeContribution: adjustedEmployeeContribution,
        employeePay: adjustedEmployeeContribution,
        rawSumInsured,
        rawCompanyContribution,
        rawEmployeeContribution,
        rawPremium,
        policyComponentActionType: type,
        policyComponentActionTypeId: Number(policyId),
        policyComponentActionLabel: label,
        premium,
        sumInsured: adjustedSumInsuredValue,
        ...(parentpolicyComponentActionTypeId && {
          parentpolicyComponentActionTypeId,
        }),
        premiumPerLife,
        showCompanyContribution,
        isBenefitComponent,
        isOptional,
      };
    });
  };

  const addPolicy = (
    policyData: any,
    parentpolicyComponentActionTypeId?: number,
    sectionGroup?: "base" | "parental"
  ) => {
    if (!policyData?.policyId) return;

    const compMeta = componentsMap.get(policyData.policyId);
    finalPolicies.push({
      id: policyData.policyId,
      label: compMeta?.label,
      type: compMeta?.type,
      parentpolicyComponentActionTypeId,
      isBenefitComponent: compMeta?.isBenefitComponent,
      acceptRelationsFromParent: compMeta?.acceptRelationsFromParent,
      isOptional: compMeta?.isOptional,
      sectionGroup,
      choices: transformChoices(
        policyData.policyId,
        policyData.choices,
        parentpolicyComponentActionTypeId
      ),
    });
  };

  const addAddonPolicies = (
    addons: any[],
    parentalPolicyComponentActionTypeId?: number,
    sectionGroup?: "base" | "parental"
  ) => {
    addons?.forEach((addon) =>
      addPolicy(addon, parentalPolicyComponentActionTypeId, sectionGroup)
    );
  };

  // 1. Base Main Policy
  addPolicy(policyOptions?.basePolicyChoices?.mainPolicyChoices, undefined, "base");

  // 2. Base Addon Policies
  const baseMainPolicyId =
    policyOptions?.basePolicyChoices?.mainPolicyChoices?.policyId;
  addAddonPolicies(
    policyOptions?.basePolicyChoices?.addonChoices || [],
    baseMainPolicyId ? Number(baseMainPolicyId) : undefined,
    "base"
  );

  // 3. Parental Main Policy
  addPolicy(policyOptions?.parentalPolicyChoices?.mainPolicyChoices, undefined, "parental");

  // 4. Parental Addon Policies
  const parentalMainPolicyId =
    policyOptions?.parentalPolicyChoices?.mainPolicyChoices?.policyId;
  addAddonPolicies(
    policyOptions?.parentalPolicyChoices?.addonChoices || [],
    parentalMainPolicyId ? Number(parentalMainPolicyId) : undefined,
    "parental"
  );

  // ✅ Add the `group` key dynamically
  //
  // component.type for the parental main component is populated
  // inconsistently across environments ("parental" in some, "optional" in
  // others), so a p.type === "parental" filter can't be trusted. Use the
  // actual resolved main-policy ids instead, which unambiguously identify
  // the base vs parental main components regardless of their type.
  const resolvedBaseMainId = baseMainPolicyId ? Number(baseMainPolicyId) : undefined;
  const resolvedParentalMainId = parentalMainPolicyId ? Number(parentalMainPolicyId) : undefined;
  const baseIds = new Set(
    finalPolicies
      .filter((p) => p.type === "base" || Number(p.id) === resolvedBaseMainId)
      .map((p) => p.id)
  );
  const parentalIds = new Set(
    finalPolicies
      .filter((p) => Number(p.id) === resolvedParentalMainId)
      .map((p) => p.id)
  );

  const policiesWithGroup = finalPolicies.map((item) => {
    let group = "none"; // default

    if (Number(item.id) === resolvedBaseMainId) {
      group = "base";
    } else if (Number(item.id) === resolvedParentalMainId) {
      group = "parental";
    } else if (baseIds.has(item?.parentpolicyComponentActionTypeId)) {
      group = "base";
    } else if (parentalIds.has(item?.parentpolicyComponentActionTypeId)) {
      group = "parental";
    } else if (item.sectionGroup) {
      group = item.sectionGroup;
    }

    return { ...item, group };
  });

  return policiesWithGroup;
}

export function generatePolicyStructure(
  overAllPolicies: any[],
  additionalDetails: Record<string, unknown> = getAdditionalDetailsFromStorage()
): FinalPolicy[] {
  const allPolicies: FinalPolicy[] = [];

  overAllPolicies.forEach((policyItem) => {
    const { policyId, policyName, configuration } = policyItem || {};
    const config: ResponseType | undefined =
      configuration?.policyComponentsConfiguration;
    const policyOptions = config?.availablePolicyChoices;
    const employeeChosenChoices = Array.isArray(
      configuration?.employeeChosenChoices
    )
      ? configuration.employeeChosenChoices
      : [];

    if (!config) return;

    const componentsMap = new Map<
      string,
      {
        label: string;
        type: string;
        premiumPerLife: boolean;
        showCompanyContribution: boolean;
        sumInsuredModel?: string;
        siMultipleLabel?: string;
        siMultipleMin?: number;
        siMultipleMax?: number;
        proRationEnabled?: boolean;
        isBenefitComponent?: boolean;
        acceptRelationsFromParent?: boolean;
        isOptional?: boolean;
      }
    >();

    config?.components?.forEach((component) => {
      componentsMap.set(component.id, {
        label: component.label,
        type: component.type,
        premiumPerLife: component.premiumPerLife,
        showCompanyContribution: component.showCompanyContribution,
        proRationEnabled: component.proRationEnabled,
        isBenefitComponent: component.isBenefitComponent,
        acceptRelationsFromParent: component.acceptRelationsFromParent,
        isOptional: component.isOptional,
        sumInsuredModel: component.sumInsuredModel,
        siMultipleLabel: component.siMultipleLabel,
        siMultipleMin: toOptionalNumber(component.siMultipleMin),
        siMultipleMax: toOptionalNumber(component.siMultipleMax),
      });
    });

    const finalPolicies: FinalPolicy[] = [];

    const getSumInsuredValue = (
      policyId: string,
      sumInsuredId?: number
    ): string => {
      return (
        config?.components
          ?.find((comp) => comp.id === policyId)
          ?.sumInsuredOptions?.find((opt) => opt.id === sumInsuredId)?.value ??
        "00"
      );
    };

    const transformChoices = (
      policyChoiceId: string,
      choices: any[],
      parentpolicyComponentActionTypeId?: number
    ) => {
      const componentData = componentsMap.get(policyChoiceId);
      const label = componentData?.label || "";
      const type = componentData?.type || "";
      const showCompanyContribution = componentData?.showCompanyContribution;
      const isBenefitComponent = componentData?.isBenefitComponent;
      const isOptional = componentData?.isOptional;
      const sumInsuredModel = componentData?.sumInsuredModel?.toUpperCase();
      const siMultipleLabel = componentData?.siMultipleLabel;
      const siMultipleMin = componentData?.siMultipleMin;
      const siMultipleMax = componentData?.siMultipleMax;

      const multipleFactorValue = siMultipleLabel
        ? toNumber(additionalDetails?.[siMultipleLabel])
        : Number.NaN;

      return choices.map((choice) => {
        // Prefer the choice's own sumInsured/premiumPerLife when explicitly present —
        // the backend overrides these per-choice for dependent-count-aware policies
        // (base SI + count-band enhancement, and premiumPerLife=false once a per-life
        // sum has already been computed) — only fall back to the static lookup/component
        // default when the choice doesn't specify them at all.
        const choiceSumInsuredNumeric = toOptionalNumber(choice.sumInsured);
        const sumInsuredValue =
          choiceSumInsuredNumeric !== undefined && choiceSumInsuredNumeric > 0
            ? String(choiceSumInsuredNumeric)
            : getSumInsuredValue(policyChoiceId, choice.sumInsuredId);
        const sumInsuredNumeric = toNumber(sumInsuredValue);
        const rawSumInsured = Number.isNaN(sumInsuredNumeric)
          ? undefined
          : sumInsuredNumeric;
        const premiumPerLife =
          choice.premiumPerLife !== undefined && choice.premiumPerLife !== null
            ? Boolean(choice.premiumPerLife)
            : Boolean(componentData?.premiumPerLife);

        const baseCompanyContribution = Number(choice.companyContribution ?? 0);
        const baseEmployeeContribution = Number(
          choice.employeeContribution ?? 0
        );

        let adjustedCompanyContribution = baseCompanyContribution;
        let adjustedEmployeeContribution = baseEmployeeContribution;
        let adjustedSumInsuredValue = sumInsuredValue;

        const shouldApplyMultiple =
          sumInsuredModel === "MULTIPLE" &&
          !Number.isNaN(multipleFactorValue) &&
          multipleFactorValue > 0 &&
          !Number.isNaN(sumInsuredNumeric) &&
          sumInsuredNumeric > 0;

        if (shouldApplyMultiple) {
          const scaledSumInsured = sumInsuredNumeric * multipleFactorValue;
          let boundedSumInsured = scaledSumInsured;

          if (
            typeof siMultipleMin === "number" &&
            !Number.isNaN(siMultipleMin) &&
            boundedSumInsured < siMultipleMin
          ) {
            boundedSumInsured = siMultipleMin;
          }

          if (
            typeof siMultipleMax === "number" &&
            !Number.isNaN(siMultipleMax) &&
            boundedSumInsured > siMultipleMax
          ) {
            boundedSumInsured = siMultipleMax;
          }

          if (!Number.isNaN(boundedSumInsured) && boundedSumInsured > 0) {
            const multiplier = boundedSumInsured / 1000;
            adjustedCompanyContribution = roundToTwoDecimals(
              baseCompanyContribution * multiplier
            );
            adjustedEmployeeContribution = roundToTwoDecimals(
              baseEmployeeContribution * multiplier
            );
            adjustedSumInsuredValue = String(
              roundToTwoDecimals(boundedSumInsured)
            );
          }
        }

        const premium = roundToTwoDecimals(
          adjustedCompanyContribution + adjustedEmployeeContribution
        );

        return {
          ...choice,
          companyContribution: adjustedCompanyContribution,
          companyPay: adjustedCompanyContribution,
          employeeContribution: adjustedEmployeeContribution,
          employeePay: adjustedEmployeeContribution,
          rawSumInsured,
          policyComponentActionType: type,
          policyComponentActionTypeId: Number(policyChoiceId),
          policyComponentActionLabel: label,
          premium,
          sumInsured: adjustedSumInsuredValue,
          ...(parentpolicyComponentActionTypeId && {
            parentpolicyComponentActionTypeId,
          }),
          premiumPerLife,
          showCompanyContribution,
          isBenefitComponent,
          isOptional,
          policyId,
          policyName,
        };
      });
    };

    const addPolicy = (
      policyData: any,
      parentpolicyComponentActionTypeId?: number,
      sectionGroup?: "base" | "parental"
    ) => {
      if (!policyData?.policyId) return;

      const compMeta = componentsMap.get(policyData.policyId);
      finalPolicies.push({
        id: policyData.policyId,
        label: compMeta?.label,
        type: compMeta?.type,
        policyTypeKey: policyData.policyTypeKey ?? policyItem?.policyTypeKey,
        parentpolicyComponentActionTypeId,
        isBenefitComponent: compMeta?.isBenefitComponent,
        acceptRelationsFromParent: compMeta?.acceptRelationsFromParent,
        isOptional: compMeta?.isOptional,
        sectionGroup,
        choices: transformChoices(
          policyData.policyId,
          policyData.choices,
          parentpolicyComponentActionTypeId
        ),
        policyId,
        policyName,
      });
    };

    const addAddonPolicies = (
      addons: any[],
      parentalPolicyComponentActionTypeId?: number,
      sectionGroup?: "base" | "parental"
    ) => {
      addons?.forEach((addon) =>
        addPolicy(addon, parentalPolicyComponentActionTypeId, sectionGroup)
      );
    };

    const hasStructuredChoices =
      Boolean(policyOptions?.basePolicyChoices?.mainPolicyChoices?.policyId) ||
      Boolean(
        policyOptions?.parentalPolicyChoices?.mainPolicyChoices?.policyId
      );

    if (hasStructuredChoices) {
      // Base main + addons
      addPolicy(policyOptions?.basePolicyChoices?.mainPolicyChoices, undefined, "base");
      const baseMainPolicyId =
        policyOptions?.basePolicyChoices?.mainPolicyChoices?.policyId;
      addAddonPolicies(
        policyOptions?.basePolicyChoices?.addonChoices || [],
        baseMainPolicyId ? Number(baseMainPolicyId) : undefined,
        "base"
      );

      // Parental main + addons
      addPolicy(policyOptions?.parentalPolicyChoices?.mainPolicyChoices, undefined, "parental");
      const parentalMainPolicyId =
        policyOptions?.parentalPolicyChoices?.mainPolicyChoices?.policyId;
      addAddonPolicies(
        policyOptions?.parentalPolicyChoices?.addonChoices || [],
        parentalMainPolicyId ? Number(parentalMainPolicyId) : undefined,
        "parental"
      );
    } else if (employeeChosenChoices.length > 0) {
      // Fallback for relationship-group policies when availablePolicyChoices is temporarily empty.
      const fallbackMap = new Map<string, any>();

      employeeChosenChoices.forEach((choice: any) => {
        const componentId = Number(choice?.policyComponentActionTypeId);
        if (!Number.isFinite(componentId)) return;

        const componentKey = String(componentId);
        const parentId = choice?.parentpolicyComponentActionTypeId
          ? Number(choice.parentpolicyComponentActionTypeId)
          : undefined;
        const groupKey = `${componentKey}|${parentId ?? "null"}`;
        const componentData = componentsMap.get(componentKey);

        if (!fallbackMap.has(groupKey)) {
          fallbackMap.set(groupKey, {
            id: componentId,
            label:
              componentData?.label ||
              choice?.policyComponentActionLabel ||
              "Policy",
            type:
              componentData?.type ||
              choice?.policyComponentActionType ||
              "base",
            policyTypeKey: policyItem?.policyTypeKey,
            parentpolicyComponentActionTypeId: parentId,
            choices: [],
            policyId,
            policyName,
          });
        }

        const companyContribution = Number(
          choice?.companyPay ?? choice?.companyContribution ?? 0
        );
        const employeeContribution = Number(
          choice?.employeePay ?? choice?.employeeContribution ?? 0
        );
        const premium = Number(
          choice?.premium ?? companyContribution + employeeContribution
        );
        const sumInsured = String(choice?.sumInsured ?? "0");
        const rawSumInsured = toOptionalNumber(sumInsured) ?? 0;

        const component = config?.components?.find(
          (comp) => Number(comp?.id) === componentId
        );
        const matchedSumInsuredOption = component?.sumInsuredOptions?.find(
          (opt) => Number(opt?.value) === Number(sumInsured)
        );

        fallbackMap.get(groupKey).choices.push({
          id: choice?.id,
          sumInsuredId: matchedSumInsuredOption?.id,
          sumInsured,
          rawSumInsured,
          premium,
          companyContribution,
          companyPay: companyContribution,
          employeeContribution,
          employeePay: employeeContribution,
          policyComponentActionType:
            choice?.policyComponentActionType || componentData?.type,
          policyComponentActionTypeId: componentId,
          policyComponentActionLabel:
            choice?.policyComponentActionLabel || componentData?.label,
          parentpolicyComponentActionTypeId: parentId,
          premiumPerLife:
            componentData?.premiumPerLife ?? Boolean(choice?.premiumPerLife),
          showCompanyContribution:
            componentData?.showCompanyContribution !== false,
          policyId,
          policyName,
          isAvailable: true,
          isDefault: true,
        });
      });

      finalPolicies.push(...Array.from(fallbackMap.values()));
    }

    // Add dynamic group
    //
    // component.type for the parental main component is populated
    // inconsistently across environments ("parental" in some, "optional" in
    // others), so a p.type === "parental" filter can't be trusted. Resolve
    // the real main-policy ids from the template instead, which works in
    // both the structured-choices and fallback branches above.
    const resolvedBaseMainId = toOptionalNumber(
      (config as any)?.policyTemplate?.basePolicy?.mainPolicyId
    );
    const resolvedParentalMainId = toOptionalNumber(
      (config as any)?.policyTemplate?.parentalPolicy?.mainPolicyId
    );
    const baseIds = new Set(
      finalPolicies
        .filter((p) => p.type === "base" || Number(p.id) === resolvedBaseMainId)
        .map((p) => p.id)
    );
    const parentalIds = new Set(
      finalPolicies
        .filter((p) => Number(p.id) === resolvedParentalMainId)
        .map((p) => p.id)
    );

    const policiesWithGroup = finalPolicies.map((item) => {
      let group = "none";
      if (Number(item.id) === resolvedBaseMainId) group = "base";
      else if (Number(item.id) === resolvedParentalMainId) group = "parental";
      else if (baseIds.has(item?.parentpolicyComponentActionTypeId))
        group = "base";
      else if (parentalIds.has(item?.parentpolicyComponentActionTypeId))
        group = "parental";
      else if (item.sectionGroup) group = item.sectionGroup;
      return { ...item, group };
    });

    allPolicies.push(...policiesWithGroup);
  });

  return allPolicies;
}
