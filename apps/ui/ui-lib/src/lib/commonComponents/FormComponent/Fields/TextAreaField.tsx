import { Box } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import {
  StyledTextAreaContainer,
  StyledTextAreaField,
  StyledTypography,
} from "./styles";
import {
  fieldStyles,
  labelStyles,
  valueStyles,
  componentStyles,
} from "./TextField";
import { isCopyPasteAllowedForOrg } from "../../../environment";

const TextAreaFieldComponent = ({
  field,
  control,
  watch,
  setValue,
  trigger,
  showValue,
  renderAsTable = false,
}: FieldComponentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle auto-filling for fields that depend on one or more other fields
  if (field.inputDependentField) {
    // Compute a derived dependency value.
    // When inputDependentField is an array, filter out empty values and join them with space.
    const dependentFieldValue = Array.isArray(field.inputDependentField)
      ? field.inputDependentField
          .map((depFieldName) => watch(depFieldName) || "")
          .filter((val) => val.trim().length > 0)
          .join(" ")
      : watch(field.inputDependentField);

    const fieldValue = watch(field.name);
    // Store the previous value of the dependent field(s)
    const prevDependentRef = useRef(dependentFieldValue);

    useEffect(() => {
      // Update only if the displayName exactly matches the previous computed dependency value.
      // This ensures that if the user has manually changed or cleared the value,
      // it will not be overwritten.
      let newValue = dependentFieldValue;

      const maxLength =
        typeof field.rules?.maxLength === "number"
          ? field.rules.maxLength
          : field.rules?.maxLength?.value;

      if (maxLength && newValue?.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      if (fieldValue === prevDependentRef.current) {
        setValue(field.name, newValue);
      }

      prevDependentRef.current = dependentFieldValue;
    }, [dependentFieldValue, fieldValue, field.name, setValue]);
  }

  let showField = true;

  if (field?.apiDependencies?.showCondition) {
    // If the field has a show condition, evaluate it
    showField = field?.apiDependencies?.showCondition(watch);
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    sharedProps: {
      onChange: (value: string) => void;
      inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    }
  ) => {
    const originalValue = e.target.value;
    let newValue = originalValue;
    const { selectionStart, selectionEnd } = e.target;

    if (field?.textTransform === "uppercase") {
      newValue = originalValue.toUpperCase(); // Sanitize input

      if (newValue !== originalValue) {
        sharedProps.onChange(newValue);
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(selectionStart, selectionEnd);
        });
        return;
      }
    }

    sharedProps.onChange(newValue);
  };

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { label, ...restSharedProps } = sharedProps;
        return (
          <StyledTextAreaContainer sx={{ ...(renderAsTable && fieldStyles) }}>
            {/* Label */}
            <StyledTypography
              {...(renderAsTable && labelStyles)}
              variant="body2"
              error={!!sharedProps.error}
            >
              {showValue
                ? field.label
                : field.rules?.required
                ? `${field.label} *`
                : field.label}
            </StyledTypography>
            {showValue ? (
              <StyledTypography {...(renderAsTable && valueStyles)}>
                {sharedProps.value}
              </StyledTypography>
            ) : (
              <StyledTextAreaField
                sx={{ ...(renderAsTable && componentStyles) }}
                {...restSharedProps}
                inputRef={inputRef}
                onBlur={(e) => {
                  sharedProps.onBlur?.(e); // call RHF's internal onBlur
                  // 👇 Trigger validation of dependent fields
                  if (field.dependentFieldsOnBlur && trigger) {
                    trigger(field.dependentFieldsOnBlur);
                  }
                }}
                onChange={(e) =>
                  field?.textTransform === "uppercase"
                    ? handleChange(e, sharedProps)
                    : sharedProps.onChange(e)
                }
                onPaste={(e) => {
                  if (!isCopyPasteAllowedForOrg()) {
                    e.preventDefault();
                  }
                }}
                value={sharedProps.value || ""}
                data-testid={`form-field-${field.type}-${field.name}`}
                error={!!sharedProps.error}
                disabled={field.componentProps?.disabled || !showField}
              />
            )}
          </StyledTextAreaContainer>
        );
      }}
    />
  );
};

export default TextAreaFieldComponent;
