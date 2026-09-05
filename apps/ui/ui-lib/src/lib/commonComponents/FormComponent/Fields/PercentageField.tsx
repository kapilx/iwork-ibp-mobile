import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { StyledTextField, StyledTypography } from "./styles";
import { isCopyPasteAllowedForOrg } from "@ui/ui-lib/environment";

const PercentageField = ({
  field,
  control,
  watch,
  setValue,
  trigger,
}: FieldComponentProps) => {
  const [fieldA, fieldB] = field.percentageFields || [];

  const valueA = fieldA ? watch(fieldA) : undefined;
  const valueB = fieldB ? watch(fieldB) : undefined;
  const percentageValue = watch(field.name);

  const lastChangedField = useRef<string | null>(null);

  useEffect(() => {
    const subscription = watch((_, { name }) => {
      if (name === fieldA || name === fieldB || name === field.name) {
        lastChangedField.current = name ?? null;
      }
    });

    return () => subscription.unsubscribe?.();
  }, [watch, fieldA, fieldB, field.name]);

  useEffect(() => {
    if (!fieldA || !fieldB) return;

    const numA = Number(valueA);
    const numB = Number(valueB);
    const numPercentage = Number(percentageValue);

    const activeInput = document.activeElement as HTMLElement | null;
    const isTypingInPercentage =
      activeInput?.getAttribute("name") === field.name;
    const isTypingInFieldA = activeInput?.getAttribute("name") === fieldA;

    if (
      (lastChangedField.current === fieldA ||
        lastChangedField.current === fieldB) &&
      !isTypingInPercentage
    ) {
      if (!isNaN(numA) && !isNaN(numB) && numB !== 0) {
        const newPercentage = (numA / numB) * 100;
        const roundedPercentage = Number(newPercentage.toFixed(2));
        if (Number(percentageValue) !== roundedPercentage) {
          setValue(field.name, roundedPercentage, { shouldDirty: true });
        }
      }
    } else if (lastChangedField.current === field.name && !isTypingInFieldA) {
      if (!isNaN(numPercentage) && !isNaN(numB)) {
        const newValueA = (numPercentage * numB) / 100;
        const roundedValueA = Number(newValueA.toFixed(2));
        if (Number(valueA) !== roundedValueA) {
          setValue(fieldA, roundedValueA, { shouldDirty: true });
        }
      }
    }
  }, [valueA, valueB, percentageValue, setValue, fieldA, fieldB, field.name]);

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { label, ...restSharedProps } = sharedProps;

        return (
          <Box>
            <StyledTypography variant="body2" error={!!sharedProps.error}>
              {field.rules?.required ? `${field.label} *` : field.label}
            </StyledTypography>

            <StyledTextField
              name={field.name}
              {...restSharedProps}
              onBlur={(e) => {
                sharedProps.onBlur?.(e);
                if (field.dependentFieldsOnBlur && trigger) {
                  trigger(field.dependentFieldsOnBlur);
                }

                // Format to fixed 2 decimal places on blur
                const currentValue = Number(sharedProps.value);
                if (!isNaN(currentValue)) {
                  const formattedValue = Number(currentValue.toFixed(2));
                  if (currentValue !== formattedValue) {
                    setValue(field.name, formattedValue, { shouldDirty: true });
                  }
                }
              }}
              onPaste={(e) => {
                if (!isCopyPasteAllowedForOrg()) {
                  e.preventDefault();
                }
              }}
              inputProps={{
                inputMode: "decimal",
                pattern: "[0-9.]*",
                ...sharedProps.inputProps,
              }}
              value={sharedProps.value ?? ""}
              data-testid={`form-field-${field.type}-${field.name}`}
              error={!!sharedProps.error}
              customStyles={field.componentProps?.customStyles}
            />
          </Box>
        );
      }}
    />
  );
};

export default PercentageField;
