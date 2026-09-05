import { Box, FormHelperText } from "@mui/material";
import dayjs from "dayjs";
import { useState } from "react";
import { DATE_FORMATS } from "../../../constants";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { AddCardIcon } from "./DateField";
import {
  CombinedDatePickerWrapper,
  CombinedDivider,
  StyledLabelTypography,
  StyledPickerBox,
  StyledPickerFormController,
  StyledPickerLabelContainer,
} from "./styles";

const DateRange = ({ field, control, trigger }: FieldComponentProps) => {
  const [fromError, setFromError] = useState<boolean>(false);
  const [toError, setToError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  return (
    <Box>
      <StyledPickerLabelContainer>
        {field?.fromLabel && (
          <StyledLabelTypography
            variant="body2"
            id={`${field?.fromName}-label`}
            error={fromError}
          >
            {field?.fromLabel}
            {field?.rules?.required && " *"}
          </StyledLabelTypography>
        )}
        {field?.toLabel && (
          <StyledLabelTypography
            variant="body2"
            id={`${field?.toName}-label`}
            error={toError}
          >
            {field?.toLabel}
            {field?.rules?.required && " *"}
          </StyledLabelTypography>
        )}
      </StyledPickerLabelContainer>
      <StyledPickerBox  error={fromError || toError}>
        <ControlledField
          field={{
            ...field,
            name: field?.fromName, // Assuming the start date field is named with a prefix
            label: field?.fromLabel,
            rules: field?.rules, // Reuse the same rules if applicable
          }}
          control={control}
          render={(sharedProps) => {
            const { label, value, onChange, helperText, ...rest } = sharedProps; // Extract label from sharedProps
            setFromError(!!rest.error); // Set error state based on the field error
            if (rest?.error && helperText) {
              setErrorMessage(helperText);
            } else {
              setErrorMessage("");
            }

            return (
              <StyledPickerFormController fullWidth>
                <CombinedDatePickerWrapper
                  format={DATE_FORMATS.DATE_MONTH_YEAR}
                  slots={{
                    openPickerIcon: AddCardIcon,
                  }}
                  value={
                    value
                      ? dayjs(value, [
                          DATE_FORMATS.YEAR_MONTH_DATE,
                          DATE_FORMATS.DATE_MONTH_YEAR,
                        ])
                      : null
                  }
                  onChange={(newDate: dayjs.Dayjs | null) => {
                    const formatted = newDate
                      ? dayjs(newDate).format(DATE_FORMATS.YEAR_MONTH_DATE)
                      : "";
                    onChange(formatted ? formatted : newDate);
                    trigger && trigger(field.fromName);
                  }}
                  {...rest} // Pass remaining props
                />
              </StyledPickerFormController>
            );
          }}
        />
        <CombinedDivider />
        <ControlledField
          field={{
            ...field,
            name: field?.toName, // Assuming the end date field is named with a suffix
            label: field?.toLabel,
            rules: field?.rules, // Reuse the same rules if applicable
          }}
          control={control}
          render={(sharedProps) => {
            const { label, value, onChange, helperText, ...rest } = sharedProps; // Extract label from sharedProps
            setToError(!!rest.error); // Set error state based on the field error
            if (rest?.error && helperText) {
              setErrorMessage(helperText);
            } else {
              setErrorMessage("");
            }

            return (
              <StyledPickerFormController fullWidth>
                <CombinedDatePickerWrapper
                  format={DATE_FORMATS.DATE_MONTH_YEAR}
                  slots={{
                    openPickerIcon: AddCardIcon,
                  }}
                  value={
                    value
                      ? dayjs(value, [
                          DATE_FORMATS.YEAR_MONTH_DATE,
                          DATE_FORMATS.DATE_MONTH_YEAR,
                        ])
                      : null
                  }
                  onChange={(newDate: dayjs.Dayjs | null) => {
                    const formatted = newDate
                      ? dayjs(newDate).format(DATE_FORMATS.YEAR_MONTH_DATE)
                      : "";

                    onChange(formatted ? formatted : newDate);
                    trigger && trigger(field.toName);
                  }}
                  {...rest} // Pass remaining props
                />
              </StyledPickerFormController>
            );
          }}
        />
      </StyledPickerBox>
      {(fromError || toError) && (
        <FormHelperText error={fromError || toError}>
          {errorMessage || ""}
        </FormHelperText>
      )}
    </Box>
  );
};

export default DateRange;
