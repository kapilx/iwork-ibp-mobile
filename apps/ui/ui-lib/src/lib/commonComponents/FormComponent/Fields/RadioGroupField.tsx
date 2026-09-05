import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { Checkmark, CustomRadioLabel, HiddenRadioInput, StyledRadioGroupField, StyledRadioGroupFieldFormLabel } from "./styles";

const RadioGroupField = ({ field, control }: FieldComponentProps) => {
  const { options, name, variant = 'default' } = field;

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => (
        <FormControl fullWidth error={!!sharedProps.error}>
          {sharedProps.label && (
            <StyledRadioGroupFieldFormLabel component="legend" >{sharedProps.label}</StyledRadioGroupFieldFormLabel>
          )}

          <RadioGroup
            {...sharedProps}
            aria-label={sharedProps.label}
            name={name}
            value={sharedProps.value}
            onChange={(e) => {
              sharedProps.onChange(e.target.value);
            }}
            row
          >
            {options?.map((option) => {
              if (variant === 'custom') {
                return (
                  <CustomRadioLabel key={option.value}>
                    <HiddenRadioInput
                      type="radio"
                      id={`radio-${option.value}`}
                      value={option.value}
                      checked={sharedProps.value === option.value}
                      onChange={sharedProps.onChange}
                    />
                    <Checkmark htmlFor={`radio-${option.value}`} />
                    {option.label}
                  </CustomRadioLabel>
                );
              }

              // Default MUI radio
              return (
                <FormControlLabel
                  key={String(option.value)}
                  value={option.value}
                  control={<StyledRadioGroupField />}
                  label={option.label}
                />
              );
            })}
          </RadioGroup>

          {sharedProps.error && (
            <FormHelperText>{sharedProps.helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default RadioGroupField;
