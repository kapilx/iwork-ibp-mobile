import { Box, FormControl, FormHelperText } from "@mui/material";
import Checkbox from "../../CheckBox";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import {
  StyledCheckboxDescriptionLabel,
  StyledCheckboxDescriptionOptions,
  StyledTypography,
} from "./styles";

const CheckboxField = ({ field, control }: FieldComponentProps) => {
  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { helperText, value, error, ...checkboxProps } = sharedProps;

        if (Array.isArray(field.options) && field.options.length > 0) {
          const selectedValues = Array.isArray(value) ? value : [];

          return (
            <FormControl sx={{ width: "100%" }}>
              <StyledTypography
                variant="body2"
                error={!!error}
                sx={{ mb: 1.5 }}
              >
                {field.label}
                {field.rules?.required && (
                  <span style={{ color: "#D32F2F", marginLeft: "2px" }}>*</span>
                )}
              </StyledTypography>
              <StyledCheckboxDescriptionOptions sx={{ mt: 0, maxHeight: "none" }}>
                {field.options.map((option) => {
                  const checked = selectedValues.includes(option.value);
                  return (
                    <Box
                      key={String(option.value)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.75,
                        mb: 2.25,
                      }}
                    >
                      <Checkbox
                        isChecked={checked}
                        variant={field.componentProps?.checkboxVariant}
                        disabled={checkboxProps.disabled}
                        onChange={(_, nextChecked) => {
                          const nextValues = nextChecked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter((item) => item !== option.value);
                          checkboxProps.onChange(nextValues);
                        }}
                      />
                      <StyledCheckboxDescriptionLabel
                        sx={{ fontSize: "16px", cursor: "pointer" }}
                        onClick={() => {
                          if (checkboxProps.disabled) return;
                          const nextChecked = !checked;
                          const nextValues = nextChecked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter((item) => item !== option.value);
                          checkboxProps.onChange(nextValues);
                        }}
                      >
                        {option.label}
                      </StyledCheckboxDescriptionLabel>
                    </Box>
                  );
                })}
              </StyledCheckboxDescriptionOptions>
              {sharedProps.error && (
                <FormHelperText error={!!error} data-testid="form-helper-text">
                  {helperText}
                </FormHelperText>
              )}
            </FormControl>
          );
        }

        return (
          <FormControl>
            <Checkbox
              isChecked={!!value}
              variant={field.componentProps?.checkboxVariant}
              {...checkboxProps}
            />
            {sharedProps.error && (
              <FormHelperText error={!!error} data-testid="form-helper-text">
                {helperText}
              </FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
};

export default CheckboxField;
