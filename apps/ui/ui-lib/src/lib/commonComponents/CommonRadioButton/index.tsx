import React from "react";
import { FormHelperText, RadioProps } from "@mui/material";
import {
  CommonRadioButtonStyledFormControl,
  StyledFormControlLabel,
  StyledRadio,
} from "./styles";

interface RadioButtonProps extends RadioProps {
  label: string;
  value: string | number;
  error?: string;
  helperText?: string;
  customStyles?: {
    container?: React.CSSProperties;
    label?: React.CSSProperties;
    radio?: React.CSSProperties;
  };
}

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  value,
  error,
  helperText,
  customStyles,
  ...radioProps
}) => {
  return (
    <CommonRadioButtonStyledFormControl style={customStyles?.container}>
      <StyledFormControlLabel
        control={
          <StyledRadio
            disableRipple
            customStyles={customStyles?.radio}
            {...radioProps}
          />
        }
        label={label}
        value={value}
        customStyles={customStyles?.label}
      />
      {error && (
        <FormHelperText error={!!error} data-testid="form-helper-text">
          {helperText || error}
        </FormHelperText>
      )}
    </CommonRadioButtonStyledFormControl>
  );
};

export default RadioButton;
