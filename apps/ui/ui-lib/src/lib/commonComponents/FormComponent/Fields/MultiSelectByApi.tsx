import { useEffect, useState } from "react";
import { Box, CircularProgress, FormControl, TextField } from "@mui/material";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { Option } from "@ui/ui-lib/hooks/useApiSelectField";
import { useDebounce } from "@ui/ui-lib/hooks/useDebounce";
import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
import {
  StyledHelperText,
  StyledTypography,
  StyledAutocomplete,
  ChipContainer,
  CustomChipRendererStyles,
  CheckboxMainContainer,
  FormComponentStyledCheckbox,
  StyledMultiSelectTextField,
  StyledMultiSelectInput,
} from "./styles";
import { REGEX_PATTERNS } from "../../../constants/regex";
import React from "react";

interface MultiSelectByApiProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isFormAnArray?: boolean;
  isChipUsed?: boolean;
  trigger?: (name?: string | string[]) => void;
}

const buildQueryString = (params: Record<string, any>) => {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(
          typeof v === "string" ? v : JSON.stringify(v)
        )}`
    )
    .join("&");
};

const MultiSelectByApi = ({
  field,
  control,
  watch,
  setValue,
  isFormAnArray,
  isChipUsed = false,
  trigger,
  disableAllFields = false,
}: MultiSelectByApiProps) => {
  const { apiDependencies } = field;
  const [optionsState, setOptions] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isFocused, setIsFocused] = useState(false);

  let match = "";
  if (isFormAnArray) {
    match =
      field.name.match(REGEX_PATTERNS.MULTI_SECTION_PREFIX_REGEX)?.[0] || "";
  }

  const currentValue = watch(field.name);

  const normalizeEntityId = (value: any): string | number | undefined => {
    if (value === undefined || value === null || value === "") return undefined;

    if (typeof value === "object") {
      const nestedValue =
        value?.value ?? value?.id ?? value?.userId ?? value?.employeeId;
      return normalizeEntityId(nestedValue);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed === "[object Object]") return undefined;
      return trimmed;
    }

    return value;
  };

  const normalizedEntityIds = Array.isArray(currentValue)
    ? currentValue
        .map((item) => normalizeEntityId(item))
        .filter((item): item is string | number => item !== undefined)
    : [];

  // Enhanced dependent field logic
  const dependentFieldValue = apiDependencies?.dependentField
    ? watch(match + apiDependencies.dependentField)
    : null;

  const baseParams: Record<string, any> = {
    page: 1,
    ...(!normalizedEntityIds.length ? { limit: 15 } : {}),
    search: debouncedSearchTerm || "",
    ...(normalizedEntityIds.length
      ? { entityIds: normalizedEntityIds.join(",") }
      : {}),
    ...(apiDependencies?.customParams || {}),
  };
  // Only build URL if no dependent field is required, or if dependent field has value
  const shouldFetchData = apiDependencies?.dependentField
    ? !!dependentFieldValue
    : true;

  const queryString = buildQueryString(baseParams);
  //endpoint based in the apiDependencies
  let endPoint = "";

  if (typeof apiDependencies?.endPoint === "function") {
    // If endPoint is a function, call it with the current value
    endPoint = apiDependencies.endPoint(watch(apiDependencies?.dependentField));
  } else {
    endPoint = apiDependencies?.endPoint;
  }

  const fullUrl =
    shouldFetchData && endPoint && queryString
      ? `${endPoint}?${queryString}`
      : null;
  const {
    data: apiResponse,
    isLoading: loading,
    error,
  } = useApiQuery({
    url: fullUrl,
    queryKey: [
      "aliSearchMultiSelect",
      apiDependencies?.endPoint,
      debouncedSearchTerm,
      currentValue,
      dependentFieldValue, // Include dependent field value in query key
    ],
    enabled: !!fullUrl && shouldFetchData, // Enhanced condition
  });

  useEffect(() => {
    if (!apiResponse) return;
    let options: Option[] = [];
    if (apiDependencies?.utilityFunction) {
      if (apiDependencies.utilityDependent) {
        options = apiDependencies.utilityFunction(
          apiResponse,
          watch(apiDependencies.utilityDependent)
        );
      } else {
        options = apiDependencies.utilityFunction(apiResponse);
      }
    }
    setOptions(options);
  }, [apiResponse]);

  let showField = true;
  if (apiDependencies?.dependentField) {
    showField = !!watch(match + apiDependencies?.dependentField);
  }
  if (apiDependencies?.showCondition) {
    showField = apiDependencies.showCondition(watch);
  }

  const isDisabled =
    disableAllFields || !showField || field.componentProps?.disabled;

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { onChange, value, error, helperText } = sharedProps;
        const resolveOptionFromValue = (val: any) => {
          const normalizedValue =
            typeof val === "object" && val !== null
              ? val?.value ?? val?.id ?? val?.userId ?? val?.employeeId
              : val;

          const matchedOption = optionsState.find(
            (opt) => String(opt.value) === String(normalizedValue)
          );

          if (matchedOption) return matchedOption;

          const fallbackLabel =
            typeof val === "object" && val !== null
              ? val?.employeeName ||
                val?.displayName ||
                val?.name ||
                val?.fullName ||
                [val?.firstName, val?.lastName].filter(Boolean).join(" ")
              : undefined;

          return {
            value: normalizedValue,
            label: fallbackLabel || String(normalizedValue ?? ""),
          };
        };

        const handleClear = () => {
          if (isDisabled) {
            return;
          }
          if (isFocused) {
            setSearchTerm("");
          } else {
            onChange([]);
            trigger && trigger(field.name);
            if (apiDependencies?.clearFieldsOnChange?.length) {
              apiDependencies.clearFieldsOnChange.forEach((fieldName) =>
                setValue(match + fieldName, null)
              );
            }
          }
        };

        return (
          <Box>
            <StyledTypography
              variant="body2"
              sx={{
                color: error ? "error.main" : "text.secondary",
              }}
              id={`${field.name}-label`}
              error={Boolean(error)}
            >
              {field.rules?.required ? `${field.label} *` : field.label}
            </StyledTypography>
            <FormControl fullWidth error={Boolean(error)}>
              <StyledAutocomplete
                multiple
                disablePortal
                options={optionsState}
                disableCloseOnSelect={true}
                value={(value || []).map(
                  (val: any) => resolveOptionFromValue(val)
                )}
                onChange={(_, newValue) => {
                  if (isDisabled) {
                    return;
                  }
                  onChange(newValue.map((opt) => opt.value));
                  trigger && trigger(field.name);
                  if (apiDependencies?.clearFieldsOnChange?.length) {
                    apiDependencies.clearFieldsOnChange.forEach((fieldName) =>
                      setValue(match + fieldName, null)
                    );
                  }
                }}
                isOptionEqualToValue={(option, val) =>
                  option.value === val.value
                }
                renderOption={(props, option, { index }) => {
                  const { key, ...rest } = props;

                  const isSelected = (value || []).includes(option.value);
                  const combinedKey = `${option.value}-${index}`;

                  return (
                    <li key={combinedKey} {...rest}>
                      <CheckboxMainContainer>
                        <FormComponentStyledCheckbox
                          checked={isSelected}
                          size="small"
                        />
                        <Box>{option.label}</Box>
                      </CheckboxMainContainer>
                    </li>
                  );
                }}
                getOptionLabel={(option) => option.label || ""}
                filterOptions={(x) => x}
                inputValue={searchTerm}
                onInputChange={(_, newInputValue, reason) => {
                  if (isDisabled) {
                    return;
                  }
                  if (reason === "input") {
                    setSearchTerm(newInputValue);
                  }
                }}
                // Override the clear behavior
                onClose={() => {
                  // Only clear search term when closing dropdown, not selected values
                  if (isFocused) {
                    setSearchTerm("");
                  }
                }}
                loading={loading}
                renderTags={(tagValues) => {
                  if (isChipUsed) {
                    return (
                      <ChipContainer>
                        {tagValues.map((option, index) => (
                          <CustomChipRendererStyles
                            key={`${option.value}-${index}`}
                            value={option.label}
                            styleMap={{
                              default: {
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                              },
                            }}
                          />
                        ))}
                      </ChipContainer>
                    );
                  }
                  return null;
                }}
                renderInput={(params) => {
                  const selectedLabels = (value || []).map((val: any) =>
                    resolveOptionFromValue(val)?.label
                  );

                  const validateSelectedLabels = (labels: string[]): void => {
                    if (!Array.isArray(labels)) {
                      throw new Error("Selected labels must be an array.");
                    }
                  };

                  validateSelectedLabels(selectedLabels);

                  const getDisplayText = (): string => {
                    if (selectedLabels.length === 0) {
                      return "";
                    }

                    if (selectedLabels.length === 1) {
                      return selectedLabels[0];
                    }

                    if (selectedLabels.length <= 3) {
                      return selectedLabels.join(", ");
                    }

                    // For more than 3 items, show first 2 with ellipses
                    const firstTwo = selectedLabels.slice(0, 2).join(", ");
                    return `${firstTwo}...`;
                  };

                  const displayText = getDisplayText();
                  const isDisplayTextVisible =
                    !isChipUsed && selectedLabels.length > 0;

                  return (
                    <StyledMultiSelectTextField
                      {...params}
                      title={displayText}
                      placeholder={
                        isChipUsed || !isDisplayTextVisible
                          ? field.placeholder || "Search"
                          : ""
                      }
                      error={!!error}
                      onFocus={() => {
                        if (isDisabled) {
                          return;
                        }
                        setIsFocused(true);
                      }}
                      onBlur={() => {
                        setIsFocused(false);
                        // Clear the search term when field loses focus
                        setSearchTerm("");
                      }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading && (
                              <CircularProgress color="inherit" size={20} />
                            )}
                            {/* Override the clear button behavior */}
                            {!isDisabled &&
                              params.InputProps.endAdornment &&
                              React.cloneElement(
                                params.InputProps
                                  .endAdornment as React.ReactElement,
                                {
                                  children: React.Children.map(
                                    (
                                      params.InputProps
                                        .endAdornment as React.ReactElement
                                    ).props.children,
                                    (child: React.ReactElement) => {
                                      // If this is the clear button, override its onClick
                                      if (child?.props?.onClick) {
                                        return React.cloneElement(child, {
                                          onClick: (e: React.MouseEvent) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isDisabled) {
                                              return;
                                            }
                                            handleClear();
                                          },
                                        });
                                      }
                                      return child;
                                    }
                                  ),
                                }
                              )}
                          </>
                        ),
                      }}
                      disabled={isDisabled}
                      inputProps={{
                        ...params.inputProps,
                        ...(isDisplayTextVisible &&
                          !isFocused && {
                            value: displayText,
                            readOnly: true,
                          }),
                        component: StyledMultiSelectInput,
                        isDisplayTextVisible,
                      }}
                    />
                  );
                }}
              />
              {error && (
                <StyledHelperText error={!!error}>
                  {helperText}
                </StyledHelperText>
              )}
            </FormControl>
          </Box>
        );
      }}
    />
  );
};

export default MultiSelectByApi;
