import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import React, { useEffect, useRef, useState } from "react";
import { PASSWORD, TEXT } from "../../../constants";
import { StyledTextField, StyledTypography } from "./styles";
import { isCopyPasteAllowedForOrg } from "../../../environment"
export const fieldStyles = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "40px",
  width: "100%",
  padding: "12px",
  borderBottom: "1px solid #E0E0E0",
};
export const labelStyles = {
  width: "40%",
  fontSize: "14px",
  textAlign: "left",
};
export const valueStyles = {
  width: "60%",
  fontSize: "14px",
  textAlign: "left",
};

export const componentStyles = {
  width: "60%",
};

const TextFieldComponent = ({
  field,
  control,
  watch,
  setValue,
  trigger,
  customStyles,
  showValue = false,
  renderAsTable = false,
}: FieldComponentProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(
    field?.componentProps?.preventAutocomplete === true
  );
  const isPasswordField = field?.componentProps?.type === PASSWORD;
  const disableBrowserPasswordManager = field?.componentProps?.disableBrowserPasswordManager === true;
  const inputType = field?.componentProps?.type;
  const inputRef = useRef<HTMLInputElement>(null);
  
  // If disableBrowserPasswordManager is true: always use TEXT to prevent browser detection
  // If false: use standard password behavior with show/hide toggle
  const computedType = isPasswordField && disableBrowserPasswordManager
    ? TEXT // Always TEXT to prevent browser password manager
    : isPasswordField
    ? showPassword
      ? TEXT
      : PASSWORD
    : field?.componentProps?.type || TEXT;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (field?.componentProps?.preventAutocomplete) {
      setIsReadOnly(false);
    }
    field?.componentProps?.onFocus?.(e);
  };

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

  const isNumberLike = inputType === "number" || inputType === "tel";

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
      newValue = originalValue.toUpperCase();
      
      // Always call onChange with the transformed value
      sharedProps.onChange(newValue);
      
      // Restore cursor position only if the value was actually transformed
      if (newValue !== originalValue && selectionStart !== null && selectionEnd !== null) {
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(selectionStart, selectionEnd);
        });
      }
      return;
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
          <Box
            sx={{
              ...(renderAsTable && fieldStyles),
            }}
          >
            {/* Label */}
            <StyledTypography
              variant="body2"
              error={!!sharedProps.error}
              {...(renderAsTable && labelStyles)}
            >
              {showValue
                ? field.label
                : field.rules?.required
                ? `${field.label} *`
                : field.label}
            </StyledTypography>
            {showValue ? (
              <StyledTypography
                variant="body2"
                {...(renderAsTable && valueStyles)}
              >
                {sharedProps.value}
              </StyledTypography>
            ) : (
              <>
                <StyledTextField
                  name={field.name}
                  {...restSharedProps}
                  inputRef={inputRef}
                  error={!!sharedProps.error}
                  //  autoComplete={field?.componentProps?.autoComplete || "off"}
                  sx={{
                    ...(isPasswordField && disableBrowserPasswordManager && !showPassword && {
                      '& input': {
                        WebkitTextSecurity: 'disc',
                        MozTextSecurity: 'disc',
                        textSecurity: 'disc',
                      }
                    })
                  }}
                  onBlur={(e) => {
                    sharedProps.onBlur?.(e); // call RHF's internal onBlur
                    if (field.dependentFieldsOnBlur && trigger) {
                      trigger(field.dependentFieldsOnBlur);
                    }
                  }}
                  // onFocus={handleFocus}
                  type={computedType === "number" ? "tel" : computedType}
                  inputProps={{
                    inputMode: isNumberLike ? "numeric" : undefined,
                    pattern: isNumberLike ? "[0-9]*" : undefined,
                    ...sharedProps.inputProps,
                    // readOnly: isReadOnly,
                  }}
                  onChange={(e) => {
                    field?.textTransform === "uppercase"
                      ? handleChange(e, sharedProps)
                      : sharedProps.onChange(e);
                  }}
                  onKeyPress={(e) => {
                    if (isNumberLike && !/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    if(field?.componentProps?.enableCopyPaste){
                        return;
                    }
                    if (!isCopyPasteAllowedForOrg()) {
                      e.preventDefault();
                    }
                  }}
                  value={sharedProps.value || ""}
                  InputProps={{
                    ...sharedProps.InputProps,
                    startAdornment: (field?.componentProps?.leftIcon ||
                      field?.componentProps?.leftIconUrl) && (
                      <InputAdornment
                        position="start"
                        className="start-adornment"
                      >
                        {React.isValidElement(field.componentProps.leftIcon) ? (
                          field.componentProps.leftIcon
                        ) : typeof field.componentProps.leftIcon ===
                          "function" ? (
                          React.createElement(field.componentProps.leftIcon)
                        ) : field.componentProps.leftIconUrl ? (
                          <img
                            src={field.componentProps.leftIconUrl}
                            alt="left-icon"
                          />
                        ) : null}
                      </InputAdornment>
                    ),
                    endAdornment: isPasswordField ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <Visibility sx={{ ...field.componentProps?.iconStyles }} /> : <VisibilityOff sx={{ ...field.componentProps?.iconStyles }} />}
                        </IconButton>
                      </InputAdornment>
                    ) : field?.componentProps?.rightIconUrl ? (
                      <InputAdornment position="end" className="end-adornment">
                        <img
                          src={field.componentProps.rightIconUrl}
                          alt="right-icon"
                        />
                      </InputAdornment>
                    ) : (
                      field?.componentProps?.rightIcon && (
                        <InputAdornment
                          position="end"
                          className="end-adornment"
                        >
                          {typeof field.componentProps.rightIcon === "string"
                            ? field.componentProps.rightIcon
                            : typeof field.componentProps.rightIcon ===
                              "function"
                            ? React.createElement(
                                field.componentProps.rightIcon
                              )
                            : null}
                        </InputAdornment>
                      )
                    ),
                  }}
                  data-testid={`form-field-${field.type}-${field.name}`}
                  customStyles={field.componentProps?.customStyles}
                  componentStyles={renderAsTable ? componentStyles : undefined}
                />

                {/* Show error message if validation fails */}
                {sharedProps.error && (
                  <StyledTypography variant="caption" error>
                    {sharedProps.error.message || sharedProps.error}
                  </StyledTypography>
                )}
              </>
            )}
          </Box>
        );
      }}
    />
  );
};

export default TextFieldComponent;
