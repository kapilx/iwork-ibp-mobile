import { useEffect } from "react";
import {
  CombinedDivider,
  CombinedTimePickerWrapper,
  StyledLabelTypography,
  StyledPickerBox,
  StyledPickerLabelContainer,
  StyledTimeRangeContainer,
} from "./styles";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { useFormContext } from "react-hook-form";
import { getRoundedTime, parseBackendTime } from "@ui/ui-lib/utils/DateFormat";
import { ControlledField } from "../utils";

interface TimeRangeProps {
  field: {
    label: string;
    name: string;
    fromName: string;
    toName: string;
    fromLabel?: string;
    toLabel?: string;
    required?: boolean;
    rules?: any;
    componentProps?: any;
    disabled?: boolean; // Add disabled to field as well
  };
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean; // Add disabled prop
}

const TimeRange = ({ field, error, disabled = false }: TimeRangeProps) => {
  const { control, setValue, getValues, watch, formState } = useFormContext();

  // Get disabled state from multiple sources
  const isDisabled =
    disabled ||
    field?.componentProps?.disabled ||
    field?.disabled ||
    formState?.isSubmitting;
  const startTimeValueRaw = watch(field.fromName);
  const startTimeValue = parseBackendTime(startTimeValueRaw);

  useEffect(() => {
    const currentStart = getValues(field.fromName);
    const currentEnd = getValues(field.toName);
    if (!currentStart && !currentEnd) {
      const roundedStart = getRoundedTime();
      const roundedEnd = roundedStart.add(30, "minute");

      setValue(field.fromName, roundedStart.format("HH:mm:ssZ"), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(field.toName, roundedEnd.format("HH:mm:ssZ"), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.fromName, field.toName, isDisabled]); // getValues/setValue are stable in RHF

  const parsedStartTime = startTimeValue
    ? dayjs(startTimeValue, "HH:mm")
    : null;

  const minEndTime = parsedStartTime ? parsedStartTime.add(15, "minute") : null;

  const startsAtLastSlot = parsedStartTime?.format("HH:mm") === "23:45";

  return (
    <StyledTimeRangeContainer isDisabled={isDisabled}>
      <StyledPickerLabelContainer>
        {field?.fromLabel && (
          <StyledLabelTypography
            variant="body2"
            id={`${field?.fromName}-label`}
            isDisabled={isDisabled}
          >
            {field?.fromLabel}
            {field?.rules?.required && " *"}
          </StyledLabelTypography>
        )}
        {field?.toLabel && (
          <StyledLabelTypography
            variant="body2"
            id={`${field?.toName}-label`}
            isDisabled={isDisabled}
          >
            {field?.toLabel}
            {field?.rules?.required && " *"}
          </StyledLabelTypography>
        )}
      </StyledPickerLabelContainer>
      <StyledPickerBox>
        <ControlledField
          field={{
            ...field,
            name: field?.fromName,
            label: field?.fromLabel ?? "",
            rules: field?.rules,
            componentProps: {
              ...field.componentProps,
              disabled: isDisabled, // Pass disabled to componentProps
            },
          }}
          control={control}
          name={field.fromName}
          render={(sharedProps) => {
            const { label, value, onChange, helperText, ...rest } = sharedProps;

            return (
              <CombinedTimePickerWrapper
                {...rest}
                disabled={isDisabled}
                readOnly={isDisabled}
                value={
                  parseBackendTime(value)
                    ? dayjs(parseBackendTime(value), "HH:mm")
                    : null
                }
                containerTestId={`${field.fromName}-time-picker`}
                onChange={(newTime) => {
                  if (isDisabled) return;

                  const formatted = dayjs(newTime);
                  onChange(formatted.format("HH:mm:ssZ"));

                  // 2) Always set end = start + 30 minutes when start changes
                  const newEndTime = formatted.add(30, "minute");
                  setValue(field.toName, newEndTime.format("HH:mm:ssZ"), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                onFocus={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onKeyDown={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
                cutoff={{ hour: 23, minute: 45 }}
              />
            );
          }}
        />
        <CombinedDivider />
        <ControlledField
          field={{
            ...field,
            name: field?.toName,
            label: field?.toLabel ?? "",
            rules: field?.rules,
            componentProps: {
              ...field.componentProps,
              disabled: isDisabled, // Pass disabled to componentProps
            },
          }}
          control={control}
          name={field.toName}
          render={(sharedProps) => {
            const { label, value, onChange, helperText, ...rest } = sharedProps;

            return (
              <CombinedTimePickerWrapper
                {...rest}
                disabled={isDisabled}
                readOnly={isDisabled}
                value={
                  parseBackendTime(value)
                    ? dayjs(parseBackendTime(value), "HH:mm")
                    : null
                }
                containerTestId={`${field.toName}-time-picker`}
                onChange={(newTime) => {
                  if (isDisabled) return;

                  const formatted = dayjs(newTime);
                  onChange(formatted.format("HH:mm:ssZ"));
                }}
                onFocus={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onKeyDown={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
                minTime={minEndTime}
                startTimeForLabel={parsedStartTime}
                cutoff={{ hour: 23, minute: 45 }}
                options={
                  startsAtLastSlot ? ["12:00 AM", "12:15 AM"] : undefined
                }
              />
            );
          }}
        />
      </StyledPickerBox>
    </StyledTimeRangeContainer>
  );
};

export default TimeRange;
