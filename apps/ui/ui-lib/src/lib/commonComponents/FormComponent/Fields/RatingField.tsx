import { FormControl, FormHelperText, Rating } from "@mui/material";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";

const RatingField = ({ field, control }: FieldComponentProps) => {
  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => (
        <FormControl fullWidth>
          <Rating {...sharedProps} value={Number(sharedProps.value)} />
          {sharedProps.error && (
            <FormHelperText error={!!sharedProps.error}>
              {sharedProps.helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default RatingField;
