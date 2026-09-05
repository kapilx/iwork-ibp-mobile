import { useState, useEffect, useCallback } from "react";
import {
  RelationTypeConfig,
  PolicyRelationshipsSummary, // Use this for the summary type
  RelationOptionConfig, // For typing default options
  relations as masterRelationTypesSource, // Import the existing master list
  relations,
} from "../PolicyConfigurator/policytypes";

export interface PolicyRelationshipsData {
  enabledPolicyRelations: RelationTypeConfig[];
  familyMaxPolicyLevel: string;
}

export interface PolicyRelationshipsManager {
  policyRelationsData: RelationTypeConfig[];
  setPolicyRelationsData: React.Dispatch<
    React.SetStateAction<RelationTypeConfig[]>
  >;
  familyMaxPolicyLevel: string;
  setFamilyMaxPolicyLevel: React.Dispatch<React.SetStateAction<string>>;
  familyMaxPolicyLevelError: string | undefined;
  setFamilyMaxPolicyLevelError: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  familyMaxManuallySet: boolean;
  setFamilyMaxManuallySet: React.Dispatch<React.SetStateAction<boolean>>;
  policyRelationshipsSummary: PolicyRelationshipsSummary;
  handleRelationTypeToggle: (relationTypeToToggle: string) => void;
  handleMaxCountChange: (relationType: string, value: string) => void;
  handleRelationOptionToggle: (
    relationType: string,
    optionNameToToggle: string
  ) => void;
  handleAgeChange: (
    relationType: string,
    optionName: string,
    ageField: "minAge" | "maxAge",
    value: string
  ) => void;
  handleFamilyMaxPolicyLevelChange: (value: string) => void;
  handleFamilyMaxManuallySet: (isManual: boolean) => void;
  initializeData: (initialData?: PolicyRelationshipsData) => void;
  validateRelationships: () => boolean;
}

// Define the shape of the initial data the hook might receive
interface InitialRelationshipsData {
  enabledPolicyRelations?: RelationTypeConfig[]; // This is the list of relations that were saved
  familyMaxPolicyLevel?: string;
}

// Helper to get default configured options for a relation type
const getDefaultConfiguredOptions = (
  optionNames: string[]
): RelationOptionConfig[] => {
  return optionNames.map((name) => ({
    name: name,
    enabled: false, // Default to disabled
    minAge: "",
    maxAge: "",
    minAgeError: undefined,
    maxAgeError: undefined,
  }));
};

export function usePolicyRelationshipsManager(
  initialData?: InitialRelationshipsData
): PolicyRelationshipsManager {
  const [policyRelationsData, setPolicyRelationsData] = useState<
    RelationTypeConfig[]
  >([]);
  const [familyMaxPolicyLevel, setFamilyMaxPolicyLevel] = useState<string>("");
  const [familyMaxPolicyLevelError, setFamilyMaxPolicyLevelError] = useState<
    string | undefined
  >(undefined);
  const [familyMaxManuallySet, setFamilyMaxManuallySet] =
    useState<boolean>(false);
  const [policyRelationshipsSummary, setPolicyRelationshipsSummary] =
    useState<PolicyRelationshipsSummary>({
      enabledPolicyRelations: [],
      familyMaxPolicyLevel: "",
    });

  const parseNumeric = useCallback(
    (value: string | undefined | null): number | undefined => {
      if (value === undefined || value === null || String(value).trim() === "")
        return undefined;
      const num = parseFloat(String(value).replace(/,/g, ""));
      return isNaN(num) ? undefined : num;
    },
    []
  );

  const initializeData = useCallback(
    (initialData?: PolicyRelationshipsData) => {
      const configRelationFromMaster = (
        master: (typeof relations)[0]
      ): RelationTypeConfig => {
        return {
          type: master.type,
          enabled: master.type === "Self", // Self is enabled by default
          maxCount: master.type === "Self" ? "1" : "",
          configuredOptions: master.options.map((opt: string) => {
            return {
              name: opt,
              enabled: master.type === "Self" && opt === "Self",
              minAge: "",
              maxAge: "",
            };
          }),
        };
      };

      if (initialData && initialData.enabledPolicyRelations.length > 0) {
        // If initialData.enabledPolicyRelations is provided, it means these are the *only* relations
        // that should be considered "configured" or potentially enabled.
        // We still merge with master to get all possible options and default states.
        const mergedData = relations.map((masterRelation) => {
          // if this masterRelation is in initialData as enabled, push it into mergedData
          const configuredRelation = initialData.enabledPolicyRelations.find(
            (r) => r.type === masterRelation.type && r.enabled
          );
          if (configuredRelation) {
            return { ...configuredRelation };
          } else {
            return configRelationFromMaster(masterRelation);
          }
        });
        setPolicyRelationsData(mergedData);
        setFamilyMaxPolicyLevel(initialData.familyMaxPolicyLevel || "");
      } else {
        // No initial data or empty relations, so reset to master defaults (all disabled)
        const defaultData = relations.map((master) =>
          configRelationFromMaster(master)
        );
        setPolicyRelationsData(defaultData);
        setFamilyMaxPolicyLevel("");
      }
      setFamilyMaxManuallySet(false); // Reset manual flag on initialization
      setFamilyMaxPolicyLevelError(undefined); // Clear errors
    },
    []
  );

  // Effect to initialize and merge initialData when it becomes available or changes
  useEffect(() => {
    // 1. Create the base structure from the master list (mimics new policy creation)
    let baseRelations: RelationTypeConfig[] = masterRelationTypesSource.map(
      (masterRel) => ({
        type: masterRel.type,
        enabled: masterRel.type === "Self", // Self is enabled by default
        maxCount: masterRel.type === "Self" ? "1" : "", // Self has max count 1, others blank
        configuredOptions: getDefaultConfiguredOptions(masterRel.options).map(
          (opt) => ({
            ...opt,
            // Self's default option is enabled by default
            enabled: masterRel.type === "Self" ? true : opt.enabled,
          })
        ),
        maxCountError: undefined,
      })
    );

    // 2. If initialData (from a loaded policy) is provided, merge it
    if (initialData?.enabledPolicyRelations) {
      const loadedRelationsMap = new Map(
        initialData.enabledPolicyRelations.map((rel) => [rel.type, rel])
      );

      baseRelations = baseRelations.map((baseRel) => {
        const loadedRel = loadedRelationsMap.get(baseRel.type);
        if (loadedRel) {
          // If this relation type was enabled in the loaded policy, update its state
          // Start with the base, then override with loaded properties
          const mergedRelation = { ...baseRel, ...loadedRel, enabled: true }; // Ensure enabled is true if loaded

          // Merge configured options - iterate base options and find corresponding loaded ones
          mergedRelation.configuredOptions = baseRel.configuredOptions.map(
            (baseOpt) => {
              const loadedOpt = loadedRel.configuredOptions.find(
                (opt) => opt.name === baseOpt.name
              );
              // If option exists in loaded data, use its enabled/age state, otherwise keep base default (disabled)
              return loadedOpt ? { ...baseOpt, ...loadedOpt } : baseOpt;
            }
          );
          return mergedRelation;
        }
        // If not found in loaded data, keep the base (default/disabled) state
        return baseRel;
      });
    }
    setPolicyRelationsData(baseRelations); // Set the processed list

    // Initialize familyMaxPolicyLevel from initialData if provided
    if (initialData?.familyMaxPolicyLevel !== undefined) {
      setFamilyMaxPolicyLevel(initialData.familyMaxPolicyLevel);
      // If familyMaxPolicyLevel is loaded, it implies it might have been manually set.
      // However, without storing/loading familyMaxManuallySet, it will be subject to
      // auto-recalculation if underlying relations change and familyMaxManuallySet is false.
      // For simplicity, we don't set familyMaxManuallySet to true here unless it's also loaded.
    } else {
      // If no familyMaxPolicyLevel in initialData, the auto-calculation effect below will set it.
      // Or, if you want to ensure it's blank for new policies before auto-calc:
      if (!initialData) {
        // Only for truly new policies (initialData is undefined)
        setFamilyMaxPolicyLevel("");
      }
    }
  }, [initialData]); // Depend on initialData prop

  // Effect to auto-calculate Family Max based on other relations, if not manually set
  useEffect(() => {
    if (!familyMaxManuallySet) {
      let sumOfMaxCounts = 0;
      // Calculate based on *enabled* relations in the current state
      for (const relation of policyRelationsData.filter((rel) => rel.enabled)) {
        if (relation.maxCount && !isNaN(parseInt(relation.maxCount, 10))) {
          // Ensure maxCount is a valid number
          sumOfMaxCounts += parseInt(relation.maxCount, 10);
        }
      }
      if (sumOfMaxCounts >= 0) {
        // Ensure sum is not negative (though unlikely with current logic)
        const newFamilyMax = String(sumOfMaxCounts > 99 ? 99 : sumOfMaxCounts); // Cap at 99
        setFamilyMaxPolicyLevel(newFamilyMax);
        setFamilyMaxPolicyLevelError(undefined); // Clear error if auto-calculated
      }
    }
  }, [policyRelationsData, familyMaxManuallySet]); // Removed setters from dependencies as they cause loops

  // Effect to update policyRelationshipsSummary whenever relevant state changes
  useEffect(() => {
    const enabledRelations = policyRelationsData.filter(
      (relation) => relation.enabled
    );
    // Deep clone to ensure data integrity when passed up
    setPolicyRelationshipsSummary(
      JSON.parse(
        JSON.stringify({
          enabledPolicyRelations: enabledRelations,
          familyMaxPolicyLevel: familyMaxPolicyLevel,
        })
      )
    );
  }, [policyRelationsData, familyMaxPolicyLevel]);

  const validateRelationships = useCallback((): boolean => {
    let isValid = true;
    let hasFamilyMaxError = false;

    if (!familyMaxPolicyLevel || parseInt(familyMaxPolicyLevel, 10) <= 0) {
      setFamilyMaxPolicyLevelError("Must be > 0.");
      isValid = false;
      hasFamilyMaxError = true;
    } else {
      setFamilyMaxPolicyLevelError(undefined);
    }

    const updatedRelations = policyRelationsData.map((relation) => {
      let relationIsValid = true;
      if (relation.enabled && relation.type !== "Self") {
        if (!relation.maxCount || parseInt(relation.maxCount, 10) <= 0) {
          relation.maxCountError = "Must be > 0.";
          relationIsValid = false;
        } else {
          relation.maxCountError = undefined;
        }
        if (!relation.configuredOptions.some((opt) => opt.enabled)) {
          relationIsValid = false;
        } else {
          relation.configuredOptions.forEach((opt) => {
            if (!opt.enabled) return;

            const minVal = parseNumeric(opt.minAge);
            const maxVal = parseNumeric(opt.maxAge);

            if (minVal === undefined) {
              opt.minAgeError = "0-120";
              relationIsValid = false;
            } else if (minVal < 0 || minVal > 120) {
              opt.minAgeError = "0-120";
              relationIsValid = false;
            } else if (maxVal !== undefined && minVal >= maxVal) {
              opt.minAgeError = "Min >= Max";
              relationIsValid = false;
            } else {
              opt.minAgeError = undefined;
            }

            if (maxVal === undefined) {
              opt.maxAgeError = "0-120";
              relationIsValid = false;
            } else if (maxVal < 0 || maxVal > 120) {
              opt.maxAgeError = "0-120";
              relationIsValid = false;
            } else if (minVal !== undefined && maxVal <= minVal) {
              opt.maxAgeError = "Max <= Min";
              relationIsValid = false;
            } else {
              opt.maxAgeError = undefined;
            }
          });
        }
      } else if (relation.enabled && relation.type === "Self") {
        const selfOption = relation.configuredOptions.find(
          (opt) => opt.name === "Self"
        );
        if (selfOption && selfOption.enabled) {
          const minVal = parseNumeric(selfOption.minAge);
          const maxVal = parseNumeric(selfOption.maxAge);
          if (minVal === undefined) {
            relationIsValid = false;
          }
          if (maxVal === undefined) {
            relationIsValid = false;
          }
          if (
            minVal !== undefined &&
            maxVal !== undefined &&
            minVal >= maxVal
          ) {
            relationIsValid = false;
            selfOption.minAgeError = "Min >= Max";
            selfOption.maxAgeError = "Max <= Min";
          }
        }
      }
      if (!relationIsValid) isValid = false;
      return relation;
    });

    // Age validation is handled by onAgeChange, which sets errors directly on options.
    // We need to check if any such errors exist.
    const hasAgeErrors = updatedRelations.some((rel) =>
      rel.configuredOptions.some((opt) => opt.minAgeError || opt.maxAgeError)
    );
    if (hasAgeErrors) isValid = false;

    setPolicyRelationsData(updatedRelations); // Update state with new error messages
    return isValid && !hasFamilyMaxError && !hasAgeErrors;
  }, [policyRelationsData, familyMaxPolicyLevel]);

  const handleRelationTypeToggle = (relationTypeToToggle: string) => {
    if (relationTypeToToggle === "Self") return;
    setPolicyRelationsData((prevData) =>
      prevData.map((rel) =>
        rel.type === relationTypeToToggle
          ? {
              ...rel,
              enabled: !rel.enabled,
              maxCount: !rel.enabled ? rel.maxCount : "",
              maxCountError: undefined,
              configuredOptions: rel.configuredOptions.map((opt) => ({
                ...opt,
                enabled: false,
                minAge: "",
                maxAge: "",
                minAgeError: undefined,
                maxAgeError: undefined,
              })),
            }
          : rel
      )
    );
  };

  const handleMaxCountChange = (relation: any, value: string) => {
    let processedValue = value.replace(/[^0-9]/g, "");
    const relationType = relation.type;
    if (processedValue.length > 2)
      processedValue = processedValue.substring(0, 2);
    let error = "";
    if (processedValue !== "" && parseInt(processedValue, 10) <= 0)
      error = "Must be > 0";
    setPolicyRelationsData((prevData) =>
      prevData.map((rel) =>
        rel.type === relationType
          ? { ...rel, maxCount: processedValue, maxCountError: error }
          : rel
      )
    );
  };

  const handleRelationOptionToggle = (
    relationType: string,
    optionNameToToggle: string
  ) => {
    if (relationType === "Self" && optionNameToToggle === "Self") return;
    setPolicyRelationsData((prevData) =>
      prevData.map((rel) => {
        if (rel.type === relationType) {
          const targetOptionInitialState = rel.configuredOptions.find(
            (opt) => opt.name === optionNameToToggle
          );
          const isBeingEnabled = targetOptionInitialState
            ? !targetOptionInitialState.enabled
            : false;
          let sourceMinAge = "";
          let sourceMaxAge = "";
          let foundSourceForCopy = false;
          if (isBeingEnabled) {
            for (const siblingOption of rel.configuredOptions) {
              if (
                siblingOption.name !== optionNameToToggle &&
                siblingOption.enabled &&
                siblingOption.minAge &&
                siblingOption.maxAge
              ) {
                sourceMinAge = siblingOption.minAge;
                sourceMaxAge = siblingOption.maxAge;
                foundSourceForCopy = true;
                break;
              }
            }
          }
          return {
            ...rel,
            configuredOptions: rel.configuredOptions.map((opt) => {
              if (opt.name === optionNameToToggle) {
                const newEnabledState = !opt.enabled;
                return newEnabledState && foundSourceForCopy
                  ? {
                      ...opt,
                      enabled: newEnabledState,
                      minAge: sourceMinAge,
                      maxAge: sourceMaxAge,
                      minAgeError: undefined,
                      maxAgeError: undefined,
                    }
                  : {
                      ...opt,
                      enabled: newEnabledState,
                      minAge: newEnabledState ? opt.minAge : "",
                      maxAge: newEnabledState ? opt.maxAge : "",
                      minAgeError: undefined,
                      maxAgeError: undefined,
                    };
              }
              return opt;
            }),
          };
        }
        return rel;
      })
    );
  };

  const handleAgeChange = (
    relationType: string,
    optionName: string,
    ageField: "minAge" | "maxAge",
    value: string
  ) => {
    let processedValue = value.replace(/[^0-9]/g, "");
    let error = "";
    if (processedValue !== "") {
      const numValue = parseInt(processedValue, 10);
      if (isNaN(numValue) || numValue < 0 || numValue > 120) error = "0-120";
      else {
        if (processedValue.length > 3)
          processedValue = processedValue.substring(0, 3);
        if (parseInt(processedValue, 10) > 120) processedValue = "120";
      }
    }
    setPolicyRelationsData((prevData) =>
      prevData.map((rel) => {
        if (rel.type === relationType) {
          return {
            ...rel,
            configuredOptions: rel.configuredOptions.map((opt) => {
              if (opt.name !== optionName) return opt;

              const otherField = ageField === "minAge" ? "maxAge" : "minAge";
              const otherVal = parseNumeric(opt[otherField]);
              let minError = opt.minAgeError;
              let maxError = opt.maxAgeError;

              if (ageField === "minAge") {
                const minVal = parseNumeric(processedValue);
                if (
                  minVal !== undefined &&
                  otherVal !== undefined &&
                  minVal >= otherVal
                ) {
                  error = "Min >= Max";
                  maxError = "Max <= Min";
                } else if (maxError === "Max <= Min") {
                  maxError = undefined;
                }
                minError = error;
              } else {
                const maxVal = parseNumeric(processedValue);
                if (
                  maxVal !== undefined &&
                  otherVal !== undefined &&
                  maxVal <= otherVal
                ) {
                  error = "Max <= Min";
                  minError = "Min >= Max";
                } else if (minError === "Min >= Max") {
                  minError = undefined;
                }
                maxError = error;
              }

              return {
                ...opt,
                [ageField]: processedValue,
                minAgeError: minError,
                maxAgeError: maxError,
              };
            }),
          };
        }
        return rel;
      })
    );
  };

  const handleFamilyMaxPolicyLevelChange = (value: string) => {
    let processedValue = value.replace(/[^0-9]/g, "");
    if (processedValue.length > 2)
      processedValue = processedValue.substring(0, 2);
    let error = "";
    if (processedValue !== "" && parseInt(processedValue, 10) <= 0)
      error = "Must be > 0";
    setFamilyMaxPolicyLevel(processedValue);
    setFamilyMaxPolicyLevelError(error);
  };

  const handleFamilyMaxManuallySet = (isManual: boolean) =>
    setFamilyMaxManuallySet(isManual);

  return {
    policyRelationsData,
    setPolicyRelationsData,
    familyMaxPolicyLevel,
    setFamilyMaxPolicyLevel,
    familyMaxPolicyLevelError,
    setFamilyMaxPolicyLevelError,
    familyMaxManuallySet,
    setFamilyMaxManuallySet,
    initializeData,
    policyRelationshipsSummary,
    validateRelationships,
    handleRelationTypeToggle,
    handleMaxCountChange,
    handleRelationOptionToggle,
    handleAgeChange,
    handleFamilyMaxPolicyLevelChange,
    handleFamilyMaxManuallySet,
  };
}
