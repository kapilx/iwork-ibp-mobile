import { FormControl, FormHelperText } from "@mui/material";
import { useEffect, useState } from "react";
import { Option, useApiSelectField } from "@ui/ui-lib/hooks/useApiSelectField";
import { StyledTextField } from "../FormComponent/Fields/styles";
import { FieldComponentProps } from "../FormComponent/types";
import { ControlledField } from "../FormComponent/utils";
import {
  CurrencyInputStyledBox,
  CurrencyInputStyledDivider,
  CurrencyInputStyledTypography,
} from "./styles";
import {
  countDigitsBeforeIndex,
  findIndexAfterNDigits,
  formatNumberInputByLocalization,
  LocalizationConfig,
} from "../../utils";
import { useLocalization } from "../../hooks/useLocalization";
import { isCopyPasteAllowedForOrg } from "@ui/ui-lib/environment";

const CurrencyInput = ({ field, control, watch }: FieldComponentProps) => {
  const { options, apiDependencies } = field;

  let dynamicOptions: Option[] = [];
  if (apiDependencies) {
    const { options = [] } = useApiSelectField({
      apiDependencies: apiDependencies,
      watch,
      fieldName: field.name,
    });

    dynamicOptions = [...(options || [])];
  }

  const dependentFieldKey = field?.apiDependencies?.dependentField;
  const dependentValue = watch(dependentFieldKey); // Watch dynamic field

  // Filter dynamicOptions based on dependentValue and get the label
  const getSelectedLabel = () => {
    if (!dependentValue || !dynamicOptions.length) return "";

    const matchedOption = dynamicOptions.find(
      (option) => option.value === dependentValue
    );
    return matchedOption ? matchedOption.label : "";
  };

  const [selectedKey, setSelectedKey] = useState(getSelectedLabel() || "");
  const { localizationData } = useLocalization();
  const localization: LocalizationConfig | undefined = localizationData?.data;

  useEffect(() => {
    const newLabel = getSelectedLabel();
    if (newLabel && newLabel !== selectedKey) {
      setSelectedKey(newLabel);
    }
  }, [dependentValue, dynamicOptions]); // Added dynamicOptions to dependencies

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => (
        <FormControl fullWidth error={!!sharedProps.error}>
          {sharedProps.label && (
            <CurrencyInputStyledTypography>
              {sharedProps.label}
            </CurrencyInputStyledTypography>
          )}

          <StyledTextField
            {...sharedProps}
            label=""
            type="text"
            value={
              field.formatNumber &&
                sharedProps.value !== null &&
                sharedProps.value !== undefined &&
                sharedProps.value !== "" &&
                !isNaN(Number(sharedProps.value))
                ? formatNumberInputByLocalization(
                  Number(sharedProps.value),
                  localization
                )
                : sharedProps.value ?? ""
            }
            onPaste={(e) => {
              if (!isCopyPasteAllowedForOrg()) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const input = e.target;
              const rawInput = input.value;
              const raw = rawInput.replace(/,/g, "");

              if (!/^\d*$/.test(raw)) return;

              const prevRaw = (sharedProps.value || "")
                .toString()
                .replace(/,/g, "");
              const cursorPos = input.selectionStart ?? rawInput.length;

              sharedProps.onChange(raw);

              requestAnimationFrame(() => {
                const formatted = formatNumberInputByLocalization(
                  Number(raw),
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
                input.setSelectionRange(newCursorPos, newCursorPos);
              });
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <CurrencyInputStyledBox>
                  {selectedKey}
                  <CurrencyInputStyledDivider orientation="vertical" flexItem />
                </CurrencyInputStyledBox>
              ),
            }}
          />

          {sharedProps.error && (
            <FormHelperText>{sharedProps.helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default CurrencyInput;
