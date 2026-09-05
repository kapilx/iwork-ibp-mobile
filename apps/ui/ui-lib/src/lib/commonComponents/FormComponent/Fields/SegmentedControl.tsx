import React from "react";
import { FieldComponentProps } from "../types";
import {
  SegmentedControlContainer,
  SegmentedControlFormWrapper,
  SegmentedControlLabel,
  Segment,
  StyledHelperText,
} from "./styles";
import { ControlledField } from "../utils";
import { useApiSelectField } from "@ui/ui-lib/hooks/useApiSelectField";

const SegmentedControl: React.FC<FieldComponentProps> = ({
  field,
  control,
  watch,
  trigger,
  setValue,
  enableSmartSearch = false,
}) => {
  const inlineLabel = Boolean(field?.componentProps?.inlineLabel);
  const labelMinWidth = field?.componentProps?.labelMinWidth ?? 140;
  const labelCustomStyles = field?.componentProps?.labelCustomStyles;
  const wrapSegments = Boolean(field?.componentProps?.wrapSegments);

  let showField = true;
  if (field?.apiDependencies?.showCondition) {
    showField = field?.apiDependencies?.showCondition(watch);
  }

  const shouldClearValue = field?.componentProps?.shouldClearValue ?? false;

  return (
    <ControlledField
      field={field}
      control={control}
      render={({ value, onChange, error, helperText }) => {
        const handleChange = (newValue1: object | string | number | null) => {
          let newValue = newValue1;
          if (shouldClearValue) {
            const isObjectEqual =
              typeof newValue === "object" &&
              typeof value === "object" &&
              newValue?.value === value?.value;

            if (isObjectEqual || newValue === value) {
              newValue = "";
            }
          } else {
            if (newValue === value) return;
          }
          onChange(newValue);
          if (
            apiDependencies &&
            apiDependencies.clearFieldsOnChange &&
            apiDependencies.clearFieldsOnChange.length > 0
          ) {
            apiDependencies.clearFieldsOnChange.forEach((fieldName) => {
              setValue(fieldName, null);
            });
          }
          if (trigger) {
            void trigger(field.name); // Trigger validation for the field
          }
        };

        const { options, apiDependencies } = field;

        let dynamicOptions: { value: string | number; label: string }[] =
          options !== undefined && options?.length > 0 ? [...options] : [];

        if (apiDependencies?.endPoint) {
          const { options = [] } = useApiSelectField({
            apiDependencies,
            watch,
            fieldName: field.name,
          });

          dynamicOptions = [...(options || [])];
        }
        return (
          <SegmentedControlContainer inlineLabel={inlineLabel}>
            <SegmentedControlLabel
              variant="body2"
              error={Boolean(error)}
              inlineLabel={inlineLabel}
              labelMinWidth={labelMinWidth}
              labelCustomStyles={labelCustomStyles}
            >
              {field.rules?.required ? `${field.label} *` : field.label}
            </SegmentedControlLabel>
            <SegmentedControlFormWrapper
              customVariant={field?.componentProps?.variantType}
              inlineLabel={inlineLabel}
              wrapSegments={wrapSegments}
            >
              {dynamicOptions?.map((option) => (
                <Segment
                  customVariant={field?.componentProps?.variantType}
                  data-testid={`segmented-control-option-${
                    value === option.value
                  }`}
                  disableHover={shouldClearValue}
                  wrapSegments={wrapSegments}
                  key={option.value}
                  isSelected={
                    (enableSmartSearch ? value?.value : value) === option.value
                  }
                  disabled={field.componentProps?.disabled || !showField}
                  onClick={() => {
                    if (!field.componentProps?.disabled && showField) {
                      const val = enableSmartSearch ? option : option?.value;
                      handleChange(val);
                    }
                  }}
                >
                  {option.label}
                </Segment>
              ))}
            </SegmentedControlFormWrapper>
            {error && (
              <StyledHelperText error={!!error}>{helperText}</StyledHelperText>
            )}
          </SegmentedControlContainer>
        );
      }}
    />
  );
};

export default SegmentedControl;
