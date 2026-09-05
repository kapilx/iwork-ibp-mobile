import { Box, InputAdornment } from "@mui/material";
import React, { useRef } from "react";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import {
  StyledTextField,
  StyledTypography,
  StyledHelperTypography,
} from "./styles";
import {
  countDigitsBeforeIndex,
  findIndexAfterNDigits,
  formatNumberInputByLocalization,
  LocalizationConfig,
} from "../../../utils";
import { useLocalization } from "../../../hooks/useLocalization";
import { isCopyPasteAllowedForOrg } from "../../../environment";

const NumberFieldComponent = ({
  field,
  control,
  watch,
  setValue,
  trigger,
}: FieldComponentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { localizationData } = useLocalization();
  const localization: LocalizationConfig | undefined = localizationData?.data;
  const lastKeyRef = useRef<string | null>(null);
  const isDecimal = field.isDecimal === true;
  const allowNegative = field.allowNegative === true;

  let totalProduct: number | undefined;

  if (field.calculations?.calculateAmount) {
    const product = field.calculations.calculateAmount
      .map((fieldName) => {
        const fieldValue = watch(fieldName);
        return parseFloat(fieldValue);
      })
      .filter((num) => !isNaN(num))
      .reduce((acc, curr) => acc * curr, 1);

    const currentFieldValue = parseFloat(watch(field.name));
    if (!isNaN(currentFieldValue) && currentFieldValue !== 0) {
      totalProduct = parseFloat(
        ((product * currentFieldValue) / 100).toFixed(4)
      );
    }
  }

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { label, ...restSharedProps } = sharedProps;

        const liveValue = watch(field.name);

        const formatValueForDisplay = (
          value: string | number | null | undefined
        ): string => {
          if (value === null || value === undefined || value === "") {
            return "";
          }

          const rawString = String(value);
          const sanitized = rawString.replace(/,/g, "");

          if (isDecimal) {
            const isPartialDecimal =
              (allowNegative && sanitized === "-") ||
              sanitized === "." ||
              (allowNegative && sanitized === "-.") ||
              sanitized.endsWith(".");
            if (isPartialDecimal) {
              return rawString;
            }
            const decimalPattern = allowNegative
              ? /^-?\d*\.?\d*$/
              : /^\d*\.?\d*$/;
            if (!decimalPattern.test(sanitized)) {
              return rawString;
            }
          } else {
            const integerPattern = allowNegative
              ? /^-?\d+(\.\d+)?$/
              : /^\d+(\.\d+)?$/;
            if (!integerPattern.test(sanitized)) {
              return rawString;
            }
          }

          if (!allowNegative && sanitized.startsWith("-")) {
            return rawString;
          }

          const numericValue = Number(sanitized);
          if (Number.isNaN(numericValue)) {
            return rawString;
          }

          const formatted = formatNumberInputByLocalization(
            numericValue,
            localization
          );

          if (!rawString.includes(".")) {
            return formatted;
          }

          const [, rawFraction = ""] = rawString.split(".");
          const [formattedInt] = formatted.split(".");
          if (!rawFraction) {
            return formattedInt;
          }

          const desiredLength = Math.min(rawFraction.length, 4);
          const finalFraction = rawFraction
            .slice(0, desiredLength)
            .padEnd(desiredLength, "0");

          return `${formattedInt}.${finalFraction}`;
        };

        return (
          <Box>
            <StyledTypography variant="body2" error={!!sharedProps.error}>
              {field.rules?.required ? `${field.label} *` : field.label}
            </StyledTypography>

            <StyledTextField
              {...restSharedProps}
              inputRef={inputRef}
              type="text"
              onBlur={(e) => {
                sharedProps.onBlur?.(e);
                if (field.dependentFieldsOnBlur && trigger) {
                  trigger(field.dependentFieldsOnBlur);
                }

                const raw = (sharedProps.value || "")
                  .toString()
                  .replace(/,/g, "");
                const numeric = Number(raw);
                if (!Number.isNaN(numeric)) {
                  const minProp = field.componentProps?.inputProps?.min;
                  const min =
                    minProp !== undefined
                      ? Number(minProp)
                      : allowNegative
                      ? undefined
                      : 0;
                  const max = field.componentProps?.inputProps?.max;
                  let boundedValue = numeric;
                  if (min !== undefined && boundedValue < min)
                    boundedValue = min;
                  if (max !== undefined && boundedValue > max)
                    boundedValue = max;

                  // Round to 2 decimal places for decimal fields
                  if (isDecimal) {
                    boundedValue = parseFloat(boundedValue.toFixed(4));
                  }

                  const currentRaw = (sharedProps.value ?? "")
                    .toString()
                    .replace(/,/g, "");
                  const currentNumeric = Number(currentRaw);
                  if (
                    Number.isNaN(currentNumeric) ||
                    !Object.is(currentNumeric, boundedValue)
                  ) {
                    setValue(field.name, boundedValue);
                  }
                }
              }}
              onChange={(e) => {
                const input = e.target;
                const rawInput = input.value;
                const raw = rawInput.replace(/,/g, "");

                const decimalRegex = isDecimal
                  ? allowNegative
                    ? /^-?\d*\.?\d*$/
                    : /^\d*\.?\d*$/
                  : allowNegative
                  ? /^-?\d*$/
                  : /^\d*$/;
                if (!decimalRegex.test(raw)) return;

                const cursorPos = input.selectionStart ?? rawInput.length;

                sharedProps.onChange(raw);

                if (!isDecimal) {
                  requestAnimationFrame(() => {
                    if (!inputRef.current) return;

                    const formatted = formatNumberInputByLocalization(
                      parseFloat(raw),
                      localization
                    );
                    const digitCountBeforeCursor = countDigitsBeforeIndex(
                      rawInput,
                      cursorPos
                    );
                    const newCursorPos = findIndexAfterNDigits(
                      formatted,
                      digitCountBeforeCursor
                    );

                    inputRef.current.setSelectionRange(
                      newCursorPos,
                      newCursorPos
                    );
                  });
                } else {
                  lastKeyRef.current = null;
                }
              }}
              onPaste={(e) => {
                if (!isCopyPasteAllowedForOrg()) {
                  e.preventDefault();
                }
                const pasted = e.clipboardData.getData("Text");
                const regex = isDecimal
                  ? allowNegative
                    ? /^-?\d*\.?\d*$/
                    : /^\d*\.?\d*$/
                  : allowNegative
                  ? /^-?\d+$/
                  : /^\d+$/;
                if (!regex.test(pasted)) {
                  e.preventDefault();
                }
              }}
              onKeyPress={(e) => {
                const input = e.currentTarget;
                if (isDecimal) {
                  lastKeyRef.current = e.key;
                  const inputValue = inputRef.current?.value ?? "";
                  if (e.key === "." && inputValue.includes(".")) {
                    e.preventDefault();
                  } else if (
                    allowNegative &&
                    e.key === "-" &&
                    (inputValue.includes("-") ||
                      (input.selectionStart ?? 0) !== 0)
                  ) {
                    e.preventDefault();
                  } else if (
                    !/[0-9.]/.test(e.key) &&
                    !(allowNegative && e.key === "-")
                  ) {
                    e.preventDefault();
                  }
                } else {
                  if (
                    allowNegative &&
                    e.key === "-" &&
                    ((input.selectionStart ?? 0) !== 0 ||
                      inputRef.current?.value.includes("-"))
                  ) {
                    e.preventDefault();
                  } else if (
                    !/[0-9]/.test(e.key) &&
                    !(allowNegative && e.key === "-")
                  ) {
                    e.preventDefault();
                  }
                }
              }}
              value={
                field.formatNumber
                  ? formatValueForDisplay(liveValue)
                  : liveValue ?? ""
              }
              InputProps={{
                ...sharedProps.InputProps,
                startAdornment: (field?.componentProps?.leftIcon ||
                  field?.componentProps?.leftIconUrl) && (
                  <InputAdornment position="start" className="start-adornment">
                    {React.isValidElement(field.componentProps.leftIcon) ? (
                      field.componentProps.leftIcon
                    ) : typeof field.componentProps.leftIcon === "function" ? (
                      React.createElement(field.componentProps.leftIcon)
                    ) : field.componentProps.leftIconUrl ? (
                      <img
                        src={field.componentProps.leftIconUrl}
                        alt="left-icon"
                      />
                    ) : null}
                  </InputAdornment>
                ),
                endAdornment: field?.componentProps?.rightIconUrl ? (
                  <InputAdornment position="end" className="end-adornment">
                    <img
                      src={field.componentProps.rightIconUrl}
                      alt="right-icon"
                    />
                  </InputAdornment>
                ) : (
                  field?.componentProps?.rightIcon && (
                    <InputAdornment position="end" className="end-adornment">
                      {typeof field.componentProps.rightIcon === "string"
                        ? field.componentProps.rightIcon
                        : typeof field.componentProps.rightIcon === "function"
                        ? React.createElement(field.componentProps.rightIcon)
                        : null}
                    </InputAdornment>
                  )
                ),
                onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
                  if (document.activeElement === inputRef.current) {
                    inputRef.current?.blur();
                  }
                },
                inputProps: {
                  ...(field.componentProps?.inputProps || {}),
                  ...(sharedProps.InputProps?.inputProps || {}),
                  inputMode: isDecimal ? "decimal" : "numeric",
                  pattern: isDecimal
                    ? allowNegative
                      ? "[-0-9.]*"
                      : "[0-9.]*"
                    : allowNegative
                    ? "[-0-9]*"
                    : "[0-9]*",
                },
              }}
              data-testid={`form-field-${field.type}-${field.name}`}
              error={!!sharedProps.error}
              customStyles={field.componentProps?.customStyles}
            />
            <StyledHelperTypography variant="body2">
              {field.calculations?.calculateAmount?.length > 0 &&
                totalProduct !== undefined &&
                totalProduct !== 0 &&
                `The Estimated brokerage amount is: ${totalProduct}`}
            </StyledHelperTypography>
            {typeof field.helperText === "function"
              ? (field.helperText as (value: unknown) => React.ReactNode)(
                  liveValue
                )
              : field.helperText ?? null}
          </Box>
        );
      }}
    />
  );
};

export default NumberFieldComponent;
