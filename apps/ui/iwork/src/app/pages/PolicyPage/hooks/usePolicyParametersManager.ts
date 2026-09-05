import { useState, useCallback, useEffect, useRef } from "react";
import {
  ConfiguredPolicyParameter,
  DependentAttributeDetailConfig,
  DependentAttributeListOption,
  DependentAttributeRangeBand,
  DependentCountBandConfig,
  DependentCountDetailConfig,
  MaxDependentCountOption,
  LovDetailConfig,
  PolicyParameterMaster,
  RangeDetailConfig,
  RelationGroupDetailConfig,
  RelationTypeConfig,
} from "../PolicyConfigurator/policytypes";

export interface PolicyParameterFormErrors {
  [parameterId: string]: {
    displayName?: string;
    rangeDetails?: {
      [rangeDetailId: string]: {
        rangeDisplayName?: string;
        min?: string;
        max?: string;
        general?: string; // For errors like min > max
      };
    };
    lovDetails?: {
      [lovDetailId: string]: {
        value?: string;
      };
    };
    relationGroupDetails?: {
      [groupDetailId: string]: {
        groupDisplayName?: string;
        familyMaxCount?: string;
      };
    };
    dependentAttributeConfig?: {
      targetRelationCategory?: string;
      attributeKind?: string;
      targetAttributeName?: string;
      rangeBands?: {
        [bandId: string]: {
          displayName?: string;
          min?: string;
          max?: string;
          general?: string;
          companyAdditionalPremium?: string;
          employeeAdditionalPremium?: string;
        };
      };
      listOptions?: {
        [optId: string]: {
          value?: string;
          companyAdditionalPremium?: string;
          employeeAdditionalPremium?: string;
        };
      };
    };
    maxDependentCountConfig?: {
      general?: string;
      options?: {
        [optionId: string]: {
          label?: string;
          max?: string;
        };
      };
    };
  };
}
export interface PolicyParametersManager {
  configuredParameters: ConfiguredPolicyParameter[];
  setConfiguredParameters: React.Dispatch<
    React.SetStateAction<ConfiguredPolicyParameter[]>
  >;
  selectedMasterParamNameToAdd: string;
  setSelectedMasterParamNameToAdd: React.Dispatch<React.SetStateAction<string>>;
  formErrors: PolicyParameterFormErrors;
  handleAddConfiguredParameterWithSelection: (
    masterParamName: string,
    enabledPolicyRelations: RelationTypeConfig[]
  ) => void;
  onRemoveConfiguredParameter: (parameterId: string) => void;
  onConfiguredParameterDisplayNameChange: (
    parameterId: string,
    newDisplayName: string
  ) => void;
  onAddRangeDetail: (parameterId: string) => void;
  onRemoveRangeDetail: (parameterId: string, rangeDetailId: string) => void;
  onRangeDetailChange: (
    parameterId: string,
    rangeDetailId: string,
    field: keyof Omit<RangeDetailConfig, "id">,
    value: string
  ) => void;
  onAddLovDetail: (parameterId: string) => void;
  onRemoveLovDetail: (parameterId: string, lovDetailId: string) => void;
  onLovDetailChange: (
    parameterId: string,
    lovDetailId: string,
    value: string
  ) => void;
  onAddRelationGroupDetail: (
    parameterId: string,
    enabledPolicyRelations: RelationTypeConfig[]
  ) => void;
  onRemoveRelationGroupDetail: (
    parameterId: string,
    groupDetailId: string
  ) => void;
  onRelationGroupDisplayNameChange: (
    parameterId: string,
    groupDetailId: string,
    newName: string
  ) => void;
  onRelationSelectionChange: (
    parameterId: string,
    groupDetailId: string,
    relationName: string,
    isSelected: boolean
  ) => void;
  onRelationMaxCountChange: (
    parameterId: string,
    groupDetailId: string,
    relationName: string,
    count: string
  ) => void;
  onRelationGroupFamilyMaxCountChange: (
    parameterId: string,
    groupDetailId: string,
    count: string
  ) => void;
  clearRelationGroupParameters: () => void;
  validateParameters: () => boolean;
  onApplyToDependentsChange: (parameterId: string, checked: boolean) => void;
  onTargetCategoryChange: (parameterId: string, category: string) => void;
  onAddCountBand: (parameterId: string) => void;
  onRemoveCountBand: (parameterId: string, bandId: string) => void;
  onCountBandChange: (
    parameterId: string,
    bandId: string,
    field: keyof DependentCountBandConfig,
    value: string | null
  ) => void;
  onAddMaxDependentCountOption: (parameterId: string) => void;
  onRemoveMaxDependentCountOption: (parameterId: string, optionId: string) => void;
  onMaxDependentCountOptionChange: (
    parameterId: string,
    optionId: string,
    field: keyof MaxDependentCountOption,
    value: string
  ) => void;
  onDependentAttributeTargetCategoryChange: (parameterId: string, category: string) => void;
  onDependentAttributeKindChange: (parameterId: string, kind: "range" | "list") => void;
  onDependentAttributeNameChange: (parameterId: string, name: string) => void;
  onAddDependentAttributeRangeBand: (parameterId: string) => void;
  onAddDependentAttributeListOption: (parameterId: string) => void;
  onDependentAttributeBandChange: (
    parameterId: string,
    bandId: string,
    field: keyof Omit<DependentAttributeRangeBand, "id">,
    value: string | null
  ) => void;
  onDependentAttributeOptionChange: (
    parameterId: string,
    optId: string,
    field: keyof Omit<DependentAttributeListOption, "id">,
    value: string
  ) => void;
  onRemoveDependentAttributeBand: (parameterId: string, bandId: string) => void;
  onRemoveDependentAttributeOption: (parameterId: string, optId: string) => void;
}

// Define a recursive type for the error object structure to avoid 'any'
type ErrorNode = {
  [key: string]: string | ErrorNode | undefined;
};

export function usePolicyParametersManager(
  initialDataProp?: ConfiguredPolicyParameter[]
): PolicyParametersManager {
  const [configuredParameters, setConfiguredParameters] = useState<
    ConfiguredPolicyParameter[]
  >([]);
  const [selectedMasterParamNameToAdd, setSelectedMasterParamNameToAdd] =
    useState<string>("");
  const [nextConfiguredParameterId, setNextConfiguredParameterId] =
    useState<number>(1);
  const [formErrors, setFormErrors] = useState<PolicyParameterFormErrors>({});
  const isInitialized = useRef(false); // Track if initialization has happened

  // Effect to initialize state from the prop on the first render with data
  useEffect(() => {
    // Only initialize if we have initial data and haven't initialized yet
    // We check initialDataProp.length > 0 to avoid initializing with empty data
    // if the parent starts with an empty array before fetching.
    if (
      !isInitialized.current &&
      initialDataProp &&
      initialDataProp.length > 0
    ) {
      console.log(
        "usePolicyParametersManager: Performing initial state setup from prop."
      );

      // Ensure all detail arrays are initialized if not present in data
      // and calculate next IDs based on loaded data if not provided.
      const sanitizedData = initialDataProp.map((param) => ({
        ...param,
        rangeDetails: param.rangeDetails || [],
        lovDetails: param.lovDetails || [],
        relationGroupDetails: param.relationGroupDetails || [],
        nextRangeDetailId:
          param.nextRangeDetailId ||
          Math.max(
            0,
            ...(param.rangeDetails?.map((rd) =>
              parseInt(rd.id.split("-")[1])
            ) || [0])
          ) + 1,
        nextLovDetailId:
          param.nextLovDetailId ||
          Math.max(
            0,
            ...(param.lovDetails?.map((ld) =>
              parseInt(ld.id.split("-")[1])
            ) || [0])
          ) + 1,
        nextRelationGroupDetailId:
          param.nextRelationGroupDetailId ||
          Math.max(
            0,
            ...(param.relationGroupDetails?.map((rgd) =>
              parseInt(rgd.id.split("-")[1])
            ) || [0])
          ) + 1,
        // Only normalize when a config object is present but partially populated
        // (e.g. a legacy row or partial backend rollout) — leave it undefined
        // when absent entirely so validation can still flag it as unconfigured.
        dependentAttributeConfig: param.dependentAttributeConfig
          ? {
              ...param.dependentAttributeConfig,
              rangeBands: param.dependentAttributeConfig.rangeBands || [],
              listOptions: param.dependentAttributeConfig.listOptions || [],
              nextBandId:
                param.dependentAttributeConfig.nextBandId ||
                Math.max(
                  0,
                  ...(param.dependentAttributeConfig.rangeBands?.map((b) =>
                    parseInt(b.id.split("-")[2], 10)
                  ) || [0])
                ) + 1,
              nextOptionId:
                param.dependentAttributeConfig.nextOptionId ||
                Math.max(
                  0,
                  ...(param.dependentAttributeConfig.listOptions?.map((o) =>
                    parseInt(o.id.split("-")[2], 10)
                  ) || [0])
                ) + 1,
            }
          : param.dependentAttributeConfig,
      }));
      setConfiguredParameters(sanitizedData);

      let maxParamIdNum = 0;
      sanitizedData.forEach((p) => {
        if (p.id.startsWith("param-")) {
          const numPart = parseInt(p.id.split("-")[1], 10);
          if (!isNaN(numPart) && numPart > maxParamIdNum) {
            maxParamIdNum = numPart;
          }
        }
      });
      setNextConfiguredParameterId(maxParamIdNum + 1);
      setFormErrors({}); // Clear errors on initial load
      isInitialized.current = true; // Mark as initialized
    }
  }, [initialDataProp]); // Dependency array includes the prop

  // Remove the old initializeData function as its logic is now in the useEffect above
  /*
  const initializeData = useCallback((data?: ConfiguredPolicyParameter[]) => {
    if (data) {
      // Ensure all detail arrays are initialized if not present in data
      const sanitizedData = data.map(param => ({
        ...param,
        rangeDetails: param.rangeDetails || [],
        lovDetails: param.lovDetails || [],
        relationGroupDetails: param.relationGroupDetails || [],
        // Ensure next...Id fields are present, defaulting if necessary
        // This assumes API data might be incomplete for these counters per item
        nextRangeDetailId: param.nextRangeDetailId || Math.max(0, ...(param.rangeDetails?.map(rd => parseInt(rd.id.split('-')[1])) || [0])) + 1,
        nextLovDetailId: param.nextLovDetailId || Math.max(0, ...(param.lovDetails?.map(ld => parseInt(ld.id.split('-')[1])) || [0])) + 1,
        nextRelationGroupDetailId: param.nextRelationGroupDetailId || Math.max(0, ...(param.relationGroupDetails?.map(rgd => parseInt(rgd.id.split('-')[1])) || [0])) + 1,
      }));
      setConfiguredParameters(sanitizedData);

      let maxParamIdNum = 0;
      sanitizedData.forEach(p => {
        if (p.id.startsWith("param-")) {
          const numPart = parseInt(p.id.split("-")[1], 10);
          if (!isNaN(numPart) && numPart > maxParamIdNum) {
            maxParamIdNum = numPart;
          }
        }
      });
      setNextConfiguredParameterId(maxParamIdNum + 1);

    } else {
      setConfiguredParameters([]);
      setNextConfiguredParameterId(1);
    }
    setFormErrors({});
  }, []); // setConfiguredParameters, setNextConfiguredParameterId, setFormErrors are stable
  */
  const parseNumeric = useCallback(
    (value: string | undefined | null): number | undefined => {
      if (value === undefined || value === null || String(value).trim() === "")
        return undefined;
      const num = parseFloat(String(value).replace(/,/g, ""));
      return isNaN(num) ? undefined : num;
    },
    []
  );

  // Helper to clear a specific error path
  const clearErrorAtPath = useCallback(
    (paramId: string, ...fieldPath: string[]) => {
      setFormErrors((prev) => {
        const newErrors = { ...prev }; // Start with a copy of the existing errors

        // If there's no error for this parameter ID, nothing to clear
        if (!newErrors[paramId]) return newErrors;

        // If no fieldPath is provided, clear all errors for this parameter
        if (fieldPath.length === 0) {
          delete newErrors[paramId];
          return newErrors;
        }

        // Traverse the fieldPath to find and delete the specific error
        // currentLevel will point to parts of the error structure for a specific parameterId.
        let currentLevel: ErrorNode = newErrors[paramId];
        for (let i = 0; i < fieldPath.length - 1; i++) {
          const pathSegment = fieldPath[i];
          const nextLevel = currentLevel[pathSegment];

          // We can only traverse deeper if the next level is an object.
          if (typeof nextLevel === "object" && nextLevel !== null) {
            currentLevel = nextLevel;
          } else {
            // nextLevel is a string, undefined, or null (though null is covered by typeof check).
            // We cannot traverse further down this path.
            // Path segment does not point to a nested object, or is undefined/string.
            // This means we can't traverse further to delete a more deeply nested error.
            return newErrors; // Return original errors as path is invalid for deletion.
          }
        }
        // Delete the error at the final level
        delete currentLevel[fieldPath[fieldPath.length - 1]];
        return newErrors;
      });
    },
    []
  );

  const handleAddConfiguredParameterWithSelection = useCallback(
    (
      masterParamName: string,
      currentEnabledRelations: RelationTypeConfig[]
    ) => {
      if (!masterParamName) return;
      const masterEntry = PolicyParameterMaster.find(
        (m) => m.name === masterParamName
      );
      if (!masterEntry) return;

      const newConfiguredParameter: ConfiguredPolicyParameter = {
        id: `param-${nextConfiguredParameterId}`,
        parameterMasterName: masterParamName,
        type: masterEntry.type as "range" | "list" | "relation" | "dependent-count" | "dependent-attribute" | "max-dependent-count",
        displayName: masterParamName,
        rangeDetails: [],
        nextRangeDetailId: 1,
        lovDetails: [],
        nextLovDetailId: 1,
        relationGroupDetails: [],
        nextRelationGroupDetailId: 1,
      };

      if (masterEntry.type === "range") {
        newConfiguredParameter.rangeDetails = [
          {
            id: `r-${newConfiguredParameter.nextRangeDetailId++}`,
            rangeDisplayName: "",
            min: "",
            max: "",
          },
        ];
      } else if (masterEntry.type === "list" && masterEntry.values) {
        newConfiguredParameter.lovDetails = masterEntry.values.map((val) => ({
          id: `lov-${newConfiguredParameter.nextLovDetailId++}`,
          value: val,
          isDefault: true,
        }));
      } else if (masterEntry.type === "dependent-count") {
        newConfiguredParameter.dependentCountConfig = {
          targetRelationCategory: "",
          countBands: [
            { id: "cb-1", displayName: "", minCount: "0", maxCount: null, siEnhancement: "0" },
          ],
          nextCountBandId: 2,
        };
      } else if (masterEntry.type === "dependent-attribute") {
        newConfiguredParameter.dependentAttributeConfig = {
          targetRelationCategory: "",
          attributeKind: "range",
          targetAttributeName: "",
          rangeBands: [],
          listOptions: [],
          nextBandId: 1,
          nextOptionId: 1,
        };
      } else if (masterEntry.type === "max-dependent-count") {
        newConfiguredParameter.maxDependentCountConfig = {
          options: [{ id: "mdc-1", label: "", max: "" }],
          nextOptionId: 2,
        };
      } else if (masterEntry.type === "relation" && masterEntry.values) {
        const newRelationGroup: RelationGroupDetailConfig = {
          id: `rg-${newConfiguredParameter.nextRelationGroupDetailId++}`,
          groupDisplayName: `Group 1`,
          selectedRelations: currentEnabledRelations.map((enabledRel) => ({
            name: enabledRel.type,
            selected: enabledRel.type === "Self",
            maxCount: enabledRel.type === "Self" ? "1" : "",
          })),
          familyMaxCount: currentEnabledRelations
            .reduce((sum, val) => {
              const isSelf = val.type === "Self";
              return sum + (isSelf ? parseInt(val.maxCount, 10) || 1 : 0);
            }, 0)
            .toString(),
          familyMaxManuallySet: false,
        };
        newConfiguredParameter.relationGroupDetails = [newRelationGroup];
      }

      setConfiguredParameters((prev) => {
        const isRepeatable =
          masterParamName === "Custom Range" ||
          masterParamName === "Custom List" ||
          masterParamName === "Dependent Count" ||
          masterParamName === "Dependent Attribute";
        if (
          !isRepeatable &&
          prev.some((p) => p.parameterMasterName === masterParamName)
        ) {
          return prev; // Already added for non-repeatable parameters
        }
        return [...prev, newConfiguredParameter];
      });
      setNextConfiguredParameterId((prevId) => prevId + 1);
      setSelectedMasterParamNameToAdd("");
    },
    [nextConfiguredParameterId]
  ); // Depends on nextConfiguredParameterId

  const onRemoveConfiguredParameter = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.filter((p) => p.id !== parameterId)
      ),
    []
  );

  const onConfiguredParameterDisplayNameChange = useCallback(
    (parameterId: string, newDisplayName: string) => {
      clearErrorAtPath(parameterId, "displayName");
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId ? { ...p, displayName: newDisplayName } : p
        )
      );
    },
    [clearErrorAtPath]
  );

  const onAddRangeDetail = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            const newRangeDetail: RangeDetailConfig = {
              id: `r-${p.nextRangeDetailId}`,
              rangeDisplayName: "",
              min: "",
              max: "",
            };
            return {
              ...p,
              rangeDetails: [...p.rangeDetails, newRangeDetail],
              nextRangeDetailId: p.nextRangeDetailId + 1,
            };
          }
          return p;
        })
      ),
    []
  );

  const onRemoveRangeDetail = useCallback(
    (parameterId: string, rangeDetailId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            return {
              ...p,
              rangeDetails: p.rangeDetails.filter(
                (rd) => rd.id !== rangeDetailId
              ),
            };
          }
          return p;
        })
      ),
    []
  );

  const onRangeDetailChange = useCallback(
    (
      parameterId: string,
      rangeDetailId: string,
      field: keyof Omit<RangeDetailConfig, "id">,
      value: string
    ) => {
      const param = configuredParameters.find((p) => p.id === parameterId);
      const isAgeParam = param?.parameterMasterName === "Age";

      let processedValue: string;
      let error = "";

      if (field === "rangeDisplayName") {
        processedValue = value;
        error =
          processedValue.trim() === "" ? "Range display name is required." : "";
      } else if (field === "min" || field === "max") {
        // The component now handles input validation, so we just store the cleaned value
        processedValue = value;

        // For Age parameters, still apply range validation
        if (isAgeParam && processedValue !== "") {
          const numValue = parseFloat(processedValue);
          if (isNaN(numValue)) {
            error = "0-120";
          } else if (numValue < 0 || numValue > 120) {
            error = "0-120";
            processedValue = Math.min(Math.max(numValue, 0), 120).toString();
          }
        }
      } else {
        processedValue = value;
      }
      const rangeDetail = param?.rangeDetails.find(
        (rd) => rd.id === rangeDetailId
      );
      const otherField = field === "min" ? "max" : "min";
      const otherVal = parseNumeric(
        rangeDetail ? rangeDetail[otherField] : undefined
      );

      const valNum = parseNumeric(processedValue);

      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            return {
              ...p,
              rangeDetails: p.rangeDetails.map((rd) =>
                rd.id === rangeDetailId
                  ? { ...rd, [field]: processedValue }
                  : rd
              ),
            };
          }
          return p;
        })
      );

      setFormErrors((prev) => {
        const newErrors: PolicyParameterFormErrors = { ...prev };
        if (!newErrors[parameterId]) newErrors[parameterId] = {};
        if (!newErrors[parameterId].rangeDetails)
          newErrors[parameterId].rangeDetails = {};
        const detailErrors = {
          ...(newErrors[parameterId].rangeDetails![rangeDetailId] || {}),
        } as NonNullable<
          PolicyParameterFormErrors[string]["rangeDetails"]
        >[string];

        if (field === "min") {
          detailErrors.min = error || undefined;
          if (valNum !== undefined && otherVal !== undefined) {
            if (valNum >= otherVal) {
              detailErrors.min = "Min >= Max";
              detailErrors.max = "Max <= Min";
            } else if (detailErrors.max === "Max <= Min") {
              detailErrors.max = undefined;
            }
          }
        } else if (field === "max") {
          detailErrors.max = error || undefined;
          if (valNum !== undefined && otherVal !== undefined) {
            if (valNum <= otherVal) {
              detailErrors.max = "Max <= Min";
              detailErrors.min = "Min >= Max";
            } else if (detailErrors.min === "Min >= Max") {
              detailErrors.min = undefined;
            }
          }
        } else if (field === "rangeDisplayName") {
          detailErrors.rangeDisplayName = error || undefined;
        }

        // Clean up undefined values
        if (detailErrors.min === undefined) delete detailErrors.min;
        if (detailErrors.max === undefined) delete detailErrors.max;
        if (detailErrors.rangeDisplayName === undefined)
          delete detailErrors.rangeDisplayName;
        if (detailErrors.general === undefined) delete detailErrors.general;

        if (Object.keys(detailErrors).length > 0)
          newErrors[parameterId].rangeDetails![rangeDetailId] = detailErrors;
        else delete newErrors[parameterId].rangeDetails![rangeDetailId];

        return newErrors;
      });
    },
    [configuredParameters, parseNumeric]
  );

  const onAddLovDetail = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            const newLovDetail: LovDetailConfig = {
              id: `lov-${p.nextLovDetailId}`,
              value: "",
              isDefault: false,
            };
            return {
              ...p,
              lovDetails: [...p.lovDetails, newLovDetail],
              nextLovDetailId: p.nextLovDetailId + 1,
            };
          }
          return p;
        })
      ),
    []
  );

  const onRemoveLovDetail = useCallback(
    (parameterId: string, lovDetailId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            return {
              ...p,
              lovDetails: p.lovDetails.filter((ld) => ld.id !== lovDetailId),
            };
          }
          return p;
        })
      ),
    []
  );

  const onLovDetailChange = useCallback(
    (parameterId: string, lovDetailId: string, value: string) => {
      clearErrorAtPath(parameterId, "lovDetails", lovDetailId, "value");
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId
            ? {
                ...p,
                lovDetails: p.lovDetails.map((ld) =>
                  ld.id === lovDetailId ? { ...ld, value } : ld
                ),
              }
            : p
        )
      );
    },
    [clearErrorAtPath]
  );

  const onAddRelationGroupDetail = useCallback(
    (parameterId: string, currentEnabledRelations: RelationTypeConfig[]) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            const masterEntry = PolicyParameterMaster.find(
              (m) => m.name === p.parameterMasterName
            );
            if (masterEntry?.type === "relation" && masterEntry.values) {
              const newRelationGroup: RelationGroupDetailConfig = {
                id: `rg-${p.nextRelationGroupDetailId}`,
                groupDisplayName: `Group ${p.relationGroupDetails.length + 1}`,
                selectedRelations: currentEnabledRelations.map(
                  (enabledRel) => ({
                    name: enabledRel.type,
                    selected: enabledRel.type === "Self",
                    maxCount: enabledRel.type === "Self" ? "1" : "",
                  })
                ),
                familyMaxCount: currentEnabledRelations
                  .reduce((sum, val) => {
                    const isSelf = val.type === "Self";
                    return sum + (isSelf ? parseInt(val.maxCount, 10) || 1 : 0);
                  }, 0)
                  .toString(),
                familyMaxManuallySet: false,
              };
              return {
                ...p,
                relationGroupDetails: [
                  ...p.relationGroupDetails,
                  newRelationGroup,
                ],
                nextRelationGroupDetailId: p.nextRelationGroupDetailId + 1,
              };
            }
          }
          return p;
        })
      ),
    []
  ); // Depends on PolicyParameterMaster (constant import)

  const onRemoveRelationGroupDetail = useCallback(
    (parameterId: string, groupDetailId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            return {
              ...p,
              relationGroupDetails: p.relationGroupDetails.filter(
                (rgd) => rgd.id !== groupDetailId
              ),
            };
          }
          return p;
        })
      ),
    []
  );

  const onRelationGroupDisplayNameChange = useCallback(
    (parameterId: string, groupDetailId: string, newName: string) => {
      clearErrorAtPath(
        parameterId,
        "relationGroupDetails",
        groupDetailId,
        "groupDisplayName"
      );
      setConfiguredParameters((prevParams) =>
        prevParams.map((p) =>
          p.id === parameterId
            ? {
                ...p,
                relationGroupDetails: p.relationGroupDetails.map((rgd) =>
                  rgd.id === groupDetailId
                    ? { ...rgd, groupDisplayName: newName }
                    : rgd
                ),
              }
            : p
        )
      );
    },
    [clearErrorAtPath]
  ); // Corrected: This was for onRelationGroupDisplayNameChange

  const onRelationSelectionChange = useCallback(
    (
      parameterId: string,
      groupDetailId: string,
      relationName: string,
      isSelected: boolean
    ) => {
      if (relationName === "Self") return;
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id === parameterId) {
            return {
              ...p,
              relationGroupDetails: p.relationGroupDetails.map((rgd) => {
                if (rgd.id === groupDetailId) {
                  const updatedSelectedRelations = rgd.selectedRelations.map(
                    (sr) => {
                      if (sr.name === relationName) {
                        let newMaxCount = sr.maxCount;
                        if (!isSelected) newMaxCount = "";
                        return {
                          ...sr,
                          selected: isSelected,
                          maxCount: newMaxCount,
                        };
                      }
                      return sr;
                    }
                  );
                  let newFamilyMaxCount = rgd.familyMaxCount;
                  if (!rgd.familyMaxManuallySet) {
                    let sumOfSelectedRelationMaxCounts = 0;
                    updatedSelectedRelations.forEach((selRel) => {
                      if (
                        selRel.selected &&
                        selRel.maxCount &&
                        !isNaN(parseInt(selRel.maxCount, 10))
                      )
                        sumOfSelectedRelationMaxCounts += parseInt(
                          selRel.maxCount,
                          10
                        );
                    });
                    newFamilyMaxCount = String(sumOfSelectedRelationMaxCounts);
                  }
                  return {
                    ...rgd,
                    selectedRelations: updatedSelectedRelations,
                    familyMaxCount: newFamilyMaxCount,
                  };
                }
                return rgd;
              }),
            };
          }
          return p;
        })
      ); // Closing parenthesis for setConfiguredParameters
    },
    []
  ); // Corrected: Added closing brace for useCallback's arrow function

  const onRelationMaxCountChange = useCallback(
    (
      parameterId: string,
      groupDetailId: string,
      relationName: string,
      count: string
    ) => {
      if (relationName === "Self") return;
      let processedCount = count.replace(/[^0-9]/g, "");
      if (processedCount.length > 2)
        processedCount = processedCount.substring(0, 2);
      setConfiguredParameters((prevParams) =>
        prevParams.map((p) => {
          if (p.id === parameterId) {
            const updatedRelationGroupDetails = p.relationGroupDetails.map(
              (rgd) => {
                if (rgd.id === groupDetailId) {
                  const updatedSelectedRelations = rgd.selectedRelations.map(
                    (sr) =>
                      sr.name === relationName
                        ? { ...sr, maxCount: processedCount }
                        : sr
                  );
                  let newFamilyMaxCount = rgd.familyMaxCount;
                  if (!rgd.familyMaxManuallySet) {
                    let sumOfSelectedRelationMaxCounts = 0;
                    updatedSelectedRelations.forEach((selRel) => {
                      if (
                        selRel.selected &&
                        selRel.maxCount &&
                        !isNaN(parseInt(selRel.maxCount, 10))
                      )
                        sumOfSelectedRelationMaxCounts += parseInt(
                          selRel.maxCount,
                          10
                        );
                    });
                    newFamilyMaxCount = String(sumOfSelectedRelationMaxCounts);
                  }
                  return {
                    ...rgd,
                    selectedRelations: updatedSelectedRelations,
                    familyMaxCount: newFamilyMaxCount,
                  };
                }
                return rgd;
              }
            );
            return { ...p, relationGroupDetails: updatedRelationGroupDetails };
          }
          return p;
        })
      ); // Closing parenthesis for setConfiguredParameters
    },
    []
  ); // Corrected: Added closing brace for useCallback's arrow function

  const onRelationGroupFamilyMaxCountChange = useCallback(
    (parameterId: string, groupDetailId: string, count: string) => {
      clearErrorAtPath(
        parameterId,
        "relationGroupDetails",
        groupDetailId,
        "familyMaxCount"
      );
      let processedCount = count.replace(/[^0-9]/g, "");
      if (processedCount.length > 2)
        processedCount = processedCount.substring(0, 2);
      setConfiguredParameters((prevParams) =>
        prevParams.map((p) =>
          p.id === parameterId
            ? {
                ...p,
                relationGroupDetails: p.relationGroupDetails.map((rgd) =>
                  rgd.id === groupDetailId
                    ? {
                        ...rgd,
                        familyMaxCount: processedCount,
                        familyMaxManuallySet: true,
                      }
                    : rgd
                ),
              }
            : p
        )
      );
    },
    [clearErrorAtPath]
  );

  const onApplyToDependentsChange = useCallback(
    (parameterId: string, checked: boolean) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId ? { ...p, applyToDependents: checked } : p
        )
      ),
    []
  );

  const onTargetCategoryChange = useCallback(
    (parameterId: string, category: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentCountConfig
            ? {
                ...p,
                dependentCountConfig: {
                  ...p.dependentCountConfig,
                  targetRelationCategory: category,
                },
              }
            : p
        )
      ),
    []
  );

  const onAddCountBand = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id !== parameterId || !p.dependentCountConfig) return p;
          const cfg = p.dependentCountConfig;
          const lastBand = cfg.countBands[cfg.countBands.length - 1];
          const newMin =
            lastBand && lastBand.maxCount !== null
              ? String(parseInt(lastBand.maxCount) + 1)
              : "";
          const newBand: DependentCountBandConfig = {
            id: `cb-${cfg.nextCountBandId}`,
            displayName: "",
            minCount: newMin,
            maxCount: null,
            siEnhancement: "0",
          };
          return {
            ...p,
            dependentCountConfig: {
              ...cfg,
              countBands: [...cfg.countBands, newBand],
              nextCountBandId: cfg.nextCountBandId + 1,
            },
          };
        })
      ),
    []
  );

  const onRemoveCountBand = useCallback(
    (parameterId: string, bandId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentCountConfig
            ? {
                ...p,
                dependentCountConfig: {
                  ...p.dependentCountConfig,
                  countBands: p.dependentCountConfig.countBands.filter(
                    (b) => b.id !== bandId
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onCountBandChange = useCallback(
    (
      parameterId: string,
      bandId: string,
      field: keyof DependentCountBandConfig,
      value: string | null
    ) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentCountConfig
            ? {
                ...p,
                dependentCountConfig: {
                  ...p.dependentCountConfig,
                  countBands: p.dependentCountConfig.countBands.map((b) =>
                    b.id === bandId ? { ...b, [field]: value } : b
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onAddMaxDependentCountOption = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id !== parameterId || !p.maxDependentCountConfig) return p;
          const cfg = p.maxDependentCountConfig;
          const newOption: MaxDependentCountOption = {
            id: `mdc-${cfg.nextOptionId}`,
            label: "",
            max: "",
          };
          return {
            ...p,
            maxDependentCountConfig: {
              ...cfg,
              options: [...cfg.options, newOption],
              nextOptionId: cfg.nextOptionId + 1,
            },
          };
        })
      ),
    []
  );

  const onRemoveMaxDependentCountOption = useCallback(
    (parameterId: string, optionId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.maxDependentCountConfig
            ? {
                ...p,
                maxDependentCountConfig: {
                  ...p.maxDependentCountConfig,
                  options: p.maxDependentCountConfig.options.filter(
                    (o) => o.id !== optionId
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onMaxDependentCountOptionChange = useCallback(
    (
      parameterId: string,
      optionId: string,
      field: keyof MaxDependentCountOption,
      value: string
    ) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.maxDependentCountConfig
            ? {
                ...p,
                maxDependentCountConfig: {
                  ...p.maxDependentCountConfig,
                  options: p.maxDependentCountConfig.options.map((o) =>
                    o.id === optionId ? { ...o, [field]: value } : o
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  // --- Dependent Attribute handlers (T-03) ---

  const onDependentAttributeTargetCategoryChange = useCallback(
    (parameterId: string, category: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? { ...p, dependentAttributeConfig: { ...p.dependentAttributeConfig, targetRelationCategory: category } }
            : p
        )
      ),
    []
  );

  const onDependentAttributeKindChange = useCallback(
    (parameterId: string, kind: "range" | "list") =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id !== parameterId || !p.dependentAttributeConfig) return p;
          // Only the active kind's array is validated/used at resolution time
          // (see validateParameters and resolveDependentAttributePremium), so the
          // inactive one is kept rather than discarded — an accidental toggle
          // shouldn't silently wipe out already-entered bands/options.
          return {
            ...p,
            dependentAttributeConfig: {
              ...p.dependentAttributeConfig,
              attributeKind: kind,
            },
          };
        })
      ),
    []
  );

  const onDependentAttributeNameChange = useCallback(
    (parameterId: string, name: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? { ...p, dependentAttributeConfig: { ...p.dependentAttributeConfig, targetAttributeName: name } }
            : p
        )
      ),
    []
  );

  const onAddDependentAttributeRangeBand = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id !== parameterId || !p.dependentAttributeConfig) return p;
          const cfg = p.dependentAttributeConfig;
          const newBand: DependentAttributeRangeBand = {
            id: `da-band-${cfg.nextBandId}`,
            displayName: "",
            min: "",
            max: null,
            companyAdditionalPremium: "0",
            employeeAdditionalPremium: "0",
          };
          return {
            ...p,
            dependentAttributeConfig: {
              ...cfg,
              rangeBands: [...cfg.rangeBands, newBand],
              nextBandId: cfg.nextBandId + 1,
            },
          };
        })
      ),
    []
  );

  const onAddDependentAttributeListOption = useCallback(
    (parameterId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) => {
          if (p.id !== parameterId || !p.dependentAttributeConfig) return p;
          const cfg = p.dependentAttributeConfig;
          const newOption: DependentAttributeListOption = {
            id: `da-opt-${cfg.nextOptionId}`,
            value: "",
            companyAdditionalPremium: "0",
            employeeAdditionalPremium: "0",
          };
          return {
            ...p,
            dependentAttributeConfig: {
              ...cfg,
              listOptions: [...cfg.listOptions, newOption],
              nextOptionId: cfg.nextOptionId + 1,
            },
          };
        })
      ),
    []
  );

  const onDependentAttributeBandChange = useCallback(
    (
      parameterId: string,
      bandId: string,
      field: keyof Omit<DependentAttributeRangeBand, "id">,
      value: string | null
    ) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? {
                ...p,
                dependentAttributeConfig: {
                  ...p.dependentAttributeConfig,
                  rangeBands: p.dependentAttributeConfig.rangeBands.map((b) =>
                    b.id === bandId ? { ...b, [field]: value } : b
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onDependentAttributeOptionChange = useCallback(
    (
      parameterId: string,
      optId: string,
      field: keyof Omit<DependentAttributeListOption, "id">,
      value: string
    ) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? {
                ...p,
                dependentAttributeConfig: {
                  ...p.dependentAttributeConfig,
                  listOptions: p.dependentAttributeConfig.listOptions.map((o) =>
                    o.id === optId ? { ...o, [field]: value } : o
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onRemoveDependentAttributeBand = useCallback(
    (parameterId: string, bandId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? {
                ...p,
                dependentAttributeConfig: {
                  ...p.dependentAttributeConfig,
                  rangeBands: p.dependentAttributeConfig.rangeBands.filter(
                    (b) => b.id !== bandId
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  const onRemoveDependentAttributeOption = useCallback(
    (parameterId: string, optId: string) =>
      setConfiguredParameters((prev) =>
        prev.map((p) =>
          p.id === parameterId && p.dependentAttributeConfig
            ? {
                ...p,
                dependentAttributeConfig: {
                  ...p.dependentAttributeConfig,
                  listOptions: p.dependentAttributeConfig.listOptions.filter(
                    (o) => o.id !== optId
                  ),
                },
              }
            : p
        )
      ),
    []
  );

  // --- End Dependent Attribute handlers ---

  const clearRelationGroupParameters = useCallback(() => {
    setConfiguredParameters((prevConfiguredParams) => {
      return prevConfiguredParams.map((param) => {
        const masterEntry = PolicyParameterMaster.find(
          (m) => m.name === param.parameterMasterName
        );
        if (masterEntry?.type === "relation") {
          console.log(
            `(Next Click) Clearing relation group details for parameter: ${param.displayName}`
          );
          return {
            ...param,
            relationGroupDetails: [],
            nextRelationGroupDetailId: 1,
          };
        }
        return param;
      });
    });
  }, []); // Depends on PolicyParameterMaster (constant import)

  const validateParameters = useCallback((): boolean => {
    const errors: PolicyParameterFormErrors = {};
    let allValid = true;

    configuredParameters.forEach((param) => {
      errors[param.id] = {};
      if (!param.displayName?.trim()) {
        errors[param.id].displayName = "Display name is required.";
        allValid = false;
      }

      if (param.type === "range") {
        const isAgeParam = param.parameterMasterName === "Age";
        errors[param.id].rangeDetails = {};
        param.rangeDetails.forEach((rd) => {
          errors[param.id].rangeDetails![rd.id] = {};
          // Make rangeDisplayName mandatory for highlighting example
          if (!rd.rangeDisplayName?.trim()) {
            errors[param.id].rangeDetails![rd.id].rangeDisplayName =
              "Range display name is required.";
            allValid = false;
          }
          const minVal = parseNumeric(rd.min);
          const maxVal = parseNumeric(rd.max);

          let minError: string | undefined;
          let maxError: string | undefined;

          // Min validation
          if (rd.min.trim() === "") {
            minError = "Required.";
            allValid = false;
          } else if (minVal === undefined) {
            minError = isAgeParam ? "0-120" : "Invalid";
            allValid = false;
          } else if (isAgeParam && (minVal < 0 || minVal > 120)) {
            minError = "0-120";
            allValid = false;
          } else if (maxVal !== undefined && minVal >= maxVal) {
            minError = "Min >= Max";
            allValid = false;
          } else {
            minError = undefined; // Clear error if valid
          }

          // Max validation
          if (rd.max.trim() === "") {
            maxError = "Required.";
            allValid = false;
          } else if (maxVal === undefined) {
            maxError = isAgeParam ? "0-120" : "Invalid";
            allValid = false;
          } else if (isAgeParam && (maxVal < 0 || maxVal > 120)) {
            maxError = "0-120";
            allValid = false;
          } else if (minVal !== undefined && maxVal <= minVal) {
            maxError = "Max <= Min";
            allValid = false;
          } else {
            maxError = undefined; // Clear error if valid
          }

          errors[param.id].rangeDetails![rd.id].min = minError;
          errors[param.id].rangeDetails![rd.id].max = maxError;
        });
      } else if (param.type === "list") {
        errors[param.id].lovDetails = {};
        param.lovDetails.forEach((ld) => {
          errors[param.id].lovDetails![ld.id] = {};
          if (!ld.value?.trim()) {
            errors[param.id].lovDetails![ld.id].value = "Value is required.";
            allValid = false;
          }
        });
      } else if (param.type === "dependent-count") {
        if (!param.dependentCountConfig) {
          allValid = false;
        } else {
          const { countBands, targetRelationCategory } = param.dependentCountConfig;
          if (!targetRelationCategory?.trim()) {
            allValid = false;
          }
          if (countBands.length === 0) {
            allValid = false;
          } else {
            const sorted = [...countBands].sort(
              (a, b) => parseInt(a.minCount || "0") - parseInt(b.minCount || "0")
            );
            if (parseInt(sorted[0].minCount) !== 0) allValid = false;
            for (let i = 0; i < sorted.length - 1; i++) {
              const curr = sorted[i];
              const next = sorted[i + 1];
              if (!curr.displayName?.trim()) allValid = false;
              if (curr.maxCount === null) { allValid = false; continue; }
              const currMax = parseInt(curr.maxCount);
              const nextMin = parseInt(next.minCount);
              if (currMax >= nextMin) allValid = false;
              if (currMax + 1 !== nextMin) allValid = false;
            }
            const lastBand = sorted[sorted.length - 1];
            if (!lastBand.displayName?.trim()) allValid = false;
            countBands.forEach((b) => {
              if (parseInt(b.siEnhancement || "0") < 0) allValid = false;
            });
          }
        }
      } else if (param.type === "dependent-attribute") {
        const daCfg = param.dependentAttributeConfig;
        if (!daCfg) { allValid = false; }
        else {
          errors[param.id].dependentAttributeConfig = {};
          const daErr = errors[param.id].dependentAttributeConfig!;
          if (!daCfg.targetRelationCategory?.trim()) {
            daErr.targetRelationCategory = "Target Relation Category is required";
            allValid = false;
          }
          if (!daCfg.attributeKind) {
            daErr.attributeKind = "Attribute Kind (Range or List) is required";
            allValid = false;
          }
          if (!daCfg.targetAttributeName?.trim()) {
            daErr.targetAttributeName = "Attribute Name is required";
            allValid = false;
          }
          if (daCfg.attributeKind === "range") {
            if (daCfg.rangeBands.length === 0) {
              daErr.rangeBands = {};
              allValid = false;
            } else {
              daErr.rangeBands = {};
              daCfg.rangeBands.forEach((band) => {
                daErr.rangeBands![band.id] = {};
                if (!band.displayName?.trim()) {
                  daErr.rangeBands![band.id].displayName = "Band name is required";
                  allValid = false;
                }
                if (!band.min?.trim() || isNaN(parseFloat(band.min))) {
                  daErr.rangeBands![band.id].min = "Minimum value must be a valid number";
                  allValid = false;
                }
                if (
                  band.min?.trim() &&
                  !isNaN(parseFloat(band.min)) &&
                  band.max !== null &&
                  band.max !== undefined &&
                  String(band.max).trim() &&
                  !isNaN(parseFloat(String(band.max))) &&
                  parseFloat(String(band.max)) < parseFloat(band.min)
                ) {
                  daErr.rangeBands![band.id].max = "Maximum value must be ≥ minimum value";
                  allValid = false;
                }
                const cPrem = parseFloat(band.companyAdditionalPremium);
                const ePrem = parseFloat(band.employeeAdditionalPremium);
                if (!isNaN(cPrem) && cPrem < 0) {
                  daErr.rangeBands![band.id].companyAdditionalPremium = "Premium amounts must be ≥ 0";
                  allValid = false;
                }
                if (!isNaN(ePrem) && ePrem < 0) {
                  daErr.rangeBands![band.id].employeeAdditionalPremium = "Premium amounts must be ≥ 0";
                  allValid = false;
                }
              });
              // Overlap and gap check (reuse numeric sort pattern from dependent-count).
              // Unlike dependent-count (always integer), DA attributes may be decimal
              // (e.g. BMI), so the "no gap" step is inferred from the decimal precision
              // actually used in the entered bounds instead of a hardcoded +1.
              const decimalPlaces = (val: string) => {
                const dot = val.indexOf(".");
                return dot === -1 ? 0 : val.length - dot - 1;
              };
              const maxDecimals = daCfg.rangeBands.reduce((acc, b) => {
                const minPlaces = b.min?.trim() ? decimalPlaces(b.min.trim()) : 0;
                const maxPlaces = b.max !== null && b.max !== undefined && String(b.max).trim()
                  ? decimalPlaces(String(b.max).trim())
                  : 0;
                return Math.max(acc, minPlaces, maxPlaces);
              }, 0);
              const step = Math.pow(10, -maxDecimals);
              const epsilon = step / 1000;
              const numericBands = daCfg.rangeBands
                .filter((b) => b.min?.trim() && !isNaN(parseFloat(b.min)))
                .map((b) => ({ id: b.id, min: parseFloat(b.min), max: b.max !== null ? parseFloat(String(b.max ?? "")) : null }))
                .sort((a, b) => a.min - b.min);
              for (let i = 0; i < numericBands.length - 1; i++) {
                const curr = numericBands[i];
                const next = numericBands[i + 1];
                if (curr.max === null) { daErr.rangeBands[curr.id] = { ...daErr.rangeBands[curr.id], general: "Range bands must not overlap" }; allValid = false; continue; }
                if (curr.max >= next.min) { daErr.rangeBands[curr.id] = { ...daErr.rangeBands[curr.id], general: "Range bands must not overlap" }; allValid = false; }
                else if (Math.abs(next.min - curr.max - step) > epsilon) { daErr.rangeBands[curr.id] = { ...daErr.rangeBands[curr.id], general: "Range bands must be contiguous (no gaps)" }; allValid = false; }
              }
            }
          } else if (daCfg.attributeKind === "list") {
            if (daCfg.listOptions.length === 0) {
              daErr.listOptions = {};
              allValid = false;
            } else {
              daErr.listOptions = {};
              daCfg.listOptions.forEach((opt) => {
                daErr.listOptions![opt.id] = {};
                if (!opt.value?.trim()) {
                  daErr.listOptions![opt.id].value = "Option value is required";
                  allValid = false;
                }
                const cPrem = parseFloat(opt.companyAdditionalPremium);
                const ePrem = parseFloat(opt.employeeAdditionalPremium);
                if (!isNaN(cPrem) && cPrem < 0) {
                  daErr.listOptions![opt.id].companyAdditionalPremium = "Premium amounts must be ≥ 0";
                  allValid = false;
                }
                if (!isNaN(ePrem) && ePrem < 0) {
                  daErr.listOptions![opt.id].employeeAdditionalPremium = "Premium amounts must be ≥ 0";
                  allValid = false;
                }
              });
            }
          }
        }
      } else if (param.type === "relation") {
        errors[param.id].relationGroupDetails = {};
        param.relationGroupDetails.forEach((rgd) => {
          errors[param.id].relationGroupDetails![rgd.id] = {};
          if (!rgd.groupDisplayName?.trim()) {
            errors[param.id].relationGroupDetails![rgd.id].groupDisplayName =
              "Group display name is required.";
            allValid = false;
          }
          const familyMax = parseNumeric(rgd.familyMaxCount);
          if (rgd.familyMaxCount.trim() === "" || familyMax === undefined) {
            errors[param.id].relationGroupDetails![rgd.id].familyMaxCount =
              "Family max count is required and must be a number.";
            allValid = false;
          }

          let sumOfSelectedMaxCounts = 0;
          rgd.selectedRelations.forEach((sr) => {
            if (sr.selected) {
              const maxCount = parseNumeric(sr.maxCount);
              if (sr.maxCount.trim() === "" || maxCount === undefined) {
                // Error for individual maxCount can be added here if needed
                allValid = false; // Assuming selected relations must have a valid max count
              } else {
                sumOfSelectedMaxCounts += maxCount;
              }
            }
          });

          if (
            familyMax !== undefined &&
            !rgd.familyMaxManuallySet &&
            familyMax !== sumOfSelectedMaxCounts
          ) {
            // This might be an auto-calculated field, so direct error might be confusing.
            // Or, if it's user-editable and not manually set, it should match.
          }
          if (familyMax !== undefined && familyMax < sumOfSelectedMaxCounts) {
            // errors[param.id].relationGroupDetails![rgd.id].general = "Family max count cannot be less than the sum of selected relation max counts.";
            // allValid = false; // This rule depends on specific requirements
          }
        });
      } else if (param.type === "max-dependent-count") {
        const mdcCfg = param.maxDependentCountConfig;
        if (!mdcCfg || mdcCfg.options.length === 0) {
          allValid = false;
        } else {
          errors[param.id].maxDependentCountConfig = { options: {} };
          const optionErrors = errors[param.id].maxDependentCountConfig!.options!;
          const labelCounts = new Map<string, number>();
          mdcCfg.options.forEach((opt) => {
            const norm = opt.label?.trim().toLowerCase();
            if (norm) labelCounts.set(norm, (labelCounts.get(norm) ?? 0) + 1);
          });

          mdcCfg.options.forEach((opt) => {
            optionErrors[opt.id] = {};
            const optErr = optionErrors[opt.id];
            const maxVal = parseNumeric(opt.max);
            const norm = opt.label?.trim().toLowerCase();

            if (!opt.label?.trim()) {
              optErr.label = "Label is required.";
              allValid = false;
            } else if ((labelCounts.get(norm!) ?? 0) > 1) {
              // Labels are what the uploaded file is matched against — duplicates
              // would make the match ambiguous at validation time.
              optErr.label = "Label must be unique.";
              allValid = false;
            }
            if (opt.max.trim() === "" || maxVal === undefined || maxVal < 0) {
              optErr.max = "Max must be a non-negative number.";
              allValid = false;
            }
          });
        }
      }
    });

    setFormErrors(errors);
    return allValid;
  }, [configuredParameters, parseNumeric]); // parseNumeric is now stable due to its own useCallback

  return {
    configuredParameters,
    setConfiguredParameters,
    selectedMasterParamNameToAdd,
    setSelectedMasterParamNameToAdd,
    formErrors,
    validateParameters,
    handleAddConfiguredParameterWithSelection,
    onRemoveConfiguredParameter,
    onConfiguredParameterDisplayNameChange,
    onAddRangeDetail,
    onRemoveRangeDetail,
    onRangeDetailChange,
    onAddLovDetail,
    onRemoveLovDetail,
    onLovDetailChange,
    onAddRelationGroupDetail,
    onRemoveRelationGroupDetail,
    onRelationGroupDisplayNameChange,
    onRelationSelectionChange,
    onRelationMaxCountChange,
    onRelationGroupFamilyMaxCountChange,
    clearRelationGroupParameters,
    onApplyToDependentsChange,
    onTargetCategoryChange,
    onAddCountBand,
    onRemoveCountBand,
    onCountBandChange,
    onAddMaxDependentCountOption,
    onRemoveMaxDependentCountOption,
    onMaxDependentCountOptionChange,
    onDependentAttributeTargetCategoryChange,
    onDependentAttributeKindChange,
    onDependentAttributeNameChange,
    onAddDependentAttributeRangeBand,
    onAddDependentAttributeListOption,
    onDependentAttributeBandChange,
    onDependentAttributeOptionChange,
    onRemoveDependentAttributeBand,
    onRemoveDependentAttributeOption,
  };
}
