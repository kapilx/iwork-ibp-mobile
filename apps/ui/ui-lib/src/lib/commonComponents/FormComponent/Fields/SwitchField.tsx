import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from "@mui/material";
import { ControlledField } from "../utils";
import { FieldComponentProps } from "../types";

const SwitchField = ({ field, control }: FieldComponentProps) => (
  <ControlledField
    field={field}
    control={control}
    render={(sharedProps) => {
      const { helperText, value, ...switchProps } = sharedProps;
      return (
        <FormControl fullWidth>
          <FormControlLabel
            control={<Switch {...switchProps} checked={!!value} />}
            label={sharedProps.label}
          />
          {sharedProps.error && (
            <FormHelperText error={!!sharedProps.error}>
              {helperText}
            </FormHelperText>
          )}
        </FormControl>
      );
    }}
  />
);

export default SwitchField;
