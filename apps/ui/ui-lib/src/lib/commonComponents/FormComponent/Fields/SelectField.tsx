import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { Option, useApiSelectField } from "@ui/ui-lib/hooks/useApiSelectField";
import {
  AutocompleteStyles,
  SelectMenuItem,
  DynamicFormSelectStyles,
  StyledHelperText,
  StyledPaper,
  StyledPlaceholder,
  StyledTypography,
  EllipsisOption,
} from "./styles";
import { REGEX_PATTERNS } from "../../../constants/regex";
import { useState } from "react";
import {
  componentStyles,
  fieldStyles,
  labelStyles,
  valueStyles,
} from "./TextField";

interface SelectFieldComponentProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

type OptionValueType = string | number;

const SelectField = ({
  field,
  control,
  watch,
  setValue,
  isFormAnArray,
  trigger,
  enableSmartSearch = false,
  onActionMap,
  showValue = false,
  renderAsTable = false,
}: SelectFieldComponentProps) => {
  const { options, apiDependencies } = field;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  let match = "";
  if (isFormAnArray) {
    match =
      field.name.match(REGEX_PATTERNS.MULTI_SECTION_PREFIX_REGEX)?.[0] || "";
  }

  let dynamicOptions: Option[] = [];
  let isLoading = false;

  if (apiDependencies) {
    const { options = [], loading } = useApiSelectField({
      apiDependencies: isFormAnArray
        ? {
            ...apiDependencies,
            dependentField: apiDependencies.dependentField
              ? match + apiDependencies.dependentField
              : apiDependencies.dependentField,
            utilityDependent: apiDependencies?.utilityDependent
              ? match + apiDependencies.utilityDependent
              : undefined,
          }
        : apiDependencies,
      watch,
      fieldName: field.name,
    });

    dynamicOptions = [...(options || [])];
    isLoading = loading;
  }

  let showField = true;

  if (apiDependencies?.dependentField) {
    const watchedValue = watch(match + apiDependencies?.dependentField);
    // An empty array from a multiselect parent means "nothing picked" — [] is
    // truthy, so it would otherwise enable this field with no options.
    showField = Boolean(
      watchedValue &&
        watchedValue !== "ALL" &&
        !(Array.isArray(watchedValue) && watchedValue.length === 0)
    );
  }

  if (apiDependencies?.showCondition) {
    // this case is written just for group companyId or else we dont need this field at all
    showField = apiDependencies?.showCondition(watch);
  }

  const optionData = apiDependencies ? dynamicOptions : options;
  const updatedComponentProps = {
    ...field.componentProps,
    disabled: !showField || field.componentProps?.disabled,
  };

  const isDisabled = !showField || field.componentProps?.disabled;

  // select all label
  if (apiDependencies?.defaultValue) {
    optionData?.unshift({
      value: "",
      label: apiDependencies.defaultValue,
    });
  }

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { onChange, value, error, helperText } = sharedProps;

        return (
          <Box sx={{ ...(renderAsTable && fieldStyles) }}>
            <StyledTypography
              variant="body2"
              sx={{
                color: sharedProps.error ? "error.main" : "text.secondary",
                ...(renderAsTable && labelStyles),
              }}
              id={`${field.name}-label`}
              error={Boolean(sharedProps.error)}
            >
              {showValue
                ? field.label
                : field.rules?.required
                ? `${field.label} *`
                : field.label}
            </StyledTypography>
            {showValue ? (
              <StyledTypography
                {...(renderAsTable && valueStyles)}
                variant="body2"
              >
                {sharedProps.value}
              </StyledTypography>
            ) : (
              <FormControl
                sx={{ ...(renderAsTable && componentStyles) }}
                fullWidth
                error={Boolean(error)}
              >
                <AutocompleteStyles
                  options={optionData || []}
                  disablePortal={updatedComponentProps.disablePortal ?? false}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => {
                    const compareValue = enableSmartSearch
                      ? (value as any)?.value
                      : value?.value ?? value;
                    return option.value === compareValue;
                  }}
                  value={
                    optionData?.find(
                      (option) =>
                        option.value ===
                        (enableSmartSearch ? (value as any)?.value : value)
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    const newValueToSet = newValue
                      ? enableSmartSearch
                        ? newValue
                        : newValue.value
                      : null;
                    onChange(newValueToSet);
                    trigger && trigger(field.name);

                    if (
                      !newValue &&
                      apiDependencies?.clerFieldsWhenCurrValueEmpty?.length
                    ) {
                      apiDependencies.clerFieldsWhenCurrValueEmpty.forEach(
                        (fieldName) => {
                          setValue(match + fieldName, null);
                        }
                      );
                    }

                    if (apiDependencies?.clearFieldsOnChange?.length) {
                      apiDependencies.clearFieldsOnChange.forEach(
                        (fieldName) => {
                          setValue(match + fieldName, null);
                        }
                      );
                    }

                    if (
                      field?.invokeFunction &&
                      typeof field.invokeFunction === "string"
                    ) {
                      const action = onActionMap?.[field.invokeFunction];
                      if (typeof action === "function") {
                        action(newValue, watch());
                      } else {
                        console.warn(
                          `No valid invokeFunction handler found: ${field.invokeFunction}`
                        );
                      }
                    }
                  }}
                  disabled={isDisabled}
                  PaperComponent={StyledPaper}
                  noOptionsText={isLoading ? "Loading..." : "No data found"}
                  renderOption={(props, option, { index }) => {
                    const { key, ...rest } = props;
                    return (
                      <li {...rest} key={`${option.value}-${index}`}>
                        <EllipsisOption title={option.label}>
                          {option.label}
                        </EllipsisOption>
                      </li>
                    );
                  }}
                  renderInput={(params) => {
                    const selectedOption = optionData?.find(
                      (option) =>
                        option.value ===
                        (enableSmartSearch ? (value as any)?.value : value)
                    );
                    return (
                      <TextField
                        {...params}
                        placeholder={field.placeholder || ""}
                        error={Boolean(error)}
                        helperText={error ? helperText : field.helperText ?? ""}
                        disabled={isDisabled}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoading ? (
                                <CircularProgress color="inherit" size={18} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        title={selectedOption?.label || ""}
                      />
                    );
                  }}
                  data-testid={`form-field-${field.type}-${field.name}`}
                />
              </FormControl>
            )}
          </Box>
        );
      }}
    />
  );
};

export default SelectField;
