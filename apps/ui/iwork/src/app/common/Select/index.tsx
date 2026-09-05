import React, { useEffect, useState } from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useApiQuery } from "@ui/ui-lib";
import { FormControlStyles, SelectLabel } from "./styles";

interface MuiSelectProps {
  label: string;
  value: string | number;
  options?: { value: string | number; label: string }[];
  apiDependencies?: {
    endPoint: string | ((dependentValue: string | number) => string);
    transform: (data: any[]) => { value: string | number; label: string }[];
    defaultValue?: string | number;
    dependentField?: string;
  };
  dependentValue?: string | number; // ✅ add this
  onChange: (
    event: SelectChangeEvent<string | number>,
    child?: React.ReactNode
  ) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}

const MuiSelect: React.FC<MuiSelectProps> = ({
  label = "Select", // Add a default value for label
  value,
  options = [],
  apiDependencies,
  dependentValue,
  onChange,
  disabled = false,
  fullWidth = true,
  placeholder = "Select an option",
}) => {
  const labelId = `mui-select-label-${label
    ?.replace(/\s+/g, "-")
    ?.toLowerCase()}`; // Ensure label is defined before calling replace
  const selectId = `${labelId}-select`;

  const [dynamicOptions, setDynamicOptions] =
    useState<{ value: string | number; label: string }[]>(options);

  const shouldFetch =
    !!apiDependencies?.endPoint &&
    (apiDependencies?.dependentField ? !!dependentValue : true);

  let finalUrl: string | undefined = undefined;

  if (apiDependencies?.endPoint) {
    if (typeof apiDependencies.endPoint === "function") {
      finalUrl = apiDependencies.endPoint(dependentValue);
    } else {
      finalUrl = apiDependencies.endPoint;
    }
  }

  // Fetch options dynamically using `apiDependencies`
  const { data, error } = useApiQuery({
    url: finalUrl || "",
    queryKey: [label, finalUrl],
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch options for %s:", label, error);
      return;
    }

    if (data && apiDependencies?.transform) {
      try {
        const transformedOptions = apiDependencies.transform(data);
        setDynamicOptions(transformedOptions);

        if (apiDependencies.defaultValue) {
          const defaultOption = transformedOptions.find(
            (option) => option.value === apiDependencies.defaultValue
          );
          if (defaultOption) {
            onChange({
              target: { value: defaultOption.value },
            } as SelectChangeEvent<string | number>);
          }
        }
      } catch (err) {
        console.error("Error transforming options for %s:", label, err);
      }
    } else {
      console.error("Invalid data received for %s:", label, data);
    }
  }, [data, error, apiDependencies]);

  useEffect(() => {
    // Set default value for static options
    if (!apiDependencies?.endPoint && options.length > 0) {
      const defaultOption = options.find(
        (option) => option.value === apiDependencies?.defaultValue
      );
      if (defaultOption) {
        onChange({
          target: { value: defaultOption.value },
        } as SelectChangeEvent<string | number>);
      }
    }
  }, [options, apiDependencies, onChange]);

  const effectiveOptions = options.length > 0 ? options : dynamicOptions;

  return (
    <FormControlStyles
      fullWidth={fullWidth}
      disabled={disabled}
      variant="outlined"
    >
      <Select
        labelId={labelId}
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={onChange}
        displayEmpty
        MenuProps={{ transitionDuration: 0 }}
      >
        {/* Show placeholder only when nothing is selected */}
        {(value === "" || value === undefined || value === null) && (
          <MenuItem disabled value="">
            <SelectLabel variant="body2">{placeholder}</SelectLabel>
          </MenuItem>
        )}

        {/* Show no options available if list is empty */}
        {effectiveOptions.length === 0 ? (
          <MenuItem disabled value="">
            <SelectLabel variant="body2">No options available</SelectLabel>
          </MenuItem>
        ) : (
          effectiveOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <SelectLabel variant="body2">{option.label}</SelectLabel>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControlStyles>
  );
};

export default MuiSelect;
