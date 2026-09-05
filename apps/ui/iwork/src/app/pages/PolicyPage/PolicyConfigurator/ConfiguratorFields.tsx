import React, { useState, useEffect } from "react";
import { Box, IconButton, InputAdornment } from "@mui/material";
import { CommonTextField } from "@ui/ui-lib";
import {
  PolicyComponent,
  SumInsuredOption,
  COMMA_FORMATTING,
  COMMA_SEPARATOR,
  SumInsuredModel,
} from "./policytypes";
import { MAX_DECIMALS_FLAT, MAX_DECIMALS_MULTIPLE } from "../../../constants";
import { isExistingSumInsured } from "../utils/liveEditHelpers";
import {
  formatIndianNumbering,
  formatInternationalNumbering,
  escapeRegExp,
} from "../utils/formatters";
import { RemoveIcon } from "./styles";
import removeIcon from "../../../assets/svgs/remove-card.svg";
import { ErrorTextContainer, ErrorTextSpan } from "./styles";
export const fieldHighlightSx = {
  "& .MuiOutlinedInput-root": {
    border: "1px solid #E15857 !important", // HotPink with alpha
  },
};

export const createNewSumInsuredOption = (id: number): SumInsuredOption => ({
  id: id,
  value: "",
});

interface SumInsuredInputFieldProps {
  option: SumInsuredOption;
  // index: number; // index might not be strictly needed if key is option.id
  component: PolicyComponent; // Used for generating unique ID
  onChangeCallback: (optionId: number, newValue: string) => void;
  onRemoveCallback: (optionId: number) => void;
  isReviewMode: boolean;
  showHighlight?: boolean;
  label?: string; // Optional label prop
  isLiveEditMode?: boolean;
  liveEditSnapshot?: PolicyComponent[];
  isExistingComponent?: boolean; // Flag indicating if the parent component is existing
}

export const SumInsuredInputField: React.FC<SumInsuredInputFieldProps> = ({
  option,
  component,
  onChangeCallback,
  onRemoveCallback,
  isReviewMode,
  showHighlight,
  label,
  isLiveEditMode,
  liveEditSnapshot,
  isExistingComponent,
}) => {
  // Helper to get the formatted display version of a raw numeric string
  const displayLabel = label || "SI Amount"; // Default label if not provided
  const getFormattedDisplay = (val: string) => {
    if (val && !isNaN(parseFloat(val))) {
      if (COMMA_FORMATTING === "CRORE")
        return formatIndianNumbering(val, COMMA_SEPARATOR);
      if (COMMA_FORMATTING === "MILLION")
        return formatInternationalNumbering(val, COMMA_SEPARATOR);
    }
    return val; // Return as is if not a number or no formatting configured
  };

  // Helper to get the raw numeric string from a potentially formatted display string
  const getRawNumericString = (val: string) => {
    return String(val).replace(
      new RegExp(escapeRegExp(COMMA_SEPARATOR), "g"),
      "",
    );
  };

  const [displayValue, setDisplayValue] = useState(
    getFormattedDisplay(option.value),
  );
  const inputId = `si-${component.id}-${option.id}`;

  useEffect(() => {
    // This effect synchronizes displayValue with option.value when option.value changes externally.
    // It respects the focus state to avoid disrupting user input.
    const element = document.getElementById(inputId);
    const isFocused = document.activeElement === element;

    if (isFocused) {
      // If focused, and the underlying raw value of displayValue is different from option.value,
      // update displayValue to the raw option.value. This handles external changes while focused.
      const currentRawDisplay = getRawNumericString(displayValue);
      if (currentRawDisplay !== option.value) {
        setDisplayValue(option.value); // Show raw value from prop
      }
    } else {
      // If not focused, ensure displayValue is the formatted version of option.value.
      // Only update if it's actually different to prevent unnecessary re-renders.
      const newFormattedPropValue = getFormattedDisplay(option.value);
      if (displayValue !== newFormattedPropValue) {
        setDisplayValue(newFormattedPropValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option.value, inputId]); // displayValue is intentionally omitted from deps to avoid loops with setDisplayValue

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Only allow numbers and one decimal point - no commas while typing
    let filteredValue = rawValue.replace(/[^0-9.]/g, "");
    const parts = filteredValue.split(".");

    // Ensure only one decimal point
    if (parts.length > 2) {
      filteredValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Determine max decimal places based on sumInsuredModel
    const maxDecimals =
      component.sumInsuredModel === SumInsuredModel.MULTIPLE
        ? MAX_DECIMALS_MULTIPLE
        : MAX_DECIMALS_FLAT;

    // Limit decimal places based on sumInsuredModel
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];

      if (decimalPart.length > maxDecimals) {
        filteredValue =
          integerPart + "." + decimalPart.substring(0, maxDecimals);
      }
    }

    setDisplayValue(filteredValue);
    // DO NOT call onChangeCallback here. It will be called onBlur.
  };

  const handleInputBlur = () => {
    const rawNumeric = getRawNumericString(displayValue);
    let finalNumericValue = "";

    if (rawNumeric !== "" && !isNaN(parseFloat(rawNumeric))) {
      finalNumericValue = rawNumeric; // Valid number
    } else if (component.type === "optional") {
      // FR-054: blank SI on an optional component is treated as 0 so downstream
      // (backend persistence, premium calculator) always sees a numeric value.
      finalNumericValue = "0";
    } // else, it remains "", effectively clearing if input was invalid/empty

    onChangeCallback(option.id, finalNumericValue); // Update parent state
    setDisplayValue(getFormattedDisplay(finalNumericValue)); // Format for display
  };

  const handleInputFocus = () => {
    // When focusing, show the raw numeric value without commas
    setDisplayValue(getRawNumericString(option.value));
  };

  const numericValue = parseFloat(option.value.replace(/,/g, ""));
  // FR-054: SI=0 is accepted for any optional component, not just benefit components.
  // A blank value on an optional component is treated as 0 — also valid.
  const allowZero = component.type === "optional";
  const isBlank = !option.value.trim();
  const isInvalidValue = allowZero
    ? !isBlank && (isNaN(numericValue) || numericValue < 0)
    : isBlank || isNaN(numericValue) || numericValue <= 0;
  const errorText = `${displayLabel.replace(/\*$/, "")} must be > 0`;

  // Check if this sum insured can be deleted
  const canDeleteSumInsured = !(
    isLiveEditMode &&
    isExistingSumInsured(component.id, String(option.id), liveEditSnapshot)
  );

  // Check if this specific sum insured is existing (read-only for existing ones)
  const isExistingSumInsuredOption =
    isLiveEditMode &&
    isExistingSumInsured(component.id, String(option.id), liveEditSnapshot);

  // Field is disabled if in review mode OR if it's an existing sum insured in LIVE mode
  const isFieldDisabled = isReviewMode || isExistingSumInsuredOption;

  return (
    <Box
      key={option.id}
      sx={{ mr: 1, mb: 1 }}
      data-testid={`sum-insured-field-${option.id}`}
    >
      <CommonTextField
        id={inputId}
        dataTestId={inputId}
        label={displayLabel}
        type="text" // Keep as text to allow commas during typing
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        variant="outlined"
        size="small"
        disabled={isFieldDisabled}
        sx={{
          width: "145px",
          "& .MuiInputBase-input": { fontSize: "0.875rem", py: "10px" },
          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
          "& .MuiOutlinedInput-root": { pr: "4px", height: "44.6px" },
        }}
        InputProps={{
          readOnly: isFieldDisabled,
          ...(component.sumInsuredOptions.length > 1 &&
            !isReviewMode &&
            canDeleteSumInsured && {
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0 }}>
                  <IconButton
                    onClick={() => onRemoveCallback(option.id)}
                    size="small"
                    edge="end"
                    sx={{ p: 0.25 }}
                    data-testid={`remove-sum-insured-${inputId}`}
                  >
                    <RemoveIcon src={removeIcon} />
                  </IconButton>
                </InputAdornment>
              ),
            }),
        }}
        error={showHighlight && isInvalidValue && !isFieldDisabled}
        helperText={
          <ErrorTextContainer>
            <ErrorTextSpan
              show={!!(showHighlight && isInvalidValue && !isFieldDisabled)}
            >
              {errorText}
            </ErrorTextSpan>
          </ErrorTextContainer>
        }
      />
    </Box>
  );
};
