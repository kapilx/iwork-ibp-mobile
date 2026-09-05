import React, { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

import {
  TimePickerContainer,
  InputWrapper,
  StyledInput,
  Dropdown,
  DropdownOption,
  HelperText,
} from "./styles";

import {
  generateTimeOptions,
  formatHumanDuration,
} from "@ui/ui-lib/utils/DateFormat";

export interface TimePickerProps {
  value: Dayjs | null;
  onChange: (value: Dayjs, formattedValue: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  minTime?: Dayjs | null;
  autoSelectNextSlot?: boolean;
  startTimeForLabel?: Dayjs | null;
  cutoff?: { hour: number; minute: number };
  options?: string[];
  containerTestId?: string;
  inputTestId?: string;
  dropdownTestId?: string;
  optionTestId?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  minTime = null,
  autoSelectNextSlot = false,
  startTimeForLabel = null,
  cutoff = { hour: 23, minute: 30 },
  options,
  containerTestId = "time-picker-container",
  inputTestId = "time-picker-input",
  dropdownTestId = "time-picker-dropdown",
  optionTestId = "time-picker-option",
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const timeOptions =
    options ?? generateTimeOptions(15, minTime ?? null, false, cutoff);

  useEffect(() => {
    if (autoSelectNextSlot && !value) {
      const now = dayjs();
      const roundedUp = now
        .add(15 - (now.minute() % 15), "minute")
        .second(0)
        .millisecond(0);

      onChange(roundedUp, roundedUp.format("HH:mm"));
    }
  }, [autoSelectNextSlot, value, onChange]);

  useEffect(() => {
    if (open && dropdownRef.current && value) {
      requestAnimationFrame(() => {
        const dropdown = dropdownRef.current;
        const scrollToTime = value.format("hh:mm A");
        const selectedElement = dropdown?.querySelector(
          `[data-time="${scrollToTime}"]`
        );
        if (!dropdown || !selectedElement) return;

        const dropdownRect = dropdown.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        dropdown.scrollTop +=
          selectedRect.top -
          dropdownRect.top -
          (dropdown.clientHeight - selectedRect.height) / 2;
      });
    }
  }, [open, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <TimePickerContainer data-testid={containerTestId}>
      <InputWrapper>
        <StyledInput
          type="text"
          ref={inputRef}
          value={value ? value.format("hh:mm A") : ""}
          placeholder={placeholder || "Select time"}
          readOnly
          onClick={() => setOpen((prev) => !prev)}
          data-testid={inputTestId}
        />
      </InputWrapper>

      {helperText && <HelperText>{helperText}</HelperText>}

      {open && (
        <Dropdown ref={dropdownRef} data-testid={dropdownTestId}>
          {timeOptions.map((time) => {
            const timeObj = dayjs(time, "hh:mm A", true);
            if (!timeObj.isValid()) return null;

            const isSelected = value?.format("hh:mm A") === time;

            const durationLabel = startTimeForLabel
              ? formatHumanDuration(startTimeForLabel, timeObj)
              : "";

            return (
              <DropdownOption
                key={time}
                data-time={time}
                data-testid={`${optionTestId}-${time
                  .replace(/[:\s]/g, "-")
                  .toLowerCase()}`}
                className={isSelected ? "selected" : ""}
                onClick={() => {
                  onChange(timeObj, timeObj.format("HH:mm"));
                  setOpen(false);
                }}
              >
                {time} {durationLabel}
              </DropdownOption>
            );
          })}
        </Dropdown>
      )}
    </TimePickerContainer>
  );
};

export default TimePicker;