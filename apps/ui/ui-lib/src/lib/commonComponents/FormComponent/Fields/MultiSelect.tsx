import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FieldComponentProps } from "../types";
import { useApiSelectField, Option } from "@ui/ui-lib/hooks/useApiSelectField";
import { ControlledField } from "../utils";
import { Box, Fade, MenuItem, Checkbox, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  DynamicFormSelectStyles,
  StyledHelperText,
  StyledTypography,
  StyledAutocomplete,
  ChipContainer,
  CustomChipRendererStyles,
  CheckboxMainContainer,
  FormComponentStyledCheckbox,
  multiSelectCustomStyles,
  HoverContainer,
  HoverIconButton,
} from "./styles";
import { REGEX_PATTERNS } from "../../../constants/regex";
import TextField from "@mui/material/TextField";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  TransitionComponent: Fade,
};

interface MultiSelectFieldProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isFormAnArray?: boolean;
  isChipUsed?: boolean;
}

const MultiSelectField = ({
  field,
  control,
  watch,
  setValue,
  isFormAnArray,
  isChipUsed = false,
  trigger,
}: MultiSelectFieldProps) => {
  const theme = useTheme();
  const { options, apiDependencies, enableSearch } = field;

  let match = "";
  if (isFormAnArray) {
    match =
      field.name.match(REGEX_PATTERNS.MULTI_SECTION_PREFIX_REGEX)?.[0] || "";
  }

  let dynamicOptions: Option[] = [];
  if (apiDependencies) {
    const { options = [] } = useApiSelectField({
      apiDependencies: isFormAnArray
        ? {
            ...apiDependencies,
            dependentField: apiDependencies.dependentField
              ? match + apiDependencies.dependentField
              : apiDependencies.dependentField,
          }
        : apiDependencies,
      watch,
      fieldName: field.name,
    });
    dynamicOptions = [...(options || [])];
  }

  let showField = true;
  if (apiDependencies?.dependentField) {
    showField = !!watch(match + apiDependencies.dependentField);
  }
  if (apiDependencies?.showCondition) {
    showField = apiDependencies.showCondition(watch);
  }

  const optionData = apiDependencies ? dynamicOptions : options;
  const updatedComponentProps = {
    ...field.componentProps,
    disabled: !showField || field.componentProps?.disabled,
  };
  const isDisabled = !showField || field.componentProps?.disabled;

  const chipStyleMap = {
    default: {
      backgroundColor: theme.palette.background.default,
    },
  };

  return (
    <div>
      {optionData && (
        <ControlledField
          field={{
            ...field,
            componentProps: {
              ...updatedComponentProps,
              disabled: isDisabled,
            },
          }}
          control={control}
          render={(sharedProps) => {
            const { onChange, value: rawValue, error, helperText, ...restSharedProps } =
              sharedProps;
            const value = (
              Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []
            ).map((v: any) =>
              v && typeof v === "object" && "value" in v ? v.value : v
            );

            // Values reach react-hook-form as raw option values, or as the whole
            // {value,label} option when storeSelectedOption is set.
            const commit = (selected: any[]) =>
              onChange(
                apiDependencies?.storeSelectedOption
                  ? selected.map(
                      (v) => optionData.find((opt) => opt.value === v) ?? v
                    )
                  : selected
              );

            const handleClear = () => {
              if (isDisabled) {
                return;
              }
              onChange([]);
              trigger && trigger(field.name);
              if (apiDependencies?.clearFieldsOnChange?.length) {
                apiDependencies.clearFieldsOnChange.forEach((fieldName) =>
                  setValue(match + fieldName, null)
                );
              }
            };

            return (
              <Box>
                {field.label && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
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
                  </Box>
                )}

                {enableSearch ? (
                  <FormControl fullWidth error={Boolean(error)}>
                    <StyledAutocomplete
                      multiple
                      disablePortal
                      options={optionData.map((opt) => opt.value)}
                      value={value || []}
                      onChange={(_, newValue) => {
                        if (isDisabled) {
                          return;
                        }
                        commit(newValue as any[]);
                        trigger && trigger(field.name);
                        if (apiDependencies?.clearFieldsOnChange?.length) {
                          apiDependencies.clearFieldsOnChange.forEach(
                            (fieldName) => setValue(match + fieldName, null)
                          );
                        }
                      }}
                      isOptionEqualToValue={(option, val) => option === val}
                      renderOption={(props, option, { index }) => {
                        const { key, ...rest } = props;

                        const label =
                          optionData.find((opt) => opt.value === option.value)
                            ?.label || "";
                        const isSelected = (value || []).includes(option.value);

                        const combinedKey = `${option.value}-${index}`;

                        return (
                          <li key={combinedKey} {...rest}>
                            <CheckboxMainContainer>
                              <FormComponentStyledCheckbox
                                checked={isSelected}
                                size="small"
                              />
                              <Box>{label}</Box>
                            </CheckboxMainContainer>
                          </li>
                        );
                      }}
                      getOptionLabel={(option) => {
                        const found = optionData.find(
                          (opt) => opt.value === option
                        );
                        return found?.label || "";
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={field.placeholder || ""}
                          error={!!error}
                          disabled={isDisabled}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {!isDisabled && (value || []).length > 0 && (
                                  <IconButton
                                    size="small"
                                    onClick={handleClear}
                                    sx={{ mr: 1 }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                )}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                    {error && (
                      <StyledHelperText error={!!error}>
                        {helperText}
                      </StyledHelperText>
                    )}
                  </FormControl>
                ) : (
                  <FormControl
                    fullWidth
                    error={Boolean(error)}
                    sx={{ position: "relative" }}
                  >
                    <HoverContainer>
                      <DynamicFormSelectStyles
                        {...restSharedProps}
                        labelId={`${field.name}-label`}
                        id={`${field.name}-select`}
                        displayEmpty
                        multiple
                        value={value || []}
                        input={<OutlinedInput />}
                        MenuProps={MenuProps}
                        aria-label={field.label || "Multi-select dropdown"}
                        customStyles={multiSelectCustomStyles(theme)}
                        onChange={(event) => {
                          if (isDisabled) {
                            return;
                          }
                          trigger && trigger(field.name);
                          if (apiDependencies?.storeSelectedOption) {
                            commit(event.target.value as any[]);
                          } else {
                            onChange(event);
                          }
                          if (apiDependencies?.clearFieldsOnChange?.length) {
                            apiDependencies.clearFieldsOnChange.forEach(
                              (fieldName) => setValue(match + fieldName, null)
                            );
                          }
                        }}
                        renderValue={(selected) => {
                          const selectedArray = selected as string[];

                          // Render placeholder if nothing selected
                          if (!selectedArray || selectedArray.length === 0) {
                            return (
                              <Box sx={{ color: theme.palette.text.disabled }}>
                                {field.placeholder || "Search"}
                              </Box>
                            );
                          }

                          // Chips mode
                          if (isChipUsed) {
                            return (
                              <ChipContainer>
                                {selectedArray.map((selectedValue) => {
                                  const option = optionData.find(
                                    (opt) => opt.value === selectedValue
                                  );
                                  return option ? (
                                    <CustomChipRendererStyles
                                      key={selectedValue}
                                      value={option.label}
                                      styleMap={chipStyleMap}
                                    />
                                  ) : null;
                                })}
                              </ChipContainer>
                            );
                          }

                          // Label list mode
                          return selectedArray
                            .map((selectedValue) => {
                              const option = optionData.find(
                                (opt) => opt.value === selectedValue
                              );
                              return option?.label || selectedValue;
                            })
                            .join(", ");
                        }}
                      >
                        {optionData.length > 0 ? (
                          optionData.map((option, index) => {
                            const isSelected = (value || []).includes(
                              option.value
                            );
                            return (
                              <MenuItem key={index} value={option.value}>
                                <FormComponentStyledCheckbox
                                  checked={isSelected}
                                  size="small"
                                />
                                {option.label}
                              </MenuItem>
                            );
                          })
                        ) : (
                          <MenuItem disabled>No options available</MenuItem>
                        )}
                      </DynamicFormSelectStyles>

                      {!isDisabled && (value || []).length > 0 && (
                        <HoverIconButton
                          size="small"
                          onClick={handleClear}
                          className="clear-icon"
                          tabIndex={-1}
                          aria-label="clear"
                        >
                          <CloseIcon fontSize="small" />
                        </HoverIconButton>
                      )}

                      {error && (
                        <StyledHelperText error={!!error}>
                          {helperText}
                        </StyledHelperText>
                      )}
                    </HoverContainer>
                  </FormControl>
                )}
              </Box>
            );
          }}
        />
      )}
    </div>
  );
};

export default MultiSelectField;
