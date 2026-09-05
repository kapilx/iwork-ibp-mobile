import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
} from "@mui/material";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";

interface RadioFieldComponentProps extends FieldComponentProps {
  option: any;
}

const RadioField = ({ field, control, option }: RadioFieldComponentProps) => {
  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => (
        <FormControl fullWidth>
          <FormControlLabel
            control={<Radio />}
            label={sharedProps.label}
            value={option.value}
          />
          {sharedProps.error && (
            <FormHelperText error={!!sharedProps.error} data-testid="form-helper-text">
              {sharedProps.helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default RadioField;
