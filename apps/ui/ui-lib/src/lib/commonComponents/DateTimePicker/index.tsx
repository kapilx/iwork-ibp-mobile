import * as React from "react";
import {
  DateTimePicker as MUIDateTimePicker,
  DateTimePickerProps as MUIDateTimePickerProps,
} from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";
import DatePickerWrapper from "../DatePickerWrapper";

export interface DateTimePickerProps
  extends Omit<MUIDateTimePickerProps<Dayjs, never>, "localeText"> {
  type?: "primary" | "secondary";
  format?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  type = "primary",
  label,
  format,
  slotProps,
  ...restProps
}) => {
  // Use the format prop if provided, otherwise fall back to default formats based on type
  const inputFormat =
    format || (type === "secondary" ? "DD MMM YYYY HH:mm" : "DD/MM/YYYY HH:mm");

  const {
    className: popperClassName,
    style: popperStyle,
    disablePortal,
    ...popperRest
  } = slotProps?.popper ?? {};

  const mergedPopperProps = {
    disablePortal: disablePortal ?? true,
    ...popperRest,
    className: ["custom-popper-style", popperClassName]
      .filter(Boolean)
      .join(" "),
    style: {
      zIndex: 1701,
      ...(popperStyle ?? {}),
    },
  };

  const mergedSlotProps = {
    ...(slotProps ?? {}),
    popper: mergedPopperProps,
  };

  return (
    <DatePickerWrapper picker="DateTimePicker">
      <MUIDateTimePicker
        format={inputFormat}
        localeText={
          type === "secondary"
            ? { fieldMonthPlaceholder: () => "MMM" }
            : undefined
        }
        label={label || ""}
        ampm={false}
        timeSteps={{ hours: 1, minutes: 1 }}
        views={["year", "month", "day", "hours", "minutes"]}
        slotProps={mergedSlotProps}
        {...restProps}
      />
    </DatePickerWrapper>
  );
};

export default DateTimePicker;
