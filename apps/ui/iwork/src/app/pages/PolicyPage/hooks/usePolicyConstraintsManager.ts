import { useState, useEffect, useCallback } from "react";
import {
  ConfiguredPolicyConstraints,
  PolicyConfiguration,
} from "../PolicyConfigurator/policytypes";
import { useApiQuery, endPoints } from "@ui/ui-lib";
import { useParams } from "react-router-dom";

/**
 * Custom hook to manage the state and logic for Policy Constraints configuration.
 * Handles initialization with defaults, updates, and provides save/publish actions.
 * @param initialPolicyConfig - The full policy configuration object, potentially containing existing constraints.
 */
export const usePolicyConstraintsManager = (
  initialPolicyConfig: PolicyConfiguration | null
) => {
  const [constraints, setConstraints] = useState<ConfiguredPolicyConstraints>(
    {}
  );
  const { policyId } = useParams<{ policyId: string }>();

  // Fetch constraints from API
  const { data: masterConstraints, isLoading } = useApiQuery({
    url: endPoints.getConstraintsByPolicyId(Number(policyId)),
    queryKey: ["policyConstraints", policyId],
    enabled: !!policyId,
  });

  const masterConstraintsData = masterConstraints?.data?.constraints || {};

  // Initialize constraints state
  useEffect(() => {
    const initializeConstraints = () => {
      const existingConstraints =
        initialPolicyConfig?.configuration?.constraints;

      // Check for backward compatibility: if constraints are missing, null, or empty
      if (
        !existingConstraints ||
        Object.keys(existingConstraints).length === 0
      ) {
        const defaultConstraints: ConfiguredPolicyConstraints = {};

        if (masterConstraints) {
          (
            Object.keys(
              masterConstraintsData
            ) as (keyof ConfiguredPolicyConstraints)[]
          ).forEach((key) => {
            const masterConfig = masterConstraintsData[key];
            (defaultConstraints[key] as string | number | boolean) =
              masterConfig.defaultValue;
          });
        }
        setConstraints(defaultConstraints);
      } else {
        console.log("Initializing constraints with existing policy data.");
        // Use existing constraints, ensuring all master keys are present with defaults if missing
        const mergedConstraints: ConfiguredPolicyConstraints = {};

        if (masterConstraints) {
          (
            Object.keys(
              masterConstraintsData
            ) as (keyof ConfiguredPolicyConstraints)[]
          ).forEach((key) => {
            const masterConfig = masterConstraintsData[key];
            (mergedConstraints[key] as string | number | boolean) =
              existingConstraints[key] !== undefined &&
              existingConstraints[key] !== null
                ? existingConstraints[key]
                : masterConfig.defaultValue;
          });
        }
        setConstraints(mergedConstraints);
      }
    };

    if (!isLoading && masterConstraints) {
      initializeConstraints();
    }
  }, [initialPolicyConfig, masterConstraints, isLoading]);

  // Handler to update a single constraint value
  const handleConstraintChange = useCallback(
    (
      key: keyof ConfiguredPolicyConstraints,
      value: string | number | boolean
    ) => {
      setConstraints((prevConstraints) => ({
        ...prevConstraints,
        [key]: value,
      }));
    },
    []
  );

  // Get the current constraints data
  const getConstraintsData = useCallback(() => {
    return constraints;
  }, [constraints]);

  return {
    constraints,
    isLoading,
    handleConstraintChange,
    getConstraintsData,
    masterConstraints, // Added to expose master data if needed
  };
};
